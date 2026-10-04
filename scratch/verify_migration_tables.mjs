import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const sqlDir = 'c:\\Users\\mamdo\\Documents\\GitHub\\AbuKhater_delivery\\supabase';
const files = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql'));

const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi;
const foundTables = new Set();

files.forEach(f => {
  const content = fs.readFileSync(`${sqlDir}\\${f}`, 'utf8');
  let match;
  while ((match = createTableRegex.exec(content)) !== null) {
    foundTables.add(match[1].toLowerCase());
  }
});

// Also check migrations subfolder
if (fs.existsSync(`${sqlDir}\\migrations`)) {
  const mfiles = fs.readdirSync(`${sqlDir}\\migrations`).filter(f => f.endsWith('.sql'));
  mfiles.forEach(f => {
    const content = fs.readFileSync(`${sqlDir}\\migrations\\${f}`, 'utf8');
    let match;
    while ((match = createTableRegex.exec(content)) !== null) {
      foundTables.add(match[1].toLowerCase());
    }
  });
}

console.log('Tables created across all SQL files:', Array.from(foundTables));

async function verifyAll() {
  for (const t of Array.from(foundTables)) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error && error.code === '42P01') {
      console.log(`❌ ${t}: does NOT exist in DB`);
    } else if (error) {
      console.log(`🔒 ${t}: exists (error: ${error.message} - ${error.code})`);
    } else {
      console.log(`✅ ${t}: exists (count: ${count})`);
    }
  }
}

verifyAll();
