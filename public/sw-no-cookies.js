/*
 * Loaded into the generated service worker (workbox importScripts).
 * The host pins each visitor to one deployment with a cookie; a precache
 * download sent with an old cookie gets the old version or a 404 and the
 * update install fails. Site files are public, so same-origin static file
 * requests (not navigations) are sent without cookies.
 */
(function () {
  try {
    var origFetch = self.fetch.bind(self);
    var STATIC = /\.(js|css|html|ico|svg|woff2?|png|webmanifest|json)$/i;
    self.fetch = function (input, init) {
      try {
        var req = input instanceof Request ? input : null;
        var url = new URL(req ? req.url : String(input), self.location.href);
        var mode = req ? req.mode : init && init.mode;
        var method = (req ? req.method : (init && init.method)) || "GET";
        if (
          url.origin === self.location.origin &&
          mode !== "navigate" &&
          method === "GET" &&
          STATIC.test(url.pathname) &&
          !url.pathname.startsWith("/~oauth")
        ) {
          return origFetch(url.href, {
            credentials: "omit",
            cache: (req && req.cache) || (init && init.cache) || "default",
            integrity: (req && req.integrity) || (init && init.integrity) || undefined,
            signal: (init && init.signal) || (req && req.signal) || undefined,
          });
        }
      } catch (e) {
        /* fall through to the normal fetch */
      }
      return origFetch(input, init);
    };
  } catch (e) {
    /* unsupported: keep normal behaviour */
  }
})();
