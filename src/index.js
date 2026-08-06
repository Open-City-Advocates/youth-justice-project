// Assets are served directly for every path except "/" (see run_worker_first in
// wrangler.jsonc). The site builds with uglyURLs, so asset routing is set to
// "none" to serve real ".html" paths verbatim -- but that also means the bare
// root has no matching asset. This maps "/" to the homepage without redirecting.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      url.pathname = "/index.html";
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  },
};
