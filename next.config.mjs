import withPWAInit from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb"
    }
  }
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  fallbacks: {
    document: "/offline.html"
  },
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: ({ url }) => url.pathname.startsWith("/api/auth"),
        handler: "NetworkOnly",
        method: "GET"
      },
      {
        urlPattern: ({ url }) => url.pathname.startsWith("/api/auth"),
        handler: "NetworkOnly",
        method: "POST"
      },
      {
        urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
        handler: "NetworkFirst",
        options: {
          cacheName: "bcb-api-cache",
          networkTimeoutSeconds: 8,
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 60 * 60
          }
        }
      },
      {
        urlPattern: ({ request }) =>
          request.destination === "style" ||
          request.destination === "script" ||
          request.destination === "worker" ||
          request.destination === "font",
        handler: "CacheFirst",
        options: {
          cacheName: "bcb-static-assets",
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 60 * 60 * 24 * 30
          }
        }
      },
      {
        urlPattern: ({ request }) => request.destination === "image",
        handler: "CacheFirst",
        options: {
          cacheName: "bcb-image-cache",
          expiration: {
            maxEntries: 96,
            maxAgeSeconds: 60 * 60 * 24 * 30
          }
        }
      },
      {
        urlPattern: ({ url }) =>
          url.pathname.startsWith("/documents") ||
          url.pathname.startsWith("/api/secure-viewer") ||
          url.pathname.startsWith("/api/documents"),
        handler: "NetworkFirst",
        options: {
          cacheName: "bcb-document-cache",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60 * 6
          }
        }
      }
    ]
  }
});

export default withPWA(nextConfig);
