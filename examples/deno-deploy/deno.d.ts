// Minimal ambient shim so plain `tsc --noEmit` typechecks `main.ts` without the
// Deno toolchain installed. The real `Deno` namespace is far larger; this
// declares only the single API this example touches. On Deno Deploy the real
// global supersedes it.
declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => unknown;
};
