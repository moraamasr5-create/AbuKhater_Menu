import fs from 'fs';
import path from 'path';

function traceProjectReachability(baseDir, entryPoints) {
  // Map of normalized relative path -> { fullPath, imports: Set, importedBy: Set, isReachable: bool }
  const fileMap = new Map();

  function collectFiles(dir) {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      if (['node_modules', '.git', 'dist', 'build', '.system_generated'].includes(item)) continue;
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        collectFiles(fullPath);
      } else {
        const ext = path.extname(item).toLowerCase();
        if (['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.html'].includes(ext)) {
          const rel = path.relative(baseDir, fullPath).replace(/\\/g, '/');
          fileMap.set(rel, {
            relPath: rel,
            fullPath,
            ext,
            imports: new Set(),
            importedBy: new Set(),
            isReachable: false
          });
        }
      }
    }
  }

  collectFiles(baseDir);

  // Parse imports in each file
  fileMap.forEach((node, rel) => {
    let content = '';
    try {
      content = fs.readFileSync(node.fullPath, 'utf8');
    } catch (e) {
      return;
    }

    const importRegex = /(?:import\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)|import\(['"]([^'"]+)['"]\))/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const targetSpec = match[1] || match[2] || match[3];
      if (!targetSpec) continue;

      // Resolve relative import to project file if local
      if (targetSpec.startsWith('.')) {
        const fileDir = path.dirname(node.fullPath);
        const resolvedPath = path.resolve(fileDir, targetSpec);

        // Try exact, .js, .jsx, .ts, .tsx, /index.js, etc.
        const candidates = [
          resolvedPath,
          `${resolvedPath}.js`,
          `${resolvedPath}.jsx`,
          `${resolvedPath}.ts`,
          `${resolvedPath}.tsx`,
          `${resolvedPath}.json`,
          path.join(resolvedPath, 'index.js'),
          path.join(resolvedPath, 'index.jsx')
        ];

        for (const cand of candidates) {
          if (fs.existsSync(cand) && !fs.statSync(cand).isDirectory()) {
            const relTarget = path.relative(baseDir, cand).replace(/\\/g, '/');
            node.imports.add(relTarget);
            if (fileMap.has(relTarget)) {
              fileMap.get(relTarget).importedBy.add(rel);
            }
            break;
          }
        }
      }
    }
  });

  // BFS / DFS from entryPoints
  const queue = [...entryPoints];
  entryPoints.forEach(ep => {
    if (fileMap.has(ep)) {
      fileMap.get(ep).isReachable = true;
    }
  });

  while (queue.length > 0) {
    const current = queue.shift();
    const node = fileMap.get(current);
    if (!node) continue;

    node.imports.forEach(imp => {
      const impNode = fileMap.get(imp);
      if (impNode && !impNode.isReachable) {
        impNode.isReachable = true;
        queue.push(imp);
      }
    });
  }

  const reachable = [];
  const unreachable = [];

  fileMap.forEach((node, rel) => {
    if (node.isReachable) {
      reachable.push(rel);
    } else {
      unreachable.push({
        relPath: rel,
        importedBy: Array.from(node.importedBy),
        imports: Array.from(node.imports)
      });
    }
  });

  return { fileMap, reachable, unreachable };
}

console.log('Tracing reachability for AbuKhater_Menu...');
const menuTrace = traceProjectReachability('c:\\Users\\mamdo\\Documents\\GitHub\\AbuKhater_Menu', ['index.html', 'src/main.jsx', 'src/App.jsx', 'vite.config.js']);

console.log(`AbuKhater_Menu: Reachable=${menuTrace.reachable.length}, Unreachable=${menuTrace.unreachable.length}`);

console.log('\nTracing reachability for AbuKhater_delivery...');
const deliveryTrace = traceProjectReachability('c:\\Users\\mamdo\\Documents\\GitHub\\AbuKhater_delivery', ['index.html', 'src/main.jsx', 'src/App.jsx', 'vite.config.js', 'src/index.jsx']);

console.log(`AbuKhater_delivery: Reachable=${deliveryTrace.reachable.length}, Unreachable=${deliveryTrace.unreachable.length}`);

fs.writeFileSync('scratch/menu_unreachable_files.json', JSON.stringify(menuTrace.unreachable, null, 2));
fs.writeFileSync('scratch/delivery_unreachable_files.json', JSON.stringify(deliveryTrace.unreachable, null, 2));
console.log('Saved reachability analysis in scratch/');
