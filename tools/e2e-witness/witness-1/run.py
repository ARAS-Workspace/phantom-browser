#!/usr/bin/env python3
"""Runs the witnesses the phantom commits declare, against a built browser."""

import argparse
import http.server
import json
import os
import queue
import shutil
import socket
import subprocess
import sys
import tempfile
import threading

HERE = os.path.dirname(os.path.abspath(__file__))
# …/tools/e2e-witness/witness-1 -> the phantom-browser checkout
ROOT = os.path.abspath(os.path.join(HERE, os.pardir, os.pardir, os.pardir))
DEFAULT_BROWSER = os.path.join(
    ROOT, "chromium", "src", "out", "arm64",
    "Chromium.app", "Contents", "MacOS", "Chromium")


def framework_of(browser):
    """The framework that belongs to the given binary, not to a fixed build."""
    app = os.path.dirname(os.path.dirname(os.path.dirname(browser)))
    return os.path.join(app, "Contents", "Frameworks",
                        "Chromium Framework.framework", "Versions", "Current",
                        "Chromium Framework")


def locale_pak_of(browser):
    """The english strings that ship with the given binary."""
    app = os.path.dirname(os.path.dirname(os.path.dirname(browser)))
    return os.path.join(app, "Contents", "Frameworks",
                        "Chromium Framework.framework", "Versions", "Current",
                        "Resources", "en.lproj", "locale.pak")


# The browser is started in a zone that is not ours, so that the time zone
# witness fails when the override is missing instead of agreeing with the host.
HOST_TZ = "America/Los_Angeles"

# Blink runtime features we switched off. --red turns them back on: every check
# marked red_gated must fail in that run, or it is not measuring our flag.
RED_FEATURES = [
    "BatteryStatus", "WebMIDI", "ScriptedSpeechSynthesis",
    "ScriptedSpeechRecognition", "UnprefixedSpeechRecognition",
    "WebSpeechRecognitionContext", "AppBanner", "InstalledApp",
    "NetworkInformationAPI", "CpuPerformance", "FontAccess", "Gamepad",
    "WebUSB", "WebHID", "WebBluetooth", "Serial", "BarcodeDetector",
    "TranslationAPI", "LanguageDetectionAPI",
]


SRC = os.path.join(HERE, "src")
CHECKS = os.path.join(SRC, "checks")
JS = "text/javascript; charset=utf-8"
ASSETS = {
    "/harness.js": ("harness.js", JS),
    "/worker.js": ("worker.js", JS),
}
REQUIRED = ["page.html"] + [name for name, _ in ASSETS.values()]


def read_asset(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as handle:
        return handle.read()


def check_files():
    """Every check under src/checks, in the order the report will show them."""
    return sorted(n for n in os.listdir(CHECKS) if n.endswith(".js"))


BROKEN_CHECK = "__broken.js"


def render_page(self_test=False):
    names = check_files()
    if self_test:
        names = names + [BROKEN_CHECK]
    tags = "\n".join('<script src="/checks/%s"></script>' % name
                      for name in names)
    files = "<script>window.CHECK_FILES = %s;</script>" % json.dumps(names)
    return (read_asset("page.html")
            .replace("<!--FILES-->", files)
            .replace("<!--CHECKS-->", tags))


class WitnessServer(http.server.ThreadingHTTPServer):
    """A server that carries the queue the page posts its results into."""

    def __init__(self, address, handler_class, self_test=False):
        super().__init__(address, handler_class)
        self.results = queue.Queue()
        self.self_test = self_test


# do_GET and do_POST are named by BaseHTTPRequestHandler, not by us.
# noinspection PyPep8Naming
class Handler(http.server.BaseHTTPRequestHandler):

    def log_message(self, *args):
        pass

    def _send(self, body, ctype, extra=()):
        raw = body.encode() if isinstance(body, str) else body
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        # Ask for the network quality hints so the next request carries them.
        self.send_header("Accept-CH", "rtt, downlink, ect, device-memory")
        for k, v in extra:
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/":
            self._send(render_page(self.server.self_test),
                       "text/html; charset=utf-8")
        elif path == "/checks/" + BROKEN_CHECK and self.server.self_test:
            # Deliberately unparseable, to prove the integrity gate can fail.
            self._send("const = ;", JS)
        elif path in ASSETS:
            name, ctype = ASSETS[path]
            self._send(read_asset(name), ctype)
        elif path.startswith("/checks/") and path[8:] in check_files():
            self._send(read_asset(os.path.join("checks", path[8:])), JS)
        elif path == "/hints":
            seen = {k.lower(): v for k, v in self.headers.items()}
            self._send(json.dumps({
                "rtt": seen.get("rtt"),
                "downlink": seen.get("downlink"),
                "ect": seen.get("ect"),
                "device-memory": seen.get("device-memory"),
            }), "application/json")
        else:
            self.send_error(404)

    def do_POST(self):
        if self.path != "/result":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode()
        self._send("ok", "text/plain")
        self.server.results.put(json.loads(body))


def free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def seed_profile(directory, origin):
    """Grant geolocation to `origin` before the browser starts."""
    default = os.path.join(directory, "Default")
    os.makedirs(default, exist_ok=True)
    prefs = {
        "profile": {
            # The policy provider outranks the per site setting, and it reads
            # this list straight out of the pref service.
            "managed_geolocation_allowed_for_urls": [origin],
            "default_content_setting_values": {"geolocation": 1},
            "content_settings": {
                "exceptions": {
                    "geolocation": {
                        origin + ",*": {"setting": 1},
                        origin + "," + origin: {"setting": 1},
                    }
                }
            },
        }
    }
    with open(os.path.join(default, "Preferences"), "w") as f:
        json.dump(prefs, f)


def framework_has_speech_symbols(framework):
    """e440b9758f — the mock must not reach AVFoundation speech at all."""
    if not os.path.exists(framework):
        return None, "framework not found at " + framework
    out = subprocess.run(["nm", "-u", framework], capture_output=True, text=True)
    if out.returncode != 0:
        return None, "nm failed: " + out.stderr.strip().splitlines()[0]
    hits = sorted({l.strip() for l in out.stdout.splitlines()
                   if "AVSpeech" in l or "NSSpeechSynthesizer" in l})
    return len(hits) == 0, ", ".join(hits) if hits else "no AVSpeech or NSSpeech symbol"


def helpers_dir_of(browser):
    """The executables that ship beside the framework's own helpers."""
    app = os.path.dirname(os.path.dirname(os.path.dirname(browser)))
    return os.path.join(app, "Contents", "Frameworks",
                        "Chromium Framework.framework", "Versions", "Current",
                        "Helpers")


def helpers_carry_app_makers(helpers):
    """Nothing ships whose only work is to write or launch an installed app."""
    if not os.path.isdir(helpers):
        return None, "no Helpers directory at " + helpers
    present = [n for n in ("app_mode_loader", "web_app_shortcut_copier")
               if os.path.exists(os.path.join(helpers, n))]
    return not present, (", ".join(present) + " still ships"
                         if present else "neither app maker ships")


def framework_has_leak_endpoint(framework):
    """The leak check path is ours; the bare host also sits in the hsts list."""
    if not os.path.exists(framework):
        return None, "framework not found at " + framework
    with open(framework, "rb") as f:
        blob = f.read()
    hit = b"leaks:lookupSingle" in blob
    return not hit, ("the leaks lookupSingle path still ships" if hit
                     else "no leaks lookupSingle path")


# A google address the framework still carries, read before the absence below
# so that an unreadable binary reports itself instead of reading green.
SHIPPED_GOOGLE_HOST = b"myaccount.google.com"


def framework_has_lens_upload_endpoints(framework):
    """The addresses the lens overlay uploaded pictures to are not shipped."""
    if not os.path.exists(framework):
        return None, "framework not found at " + framework
    with open(framework, "rb") as f:
        blob = f.read()
    if SHIPPED_GOOGLE_HOST not in blob:
        return None, "the framework does not read like a chromium binary"
    hits = [s for s in (b"lensfrontend-pa.googleapis.com", b"/v1/uploadChunk",
                        b"/v1/crupload", b"lens.google.com/v3/") if s in blob]
    return not hits, (", ".join(h.decode() for h in hits) + " still ships"
                      if hits else "no lens upload address")


def framework_has_closed_feature_hosts(framework):
    """Addresses for work this browser no longer does are not compiled in."""
    if not os.path.exists(framework):
        return None, "framework not found at " + framework
    with open(framework, "rb") as f:
        blob = f.read()
    if SHIPPED_GOOGLE_HOST not in blob:
        return None, "the framework does not read like a chromium binary"
    # The translate host is also a line in the static hsts preload list, which
    # ships with every build and is not ours to touch, so the path this fork
    # removed is read instead of the host. The autofill host is not in that
    # list and can be read whole.
    hits = [s for s in (b"content-autofill.googleapis.com",
                        b"translate_a/element.js") if s in blob]
    return not hits, (", ".join(h.decode() for h in hits) + " still ships"
                      if hits else "no autofill server, no translate script")


def framework_has_advanced_protection_url(framework):
    """The settings page no longer assembles the enrolment landing address."""
    if not os.path.exists(framework):
        return None, "framework not found at " + framework
    with open(framework, "rb") as f:
        blob = f.read()
    if SHIPPED_GOOGLE_HOST not in blob:
        return None, "the framework does not read like a chromium binary"
    hits = [s for s in (b"landing.google.com/advancedprotection",
                        b"ChromeSecuritySettings") if s in blob]
    return not hits, (", ".join(h.decode() for h in hits) + " still ships"
                      if hits else "no advanced protection landing address")


def locale_pak_has_speech_menu(pak):
    """The speech submenu and the strings it was built from are both gone."""
    if not os.path.exists(pak):
        return None, "locale.pak not found at " + pak
    with open(pak, "rb") as f:
        blob = f.read()
    hits = [s for s in (b"Start Speaking", b"Stop Speaking") if s in blob]
    return not hits, (", ".join(h.decode() for h in hits) + " still shipped"
                      if hits else "neither menu string ships")


# Strings this browser still ships, read before any absence is reported so that
# an unreadable or wrong pak says so instead of reading green. Each absence
# check names the control that covers its own part of the string table.
SHIPPED_SETTINGS_OPTION = b"Cached images and files"
SHIPPED_READING_MODE_STRING = b"Read comfortably with minimal distractions"


def locale_pak_lacks_option(pak, option):
    """An option this browser no longer offers is not among its strings."""
    if not os.path.exists(pak):
        return None, "locale.pak not found at " + pak
    with open(pak, "rb") as f:
        blob = f.read()
    if SHIPPED_SETTINGS_OPTION not in blob:
        return None, "the shipped strings do not look like the settings list"
    name = option.decode()
    gone = option not in blob
    return gone, ("no %s option" % name if gone else "%s still shipped" % name)


def locale_pak_lacks_strings(pak, absent, control, control_name):
    """Strings for a surface this browser removed are not among the ones it
    ships. The control is a neighbouring string that is still shipped, so a pak
    that cannot be read reports itself rather than reading as an absence."""
    if not os.path.exists(pak):
        return None, "locale.pak not found at " + pak
    with open(pak, "rb") as f:
        blob = f.read()
    if control not in blob:
        return None, "the shipped strings do not carry " + control_name
    hits = [s for s in absent if s in blob]
    if hits:
        return False, ", ".join(h.decode() for h in hits) + " still shipped"
    if len(absent) == 1:
        return True, "%s does not ship" % absent[0].decode()
    return True, "none of the %d strings ship" % len(absent)

PRECONDITIONS = ("harness-integrity", "secure-context", "positive-control")


def verdict(result, red):
    """Label for one result, and whether it counts against the run."""
    if result.get("manual"):
        # Confirmed by hand; the harness cannot drive it, so it is reported
        # without being counted either way.
        return ("MANUAL", False)
    if not red:
        return ("PASS", False) if result["ok"] else ("FAIL", True)
    if not result["red_gated"]:
        # Not restorable by a flag, so a red run reports it without judging it.
        return ("PASS" if result["ok"] else "FAIL"), False
    # The flag is back on, so the surface must be back. Staying green means the
    # check was never measuring our flag.
    return ("FAKE", True) if result["ok"] else ("RED-OK", False)


def preflight(args):
    if not os.path.isfile(os.path.join(ROOT, "scripts", "sync.sh")):
        sys.exit("witness: ROOT resolved to %s, which is not a phantom-browser "
                 "checkout; this file moved and the path math above needs "
                 "updating" % ROOT)

    absent = [n for n in REQUIRED if not os.path.isfile(os.path.join(SRC, n))]
    if absent:
        sys.exit("witness: missing asset(s) under %s: %s" % (SRC, ", ".join(absent)))

    if not os.path.isdir(CHECKS) or not check_files():
        sys.exit("witness: no checks under %s, so the run would report an empty "
                 "table and call it a pass" % CHECKS)

    if not os.path.exists(args.browser):
        sys.exit("witness: no browser at " + args.browser)


def browser_argv(args, profile, origin, red):
    argv = [args.browser,
            "--user-data-dir=" + profile,
            "--use-mock-keychain",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-search-engine-choice-screen",
            "--disable-features=DialMediaRouteProvider",
            *(["--enable-logging=stderr", "--v=0",
               "--vmodule=permission*=2,geolocation*=2,*content_setting*=2"]
              if args.browser_log else []),
            "--window-size=900,700"]
    if args.headless:
        argv.append("--headless=new")
    if red:
        argv.append("--enable-blink-features=" + ",".join(RED_FEATURES))
    argv.append(origin + "/")
    return argv


def collect(args, origin, profile, server, red):
    """Drive the browser once and return what the page reported, or None."""
    # The host is already in Istanbul, so the time zone check could not go red
    # unless the browser is started somewhere else.
    env = dict(os.environ, TZ=HOST_TZ)
    quiet = None if args.browser_log else subprocess.DEVNULL
    proc = subprocess.Popen(browser_argv(args, profile, origin, red), env=env,
                            stdout=quiet, stderr=quiet)
    try:
        return server.results.get(timeout=args.timeout)
    except queue.Empty:
        return None
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
        server.shutdown()
        if args.keep_profile:
            print("witness: profile kept at " + profile)
        else:
            shutil.rmtree(profile, ignore_errors=True)


def report(green, red):
    """Print one table for both passes and return how many count against us."""
    order, seen = [], set()
    for results in (green, red):
        for result in results or []:
            if result["id"] not in PRECONDITIONS and result["id"] not in seen:
                seen.add(result["id"])
                order.append(result["id"])
    by_mode = {mode: {r["id"]: r for r in (results or [])}
               for mode, results in (("green", green), ("red", red))}

    failures = fakes = gated = 0
    # The column is as wide as the longest name, so a new check cannot silently
    # push the table out of alignment.
    width = max([len("CHECK")] + [len(name) for name in order])
    row = "  %-" + str(width) + "s %-11s %-7s %-7s %s"
    print()
    print(row % ("CHECK", "COMMIT", "GREEN", "RED", "DETAIL"))
    print("  " + "-" * (width + 54))
    for name in order:
        cells, detail = {}, ""
        for mode, is_red in (("green", False), ("red", True)):
            found = by_mode[mode].get(name)
            if found is None:
                cells[mode] = "-"
                continue
            label, counts = verdict(found, is_red)
            cells[mode] = label
            if is_red and found["red_gated"]:
                gated += 1
                fakes += counts
            elif not is_red:
                failures += counts
            # The green detail is the interesting one; fall back to the red pass.
            if detail == "" or not is_red:
                detail = found["detail"]
        if cells["red"] in ("PASS", "FAIL"):
            cells["red"] = "."          # not restorable by a flag, so not judged
        print(row
              % (name, by_mode["green"].get(name, by_mode["red"].get(name, {}))
                 .get("commit", "")[:10], cells["green"], cells["red"], detail))

    print()
    if green is not None:
        print("witness: green pass — %d of %d checks failed"
              % (failures, len(order)))
    if red is not None:
        print("witness: red pass — %d of %d flag gated checks went red, %d fake"
              % (gated - fakes, gated, fakes))
    return failures + fakes


def failed_preconditions(results):
    by_id = {r["id"]: r for r in results}
    return [name for name in PRECONDITIONS
            if by_id.get(name, {}).get("ok") is not True]


def demand_preconditions(results):
    bad = failed_preconditions(results)
    if not bad:
        return
    by_id = {r["id"]: r for r in results}
    for name in PRECONDITIONS:
        found = by_id.get(name)
        print("  %-22s %s" % (name, found["detail"] if found else "missing"))
    sys.exit("witness: INVALID — a check file never ran, the run was not in a "
             "secure context, or a surface we never touched is missing; nothing "
             "in this table is measuring us")


def run_pass(args, red):
    """One browser launch, from serving the page to what it reported back."""
    port = free_port()
    origin = "http://127.0.0.1:%d" % port
    server = WitnessServer(("127.0.0.1", port), Handler, args.self_test)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    profile = tempfile.mkdtemp(prefix="phantom-witness-")
    seed_profile(profile, origin)

    print("witness: %s pass%s, browser started with TZ=%s"
          % ("RED" if red else "GREEN",
             " (headless)" if args.headless else "", HOST_TZ))
    results = collect(args, origin, profile, server, red)
    if results is None:
        sys.exit("witness: the page never reported back within %ds" % args.timeout)

    # The artifact witnesses need no browser.
    ok, detail = framework_has_speech_symbols(framework_of(args.browser))
    if ok is not None:
        results.append({"id": "speech-symbols", "commit": "e440b9758f",
                        "ok": ok, "detail": detail, "red_gated": False,
                        "manual": False})
    ok, detail = locale_pak_has_speech_menu(locale_pak_of(args.browser))
    if ok is not None:
        results.append({"id": "speech-menu-strings", "commit": "bd18790f21",
                        "ok": ok, "detail": detail, "red_gated": False,
                        "manual": False})
    ok, detail = framework_has_leak_endpoint(framework_of(args.browser))
    if ok is not None:
        results.append({"id": "password-leak-endpoint", "commit": "e7a47a978d",
                        "ok": ok, "detail": detail, "red_gated": False,
                        "manual": False})
    ok, detail = framework_has_advanced_protection_url(
        framework_of(args.browser))
    if ok is not None:
        results.append({"id": "advanced-protection-url", "commit": "d0a5407281",
                        "ok": ok, "detail": detail, "red_gated": False,
                        "manual": False})
    ok, detail = framework_has_lens_upload_endpoints(framework_of(args.browser))
    if ok is not None:
        results.append({"id": "lens-upload-endpoints", "commit": "6146b4d3e2",
                        "ok": ok, "detail": detail, "red_gated": False,
                        "manual": False})
    ok, detail = framework_has_closed_feature_hosts(framework_of(args.browser))
    if ok is not None:
        results.append({"id": "closed-feature-hosts", "commit": "a019850d10",
                        "ok": ok, "detail": detail, "red_gated": False,
                        "manual": False})
    ok, detail = helpers_carry_app_makers(helpers_dir_of(args.browser))
    if ok is not None:
        results.append({"id": "app-helper-binaries", "commit": "9c4f833a09",
                        "ok": ok, "detail": detail, "red_gated": False,
                        "manual": False})
    pak = locale_pak_of(args.browser)
    ok, detail = locale_pak_lacks_option(pak, b"Autofill form data")
    if ok is not None:
        results.append({"id": "form-data-option", "commit": "8cd33b5365",
                        "ok": ok, "detail": detail, "red_gated": False,
                        "manual": False})
    ok, detail = locale_pak_lacks_option(pak, b"Hosted app data")
    if ok is not None:
        results.append({"id": "hosted-app-data-option", "commit": "8cd33b5365",
                        "ok": ok, "detail": detail, "red_gated": False,
                        "manual": False})
    for check_id, commit, absent, control, control_name in (
            ("security-keys-strings", "f8521c87ab",
             [b"Manage security keys"],
             SHIPPED_SETTINGS_OPTION, "the settings list"),
            ("privacy-guide-strings", "71962fc25d",
             [b"A guide of your privacy choices"],
             SHIPPED_SETTINGS_OPTION, "the settings list"),
            ("translate-settings-strings", "249059a2c7",
             [b"Use Google Translate"],
             SHIPPED_SETTINGS_OPTION, "the settings list"),
            ("leak-detection-strings", "e46c63ac1b",
             [b"Compromised password detection"],
             SHIPPED_SETTINGS_OPTION, "the settings list"),
            ("reading-mode-strings", "8f95aed635",
             [b"Open in Reading Mode", b"Listen to This Page"],
             SHIPPED_READING_MODE_STRING, "the reading mode strings"),
            ("safety-hub-password-card-strings", "ac37598e50",
             [b"No weak or reused passwords"],
             SHIPPED_SETTINGS_OPTION, "the settings list"),
            ("accessibility-section-strings", "b3819a8f26",
             [b"Copied to clipboard confirmations"],
             SHIPPED_SETTINGS_OPTION, "the settings list"),
    ):
        ok, detail = locale_pak_lacks_strings(pak, absent, control, control_name)
        if ok is not None:
            results.append({"id": check_id, "commit": commit, "ok": ok,
                            "detail": detail, "red_gated": False,
                            "manual": False})
    return results


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--browser", default=DEFAULT_BROWSER)
    ap.add_argument("--headless", action="store_true",
                    help="run without a window (for ci; the gpu path differs)")
    ap.add_argument("--green", action="store_true",
                    help="only the green pass")
    ap.add_argument("--red", action="store_true",
                    help="only the red pass, which turns the disabled features "
                         "back on so a check that stays green is named a fake")
    ap.add_argument("--browser-log", action="store_true",
                    help="let the browser write to stderr instead of discarding "
                         "it, for asking it why it did something")
    ap.add_argument("--keep-profile", action="store_true",
                    help="leave the throwaway profile on disk and print its "
                         "path, for looking at what the browser wrote back")
    ap.add_argument("--self-test", action="store_true",
                    help="serve one unparseable check and expect the run to be "
                         "declared invalid; proves the integrity gate can fail")
    ap.add_argument("--timeout", type=int, default=120)
    args = ap.parse_args()

    preflight(args)

    if args.self_test:
        results = run_pass(args, red=False)
        if "harness-integrity" in failed_preconditions(results):
            print("witness: self-test passed — an unparseable check file made "
                  "the run invalid, so the gate can fail")
            sys.exit(0)
        sys.exit("witness: self-test FAILED — an unparseable check file was "
                 "served and the run still called itself valid")

    both = not (args.green or args.red)
    green = run_pass(args, red=False) if both or args.green else None
    red = run_pass(args, red=True) if both or args.red else None
    for results in (green, red):
        if results is not None:
            demand_preconditions(results)
    sys.exit(1 if report(green, red) else 0)


if __name__ == "__main__":
    main()
