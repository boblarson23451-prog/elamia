/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Storefront and account pages reflect live stock, prices and orders.
        // Without this, browsers (and the PWA shell) can serve yesterday's
        // catalogue after you edit a product.
        source: "/:path((?!_next/static|icons|favicon).*)",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
