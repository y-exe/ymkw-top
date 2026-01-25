export const GET = async () => {
  const API_URL = "https://api.ymkw.top";
  const SITE_URL = "https://www.ymkw.top";

  let snapshots = [];
  try {
    const res = await fetch(`${API_URL}/api/snapshots`);
    if (res.ok) {
      snapshots = await res.json();
    }
  } catch (e) {
    console.error("Sitemap Snapshot Fetch Error:", e);
  }

  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ y: d.getFullYear(), m: d.getMonth() + 1 });
  }

  const staticPages = [
    { url: "", priority: 1.0 },
    { url: "/terms", priority: 0.3 },
    { url: "/privacy", priority: 0.3 },
  ];

  const urlEntries = [
    ...staticPages.map(p => ({ 
      loc: `${SITE_URL}${p.url}`, 
      priority: p.priority 
    })),
    ...months.map(d => ({ 
      loc: `${SITE_URL}/month/${d.y}/${d.m}`, 
      priority: 0.8 
    })),
    ...snapshots.map(s => ({ 
      loc: `${SITE_URL}/open/${s.snapshot_id}`, 
      priority: 0.6 
    }))
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlEntries.map(entry => `
    <url>
      <loc>${entry.loc}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <priority>${entry.priority}</priority>
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