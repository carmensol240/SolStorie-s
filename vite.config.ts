import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    {
      // Stamps the build time into the page so the admin "live site" card can show when it was published.
      name: "build-time-meta",
      transformIndexHtml: (html: string) =>
        html.replace("</head>", `<meta name="build-time" content="${new Date().toISOString()}" />\n</head>`),
    },
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
      },
      includeAssets: ["favicon.png", "favicon.ico", "pwa-icon-192.png", "pwa-icon-512.png"],
      manifest: {
        id: "/",
        name: "SolStorie's™ – עולמה הקסום של סול",
        short_name: "SolStorie's™",
        description: "צרו סיפורים קסומים עם הילד שלכם כגיבור הראשי",
        theme_color: "#FFFBEB",
        background_color: "#FFFBEB",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        launch_handler: { client_mode: "navigate-existing" } as any,
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        dir: "rtl",
        lang: "he",
        categories: ["education", "kids"],
        prefer_related_applications: false,
        related_applications: [],
        screenshots: [
          {
            src: "/splash-screen.png",
            sizes: "1200x630",
            type: "image/png",
            form_factor: "wide" as any
          }
        ],
        icons: [
          {
            src: "/pwa-icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
        // New version installs and takes control right away; old precache versions are removed.
        // (Runtime caches such as story-illustrations are kept across updates.)
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // No precache-first navigation fallback: HTML always comes from the network first,
        // and the precached index.html is only used when the network fails (see below).
        navigateFallback: null,
        // Images are NOT precached (they were ~85MB and made updates fail/stall on phones);
        // they are cached on first view by the "app-images" rule below.
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2}", "pwa-icon-*.png", "favicon.png"],
        runtimeCaching: [
          {
            // Site images (hashed, never change) — cached on first view, kept across updates.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && /\.(png|jpe?g|webp)$/i.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "app-images",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Sign-in URLs are never cached.
            urlPattern: ({ url }) => url.pathname.startsWith("/~oauth") || url.pathname === "/auth" || url.pathname.startsWith("/auth/"),
            handler: "NetworkOnly",
          },
          {
            // Story illustrations (original + resized WebP reading copies) so a
            // book opened once can be read again without internet.
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/(object|render\/image)\/public\/story-illustrations\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "story-illustrations",
              expiration: {
                maxEntries: 600,
                maxAgeSeconds: 60 * 60 * 24 * 60 // 60 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // HTML navigations: always try network first so a fresh Publish
            // shows up immediately and devices don't lock onto an old shell.
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "html",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: { statuses: [200] },
              plugins: [
                {
                  // Offline and this page was never cached: serve the precached app shell
                  // so every page (book, library) still opens without internet.
                  handlerDidError: async () =>
                    (await (globalThis as any).caches.match("/index.html", { ignoreSearch: true })) || undefined,
                },
              ]
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
