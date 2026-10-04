import fs from 'fs';
import path from 'path';

const menuDir = 'c:\\Users\\mamdo\\Documents\\GitHub\\AbuKhater_Menu';
const deliveryDir = 'c:\\Users\\mamdo\\Documents\\GitHub\\AbuKhater_delivery';

function searchTerms(dir, projectName) {
  const matches = [];

  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);
    for (const item of items) {
      if (['node_modules', '.git', 'dist', 'build', '.system_generated'].includes(item)) continue;
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      const relPath = path.relative(dir, fullPath).replace(/\\/g, '/');

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else {
        const ext = path.extname(item).toLowerCase();
        if (['.js', '.jsx', '.ts', '.tsx', '.json', '.sql', '.md', '.txt', '.env', '.html'].includes(ext)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
              const lower = line.toLowerCase();
              if (
                lower.includes('n8n') ||
                lower.includes('sheet') ||
                lower.includes('webhook') ||
                lower.includes('drive.google')
              ) {
                matches.push({
                  project: projectName,
                  file: relPath,
                  lineNo: idx + 1,
                  text: line.trim()
                });
              }
            });
          } catch (e) {}
        }
      }
    }
  }

  traverse(dir);
  return matches;
}

const menuLegacy = searchTerms(menuDir, 'AbuKhater_Menu');
const deliveryLegacy = searchTerms(deliveryDir, 'AbuKhater_delivery');

console.log(`Found ${menuLegacy.length} legacy term occurrences in AbuKhater_Menu`);
console.log(`Found ${deliveryLegacy.length} legacy term occurrences in AbuKhater_delivery`);

const allLegacy = [...menuLegacy, ...deliveryLegacy];
fs.writeFileSync('scratch/legacy_occurrences.json', JSON.stringify(allLegacy, null, 2));

// Group by file
const filesWithLegacy = {};
allLegacy.forEach(m => {
  const key = `[${m.project}] ${m.file}`;
  if (!filesWithLegacy[key]) filesWithLegacy[key] = [];
  filesWithLegacy[key].push(`L${m.lineNo}: ${m.text.slice(0, 100)}`);
});

console.log('\n=== FILES CONTAINING LEGACY TERMS (n8n, sheet, webhook, google drive) ===\n');
Object.entries(filesWithLegacy).forEach(([file, list]) => {
  console.log(`📄 ${file} (${list.length} matches):`);
  list.slice(0, 3).forEach(l => console.log(`   ${l}`));
});
