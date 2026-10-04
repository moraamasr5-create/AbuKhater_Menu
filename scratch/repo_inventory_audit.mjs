import fs from 'fs';
import path from 'path';

const menuDir = 'c:\\Users\\mamdo\\Documents\\GitHub\\AbuKhater_Menu';
const deliveryDir = 'c:\\Users\\mamdo\\Documents\\GitHub\\AbuKhater_delivery';

function scanProject(dir, projectName) {
  const fileList = [];

  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);
    for (const item of items) {
      if (['node_modules', '.git', 'dist', 'build', '.system_generated'].includes(item)) continue;
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      const relPath = path.relative(dir, fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else {
        const ext = path.extname(item).toLowerCase();
        fileList.push({
          project: projectName,
          relPath,
          fullPath,
          size: stat.size,
          ext,
          mtime: stat.mtime
        });
      }
    }
  }

  traverse(dir);
  return fileList;
}

const menuFiles = scanProject(menuDir, 'AbuKhater_Menu');
const deliveryFiles = scanProject(deliveryDir, 'AbuKhater_delivery');

console.log(`Total files in AbuKhater_Menu: ${menuFiles.length}`);
console.log(`Total files in AbuKhater_delivery: ${deliveryFiles.length}`);

// Keyword search for legacy references
const legacyKeywords = [
  'n8n', 'googlesheets', 'google sheet', 'google_sheet', 'sheet_id', 'spreadsheet',
  'webhook-test', 'webhook.site', 'getneworders', 'menu-api', 'submit-order',
  'app_config', 'menu_availability', 'sync_queue', 'order_events', 'driver_transactions'
];

function analyzeFiles(files, baseDir) {
  return files.map(file => {
    let content = '';
    const textExts = ['.js', '.jsx', '.ts', '.tsx', '.json', '.sql', '.md', '.txt', '.env', '.html', '.css'];
    if (textExts.includes(file.ext)) {
      try {
        content = fs.readFileSync(file.fullPath, 'utf8');
      } catch (e) {
        content = '';
      }
    }

    const matchedKeywords = [];
    const lowerContent = content.toLowerCase();
    legacyKeywords.forEach(kw => {
      if (lowerContent.includes(kw)) {
        matchedKeywords.push(kw);
      }
    });

    // Extract imports
    const importRegex = /(?:import\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)|import\(['"]([^'"]+)['"]\))/g;
    const imports = [];
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1] || match[2] || match[3]);
    }

    return {
      ...file,
      matchedKeywords,
      imports,
      contentLength: content.length
    };
  });
}

const analyzedMenu = analyzeFiles(menuFiles, menuDir);
const analyzedDelivery = analyzeFiles(deliveryFiles, deliveryDir);

fs.writeFileSync('scratch/menu_repo_inventory.json', JSON.stringify(analyzedMenu, null, 2));
fs.writeFileSync('scratch/delivery_repo_inventory.json', JSON.stringify(analyzedDelivery, null, 2));

console.log('Saved inventory files in scratch/');
