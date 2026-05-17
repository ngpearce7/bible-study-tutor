import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const publicDir = join(process.cwd(), "public");
const rawSiteUrl = process.env.EXPO_PUBLIC_SITE_URL || "";
const siteUrl = rawSiteUrl.replace(/\/$/, "");

mkdirSync(publicDir, { recursive: true });
copyFileSync(
  join(process.cwd(), "node_modules", "@expo", "vector-icons", "build", "vendor", "react-native-vector-icons", "Fonts", "Ionicons.ttf"),
  join(publicDir, "ionicons.ttf")
);

const robots = [
  "User-agent: *",
  "Allow: /",
  siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml` : ""
].filter(Boolean).join("\n") + "\n";

writeFileSync(join(publicDir, "robots.txt"), robots);

if (siteUrl) {
  const now = new Date().toISOString();
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
  writeFileSync(join(publicDir, "sitemap.xml"), sitemap);
} else {
  rmSync(join(publicDir, "sitemap.xml"), { force: true });
}
