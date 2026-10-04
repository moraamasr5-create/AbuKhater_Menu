import fs from 'fs';
import path from 'path';

const sqlDir = 'c:\\Users\\mamdo\\Documents\\GitHub\\AbuKhater_delivery\\supabase';

function getSqlFiles(dir) {
  let files = [];
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      files = files.concat(getSqlFiles(p));
    } else if (f.endsWith('.sql')) {
      files.push(p);
    }
  });
  return files;
}

const allSql = getSqlFiles(sqlDir);

console.log(`Found ${allSql.length} SQL migration files.`);

const tableDetails = {};

allSql.forEach(sf => {
  const content = fs.readFileSync(sf, 'utf8');
  const filename = path.basename(sf);

  // Match CREATE TABLE
  const tableMatches = content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi);
  for (const match of tableMatches) {
    const tblName = match[1].toLowerCase();
    if (!tableDetails[tblName]) {
      tableDetails[tblName] = { definitions: [], triggers: [], rpcs: [], rlsPolicies: [] };
    }
    tableDetails[tblName].definitions.push({
      file: filename,
      body: match[2].trim()
    });
  }

  // Match CREATE POLICY
  const policyMatches = content.matchAll(/CREATE\s+POLICY\s+["']?([^"'\s]+)["']?\s+ON\s+(?:public\.)?([a-zA-Z0-9_]+)([\s\S]*?);/gi);
  for (const match of policyMatches) {
    const tblName = match[2].toLowerCase();
    if (!tableDetails[tblName]) {
      tableDetails[tblName] = { definitions: [], triggers: [], rpcs: [], rlsPolicies: [] };
    }
    tableDetails[tblName].rlsPolicies.push({
      file: filename,
      policyName: match[1],
      clause: match[3].trim()
    });
  }

  // Match Functions/RPCs referencing tables
  const funcMatches = content.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?([a-zA-Z0-9_]+)\s*\([\s\S]*?\)\s*RETURNS[\s\S]*?AS\s*\$\$([\s\S]*?)\$\$/gi);
  for (const match of funcMatches) {
    const funcName = match[1];
    const funcBody = match[2];
    
    // Check which tables are referenced in this function
    const confirmedTables = [
      'app_config', 'applied_mutations', 'categories', 'delivery', 'delivery_shift_logs',
      'delivery_zones', 'driver_transactions', 'feedback', 'menu_availability',
      'menu_item_option_groups', 'menu_item_options', 'menu_item_variants', 'menu_items',
      'notifications', 'order_assignments', 'order_events', 'order_items',
      'order_status_history', 'orders', 'profiles', 'reservations',
      'restaurant_settings', 'shifts', 'staff_roles', 'sync_queue', 'telegram_logs'
    ];

    confirmedTables.forEach(t => {
      const reg = new RegExp(`\\b${t}\\b`, 'i');
      if (reg.test(funcBody)) {
        if (!tableDetails[t]) {
          tableDetails[t] = { definitions: [], triggers: [], rpcs: [], rlsPolicies: [] };
        }
        if (!tableDetails[t].rpcs.includes(funcName)) {
          tableDetails[t].rpcs.push(funcName);
        }
      }
    });
  }
});

fs.writeFileSync('scratch/table_schema_deep_analysis.json', JSON.stringify(tableDetails, null, 2));
console.log('Saved scratch/table_schema_deep_analysis.json');
