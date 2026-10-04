import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// We can query database metadata via standard RPCs or by introspecting tables via PostgREST/OpenAPI spec or running queries
async function introspect() {
  console.log('1. Fetching PostgREST OpenAPI spec to list all exposed tables and definitions...');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    const schemaDoc = await res.json();
    fs.writeFileSync('scratch/supabase_openapi_schema.json', JSON.stringify(schemaDoc, null, 2));
    
    const tables = Object.keys(schemaDoc.definitions || {});
    console.log(`Found ${tables.length} tables in definitions:`, tables);

    // Let's count rows for each table using select({ count: 'exact', head: true })
    const tableStats = {};
    for (const tbl of tables) {
      try {
        const { count, error } = await supabase
          .from(tbl)
          .select('*', { count: 'exact', head: true });
        
        tableStats[tbl] = {
          rowCount: error ? `Error: ${error.message}` : count,
          columns: Object.keys(schemaDoc.definitions[tbl]?.properties || {}),
          required: schemaDoc.definitions[tbl]?.required || [],
          description: schemaDoc.definitions[tbl]?.description || ''
        };
      } catch (e) {
        tableStats[tbl] = { rowCount: `Exception: ${e.message}`, columns: [] };
      }
    }

    fs.writeFileSync('scratch/table_stats_raw.json', JSON.stringify(tableStats, null, 2));
    console.log('Saved table_stats_raw.json');
  } catch (err) {
    console.error('Error during introspection:', err);
  }
}

introspect();
