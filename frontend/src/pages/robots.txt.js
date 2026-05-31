export const GET = async () => {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /error",
    "Disallow: /404",
    "Disallow: /500",
    "",
    "Sitemap: https://www.ymkw.top/sitemap-index.xml",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
