import fs from 'fs';
import path from 'path';

const allExistingTables = [
  'app_config',
  'applied_mutations',
  'categories',
  'customers',
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

const sqlDir = 'c:\\Users\\mamdo\\Documents\\GitHub\\AbuKhater_delivery\\supabase';

function getFiles(dir) {
  let files = [];
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      files = files.concat(getFiles(p));
    } else if (f.endsWith('.sql')) {
      files.push(p);
    }
  });
  return files;
}

const sqlFiles = getFiles(sqlDir);

// For each table, let's collect every single mention in SQL migrations
const report = {};

allExistingTables.forEach(tbl => {
  report[tbl] = {
    createStatements: [],
    alterStatements: [],
    policies: [],
    triggers: [],
    rpcs: [],
    references: []
  };

  sqlFiles.forEach(sf => {
    const content = fs.readFileSync(sf, 'utf8');
    const filename = path.relative(sqlDir, sf);

    // CREATE TABLE
    const ctRegex = new RegExp(`CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:public\\.)?${tbl}\\s*\\(([\\s\\S]*?)\\);`, 'gi');
    let m;
    while ((m = ctRegex.exec(content)) !== null) {
      report[tbl].createStatements.push({ file: filename, ddl: m[0] });
    }

    // ALTER TABLE
    const atRegex = new RegExp(`ALTER\\s+TABLE\\s+(?:public\\.)?${tbl}\\s+([\\s\\S]*?);`, 'gi');
    while ((m = atRegex.exec(content)) !== null) {
      report[tbl].alterStatements.push({ file: filename, sql: m[0] });
    }

    // CREATE POLICY
    const polRegex = new RegExp(`CREATE\\s+POLICY\\s+["']?([^"'\r\n]+)["']?\\s+ON\\s+(?:public\\.)?${tbl}([\\s\\S]*?);`, 'gi');
    while ((m = polRegex.exec(content)) !== null) {
      report[tbl].policies.push({ file: filename, name: m[1], clause: m[2].trim() });
    }

    // FUNCTION / RPC
    const funcRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-zA-Z0-9_]+)\s*\([\s\S]*?\)\s*RETURNS[\s\S]*?AS\s*\$\$([\s\S]*?)\$\$/gi;
    while ((m = funcRegex.exec(content)) !== null) {
      const fName = m[1];
      const fBody = m[2];
      const tblRegex = new RegExp(`\\b${tbl}\\b`, 'i');
      if (tblRegex.test(fBody)) {
        if (!report[tbl].rpcs.includes(fName)) {
          report[tbl].rpcs.push(fName);
        }
      }
    }
  });
});

console.log('=== DEEP SQL MIGRATION ANALYSIS FOR ALL 27 TABLES ===\n');
allExistingTables.forEach(tbl => {
  const r = report[tbl];
  console.log(`----------------------------------------------------------------`);
  console.log(`📋 ${tbl.toUpperCase()}`);
  console.log(`   Create DDLs in Migrations: ${r.createStatements.length}`);
  console.log(`   Alter Statements: ${r.alterStatements.length}`);
  console.log(`   RLS Policies: ${r.policies.length}`);
  console.log(`   Associated RPCs/Functions (${r.rpcs.length}): ${r.rpcs.join(', ')}`);
});

fs.writeFileSync('scratch/deep_sql_migration_report.json', JSON.stringify(report, null, 2));
