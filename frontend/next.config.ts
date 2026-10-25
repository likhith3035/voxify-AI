import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: data: blob:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: blob: data: chrome-extension:",
              "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' http: https: blob: data: chrome-extension:",
              "script-src-attr 'self' 'unsafe-inline' 'unsafe-eval' http: https: blob: data: chrome-extension:",
              "style-src 'self' 'unsafe-inline' http: https:",
              "style-src-elem 'self' 'unsafe-inline' http: https:",
              "img-src 'self' data: blob: http: https: chrome-extension:",
              "font-src 'self' data: http: https:",
              "connect-src 'self' http: https: ws: wss:",
              "media-src 'self' data: blob: http: https:",
              "worker-src 'self' blob: data:",
              "frame-src 'self' http: https: chrome-extension: https://www.youtube.com https://www.youtube-nocookie.com",
              "frame-ancestors 'self' chrome-extension: http: https: *",
            ].join("; "),
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-Requested-With, Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
