import { escapeXml } from "@/lib/seo";

export const GET = async () => {
  const SITE_URL = "https://www.ymkw.top";

  const months = [];
  const now = new Date();
  for (let i = 1; i <= 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ y: d.getFullYear(), m: d.getMonth() + 1 });
  }

  const staticPages = [
    {
      url: "",
      priority: 1.0,
      changefreq: "daily",
      images: [
        {
          loc: `${SITE_URL}/ymkw.webp`,
          title: "やまかわてるき",
          caption: "やまかわてるき鯖のWEBダッシュボード",
        },
        {
          loc: `${SITE_URL}/ranking.webp`,
          title: "やまかわてるき鯖ランキング",
          caption: "やまかわてるき鯖のDiscord統計ランキング",
        },
      ],
    },
    { url: "/terms", priority: 0.3, changefreq: "yearly" },
    { url: "/privacy", priority: 0.3, changefreq: "yearly" },
  ];

  const urlEntries = [
    ...staticPages.map(p => ({
      loc: `${SITE_URL}${p.url}`,
      priority: p.priority,
      changefreq: p.changefreq,
      lastmod: new Date().toISOString(),
      images: p.images || [],
    })),
    ...months.map(d => ({
      loc: `${SITE_URL}/month/${d.y}/${d.m}`,
      priority: 0.8,
      changefreq: "monthly",
      lastmod: new Date(Date.UTC(d.y, d.m, 0, 15, 0, 0)).toISOString()
    })),
    {
      loc: `${SITE_URL}/all`,
      priority: 0.8,
      changefreq: "daily",
      lastmod: new Date().toISOString()
    }
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>
  ${urlEntries.map(entry => `
    <url>
      <loc>${escapeXml(entry.loc)}</loc>
      <lastmod>${escapeXml(entry.lastmod)}</lastmod>
      <changefreq>${entry.changefreq}</changefreq>
      <priority>${entry.priority}</priority>
      ${(entry.images || []).map(image => `
        <image:image>
          <image:loc>${escapeXml(image.loc)}</image:loc>
          <image:title>${escapeXml(image.title)}</image:title>
          <image:caption>${escapeXml(image.caption)}</image:caption>
        </image:image>
      `).join('')}
    </url>
  `).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600"
    }
  });
};
