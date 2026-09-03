// The worker half of several witnesses: the mixins we removed reached
// WorkerNavigator too, so closing only the window would be half a job.
(() => {
  register({
    id: "worker-surfaces",
    commit: "2baa2d809c+a107586c4d+0b6c6c7148+5ab19bca41",
    redGated: true,
    async run() {
      let answer;
      try {
        const worker = new Worker("/worker.js");
        answer = await new Promise((resolve, reject) => {
          worker.onmessage = (e) => resolve(e.data);
          worker.onerror = (e) => reject(new Error(e.message));
          setTimeout(() => reject(new Error("worker timeout")), 10000);
        });
      } catch (e) {
        return {ok: false, detail: String(e)};
      }
      return {
        ok: Array.isArray(answer.leftover) && answer.leftover.length === 0,
        detail: "leftover in worker: " + JSON.stringify(answer.leftover),
      };
    },
  });
})();
