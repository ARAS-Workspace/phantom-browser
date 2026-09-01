# witness-1

Runs the witnesses the phantom commits declare, against a built browser.

A check declares what it is a witness for and returns a verdict. `--red` puts the
disabled features back: a red-gated check that stays green there is a fake, not a
witness.

## Usage

```bash
./run.py                      # both passes, one table
./run.py --green              # only the green pass
./run.py --red                # only the red pass
./run.py --self-test          # prove the integrity gate can fail
./run.py --headless           # no window, for ci
./run.py --browser <path>     # a build other than out/arm64
```

Exit code is non-zero when a check fails or a red-gated check stays green.

## Preconditions

The table is not printed at all when one of these fails, because nothing in it
would be measuring us.

| check | holds when |
|---|---|
| `harness-integrity` | every check file parsed and ran |
| `secure-context` | the page is a secure context, so SecureContext gates mean ours |
| `positive-control` | `crypto.subtle` and `navigator.credentials` are still there |


## Declared without a check

These commits declare a witness the harness cannot run today. They are listed so
that a missing row reads as a known gap rather than as an absence of work. Each
says why, and the reason is measured, not assumed.

This list used to be longer. Settings markup ships inside `resources.pak` in
brotli-compressed records this harness does not decompress, so for a while no
settings surface could be witnessed at all. Removing the strings those surfaces
had orphaned moved five of these commits into the table below, because a string
that no longer ships is readable in `locale.pak` even when the markup is not.
What is left needs a different kind of proof: a request that leaves the browser
process is invisible to a page, which is what witness-2 is for; a service that
is never built leaves nothing to read; a navigation the harness does not drive
cannot be observed; and a surface whose remaining strings are words the browser
still uses elsewhere cannot be told apart from them.

| commit | declares | why no check |
|---|---|---|
| [`9f4678b67f`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/9f4678b67f005f8cd8d21548ad0204a28f5ba892) | the autofill server is never asked to classify a form | the request leaves the browser process; nothing a page can see, and the host string still ships because only the gate was closed |
| [`a3a3e3d66a`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/a3a3e3d66aba90eb59209c7aff6ee5d40b80aacf) | no profile builds a password status check service | a service that is never constructed leaves nothing to read from outside |
| [`c5591f5771`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/c5591f5771d483aad613244f8c8a79383ecfbbca) | visiting the google password site no longer closes its own tab | needs a navigation the harness does not drive; confirmed by hand |
| [`e5b40e8a27`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/e5b40e8a278021a7463d08645b23c5b0e62cc1a7) | five internals and application pages are not served and six hosts are not suggested | chrome pages cannot be opened from a harness page, and the address table these hosts left is read by the omnibox rather than written into any artifact |
| [`fba12b4f30`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/fba12b4f304ca90fcc0afb1e209d5136d6f376d9) | the translate internals page is not built and chrome about lists neither it nor the password manager | the page's own text is not localised and ships inside the compressed resource bundle, and the host table is rendered by a chrome page the harness cannot open |
| [`acc62e68f7`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/acc62e68f7b25a348495ebce9c8469fa1d35370a) | safety check reports no version and offers no education block | same compressed pak |

## Checks

Each commit links to the change it is a witness for, in
[phantom-browser-core](https://github.com/ARAS-Workspace/phantom-browser-core).

| check | commit | red | witnesses |
|---|---|---|---|
| `accessibility-section-strings` | [`b3819a8f26`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/b3819a8f269161448e4767a06cc3692f7fbd02cd) [`1544ddc9b2`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/1544ddc9b2328f7643bca29e5e020c64b73fb509) | — | the accessibility section's own strings are not in the shipped resources |
| `advanced-protection-url` | [`d0a5407281`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/d0a540728145b622de81ec4476674a4f7a40ca86) | — | the framework carries no landing address for the advanced protection programme |
| `app-helper-binaries` | [`9c4f833a09`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/9c4f833a092ba76163231d8ab39accdcd4a39475) | — | no shipped executable exists only to make an installed app |
| `battery` | [`5c2ec8efe2`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/5c2ec8efe2ec714a33d6d5c4894d995ce5c9f5da) | yes | the battery status api is absent |
| `cpu-performance` | [`0b722323b7`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/0b722323b7d264b66f0b4ff750ce777c7668c393) | yes | the one to four hardware class is absent |
| `device-apis` | [`a2b457f072`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/a2b457f072123ac566049f72c1e0f9944a5a82ba) | yes | usb, hid, bluetooth, serial and the gamepad list are absent |
| `device-memory` | [`3c38f49f33`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/3c38f49f33ccebfc92dd2b26ae607fdb40e34e12) | — | the memory tier is absent and the core count reads eight |
| `font-filter` | [`b4f2300f1a`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/b4f2300f1a4677d6ca96295528126758d45271dc) | — | only typefaces under the system font directory resolve |
| `font-probe-control` | [`b4f2300f1a`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/b4f2300f1a4677d6ca96295528126758d45271dc) | — | the width probe tells a real family from an invented one |
| `form-data-option` | [`57b50e2c51`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/57b50e2c519d0d8b6978a28e0adf866cd1a5069c) [`8cd33b5365`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/8cd33b536581f17994377d0aca9d1a4fec644aa9) | — | neither the delete dialog nor the import dialog offers autofill form data |
| `gamepad-interfaces` | [`66dd8125a5`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/66dd8125a57356f3a4e06f3816da0b31fe0aaf5f) | yes | the four gamepad interface objects are absent |
| `geolocation` | [`99d4bb62b9`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/99d4bb62b93eff1d7aee3d75b03eab7a975d937c) | — | every position resolves to the one fixed point |
| `hosted-app-data-option` | [`8cd33b5365`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/8cd33b536581f17994377d0aca9d1a4fec644aa9) | — | the delete dialog no longer offers hosted app data |
| `js-heap-limit` | [`a86aff6778`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/a86aff6778ef51449dd155509f11a69de1c34fb1) | — | the v8 heap limit is the same number everywhere |
| `keyboard-layout` | [`9ec6c28a0f`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/9ec6c28a0f82e7d886a8bca251feb5e131c368b3) | — | a fixed us layout of forty seven entries |
| `leak-detection-strings` | [`e46c63ac1b`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/e46c63ac1b5b7c5ad8a26583a2f4fc985916413d) [`1544ddc9b2`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/1544ddc9b2328f7643bca29e5e020c64b73fb509) | — | no compromised password detection row is named anywhere in the strings |
| `local-font-access` | [`2390c75581`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/2390c75581125ae22c3f9a13a8fcbe6c90810a46) | yes | `queryLocalFonts` and `FontData` are absent |
| `netinfo-hints` | [`29df60052d`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/29df60052dcd7e4c3f1ea5957697c1d4cfc670a1) | — | the rtt, downlink and ect headers are fixed |
| `netinfo-js` | [`29df60052d`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/29df60052dcd7e4c3f1ea5957697c1d4cfc670a1) | yes | `navigator.connection` is absent |
| `on-device-translation` | [`f71c964552`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/f71c964552ccb5919f0aaa50c5d650acb2b5097e) | yes | no page finds a translator or a language detector interface |
| `password-leak-endpoint` | [`e7a47a978d`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/e7a47a978d5cb75a89bf82938fb0c1fd0ab4f832) | — | the shipped binary carries no leak lookup path |
| `privacy-guide-strings` | [`71962fc25d`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/71962fc25ddc52e961cea8c804537a23770dae82) [`1544ddc9b2`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/1544ddc9b2328f7643bca29e5e020c64b73fb509) | — | the privacy guide's own heading does not ship |
| `pwa-install` | [`1e2bd73662`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/1e2bd736622341bcca052281d091c1ef19dea9a6) | yes | the install prompt and the related apps query are absent |
| `reading-mode-strings` | [`71b173678d`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/71b173678d16850ae260bf1916c39b8469455e78) [`8f95aed635`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/8f95aed635d89da70657c11325089286ed910bcf) | — | neither reading mode context menu string ships |
| `safety-hub-password-card-strings` | [`ac37598e50`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/ac37598e503fc6ac6c25bbbaf45a93e9a72efcaa) [`1544ddc9b2`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/1544ddc9b2328f7643bca29e5e020c64b73fb509) | — | the safety hub password card's own text does not ship |
| `security-keys-strings` | [`f8521c87ab`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/f8521c87ab9b6fcdf5f3d838413c959b0414fffd) [`1544ddc9b2`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/1544ddc9b2328f7643bca29e5e020c64b73fb509) | — | the security key manager title does not ship, while the ceremony keeps its own three |
| `shape-detection` | [`43573e45f5`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/43573e45f5373104dc7000336c9343707bebcbf6) | yes | BarcodeDetector, FaceDetector and TextDetector are absent |
| `speech` | [`ae2ee271d5`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/ae2ee271d5006f507489d27702ad6ae33704a33b) | yes | the fifteen web speech names are absent |
| `speech-menu-strings` | [`bd18790f21`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/bd18790f214900262954d3462b4d0e61bf90dc70) | — | the shipped english strings carry no Start or Stop Speaking |
| `speech-symbols` | [`e440b9758f`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/e440b9758f6772d9200305f5dedeedf8e966c83a) [`0da90c3b44`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/0da90c3b44f32940e6e8b351575c43693df34b74) | — | the framework links no AVSpeech or NSSpeech symbol |
| `time-zone` | [`c82843dc63`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/c82843dc6318451d9a1fe989c670541bb9ca0ad3) | — | the zone is Europe/Istanbul while the browser runs elsewhere |
| `translate-settings-strings` | [`249059a2c7`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/249059a2c712b2efdd286758a956f41836659c23) [`1544ddc9b2`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/1544ddc9b2328f7643bca29e5e020c64b73fb509) | — | the translate settings label does not ship |
| `ua-ch` | [`626ef1a669`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/626ef1a669db1150ee03152ddec39e476de6cd4b) | — | platform version and architecture agree with the frozen agent |
| `web-midi` | [`96c02a5df6`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/96c02a5df65758384aea8fc474e54e6420b9b44b) | yes | `requestMIDIAccess` and the eight interfaces are absent |
| `webgl-renderer` | [`513405f6da`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/513405f6da319e70b93288dc1134f55cc3abbeb1) | — | the unmasked renderer and vendor are the two safari strings |
| `webgl-timer-query` | [`faa8d29943`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/faa8d29943e4be1a05dc1907091e7df844c5775b) | — | the disjoint timer query extensions are absent |
| `worker-surfaces` | [`faa8d29943`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/faa8d29943e4be1a05dc1907091e7df844c5775b) [`a2b457f072`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/a2b457f072123ac566049f72c1e0f9944a5a82ba) [`3c38f49f33`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/3c38f49f33ccebfc92dd2b26ae607fdb40e34e12) [`29df60052d`](https://github.com/ARAS-Workspace/phantom-browser-core/commit/29df60052dcd7e4c3f1ea5957697c1d4cfc670a1) | yes | the same closures hold inside a worker |

A check with no `red` mark is not restorable by a flag; it fails on its own value
instead, so a red pass reports it without judging it.

`geolocation` reports as `MANUAL`. Chromium grants that permission through a
prompt or devtools and neither a seeded profile nor the policy pref reaches the
decision, so the fixed point is confirmed by hand and the row is reported
without being counted either way.

## Layout

```
run.py            entry point: serve, drive the browser, report
src/page.html     shell; run.py injects the check list into it
src/harness.js    register, the path helpers, the runner
src/worker.js     the worker probe
src/checks/       one file per check
```

Each check file runs in its own scope. Adding a witness is one file under
`src/checks/`; nothing else changes.
