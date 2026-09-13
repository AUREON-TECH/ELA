import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const must = (cond, msg) => { if (!cond) { console.error(`FAIL: ${msg}`); process.exitCode = 1; } else console.log(`PASS: ${msg}`); };

for (const file of ['index.html','manifest.webmanifest','sw.js','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png']) {
  must(fs.existsSync(path.join(root, file)), `${file} exists`);
}
if (fs.existsSync(path.join(root,'manifest.webmanifest'))) {
  const m = JSON.parse(read('manifest.webmanifest'));
  must(Boolean(m.name && m.short_name), 'manifest has name and short_name');
  must(m.start_url === './', 'manifest start_url is relative');
  must(m.scope === './', 'manifest scope is relative');
  must(m.display === 'standalone', 'manifest display is standalone');
  must(Boolean(m.theme_color && m.background_color), 'manifest has theme colors');
  const sizes = new Set((m.icons || []).map(i => i.sizes));
  must(sizes.has('192x192') && sizes.has('512x512'), 'manifest declares 192 and 512 icons');
  must((m.icons || []).some(i => String(i.purpose || '').includes('maskable')), 'manifest declares maskable icon');
}
if (fs.existsSync(path.join(root,'index.html'))) {
  const html = read('index.html');
  must(/manifest\.webmanifest/.test(html), 'index links manifest');
  must(/theme-color/.test(html), 'index has theme-color meta');
  must(/viewport/.test(html), 'index has viewport meta');
  must(/serviceWorker\.register/.test(html), 'index registers service worker');
  must(/updateViaCache\s*:\s*['"]none['"]/.test(html), 'service worker registration bypasses HTTP cache');
  must(/beforeinstallprompt/.test(html), 'install prompt is supported');
}
if (fs.existsSync(path.join(root,'sw.js'))) {
  const sw = read('sw.js');
  must(/CACHE_NAME/.test(sw), 'service worker cache is versioned');
  must(/caches\.keys\(\)/.test(sw) && /caches\.delete/.test(sw), 'old caches are cleaned');
  must(/authorization/i.test(sw) && /cookie/i.test(sw), 'sensitive request headers are excluded');
  must(/private/i.test(sw) && /no-store/i.test(sw), 'private/no-store responses are excluded');
  must(/range/i.test(sw) && /if-range/i.test(sw), 'range requests are excluded');
  must(/request\.mode\s*===\s*['"]navigate['"]/.test(sw), 'offline fallback is navigation-only');
}
if (process.exitCode) process.exit(process.exitCode);
console.log('ELA PWA audit passed');
