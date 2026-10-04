import fs from 'fs';
import path from 'path';

const confirmedTables = [
  'app_config',
  'applied_mutations',
  'categories',
  'delivery',
  'delivery_shift_logs',
  'delivery_zones',
  'driver_transactions',
  'feedback',
  'menu_availability',
  'menu_item_option_groups',
  'menu_item_options',
  'menu_item_variants',
  'menu_items',
  'notifications',
  'order_assignments',
  'order_events',
  'order_items',
  'order_status_history',
  'orders',
  'profiles',
  'reservations',
  'restaurant_settings',
  'shifts',
  'staff_roles',
  'sync_queue',
  'telegram_logs'
];

function getAllCodeFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build' || file === '.system_generated') return;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllCodeFiles(fullPath));
    } else {
      const ext = path.extname(file);
      if (['.js', '.jsx', '.ts', '.tsx', '.sql', '.json'].includes(ext)) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const menuDir = 'c:\\Users\\mamdo\\Documents\\GitHub\\AbuKhater_Menu';
const deliveryDir = 'c:\\Users\\mamdo\\Documents\\GitHub\\AbuKhater_delivery';

const menuFiles = getAllCodeFiles(menuDir);
const deliveryFiles = getAllCodeFiles(deliveryDir);

const analysis = {};

confirmedTables.forEach(table => {
  analysis[table] = {
    menuReferences: [],
    deliveryReferences: [],
    sqlReferences: []
  };

  // Check Menu files
  menuFiles.forEach(f => {
    const rel = path.relative(menuDir, f);
    if (rel.startsWith('scratch') && !rel.includes('phase')) return;
    const content = fs.readFileSync(f, 'utf8');
    const regex = new RegExp(`\\b${table}\\b`, 'i');
    if (regex.test(content)) {
      analysis[table].menuReferences.push(rel);
    }
  });

  // Check Delivery files
  deliveryFiles.forEach(f => {
    const rel = path.relative(deliveryDir, f);
    if (rel.startsWith('scratch') && !rel.includes('phase')) return;
    const content = fs.readFileSync(f, 'utf8');
    const regex = new RegExp(`\\b${table}\\b`, 'i');
    if (regex.test(content)) {
      if (rel.endsWith('.sql')) {
        analysis[table].sqlReferences.push(rel);
      } else {
        analysis[table].deliveryReferences.push(rel);
      }
    }
  });
});

console.log('=== USAGE SUMMARY FOR ALL 26 TABLES ===\n');

confirmedTables.forEach(t => {
  const data = analysis[t];
  console.log(`----------------------------------------------------------------`);
  console.log(`📊 TABLE: ${t}`);
  console.log(`   Menu Repo (${data.menuReferences.length} files): ${data.menuReferences.slice(0, 5).join(', ')}${data.menuReferences.length > 5 ? '...' : ''}`);
  console.log(`   Delivery Repo (${data.deliveryReferences.length} files): ${data.deliveryReferences.slice(0, 5).join(', ')}${data.deliveryReferences.length > 5 ? '...' : ''}`);
  console.log(`   SQL Files (${data.sqlReferences.length} files): ${data.sqlReferences.slice(0, 5).join(', ')}${data.sqlReferences.length > 5 ? '...' : ''}`);
});

fs.writeFileSync('scratch/table_code_references.json', JSON.stringify(analysis, null, 2));
