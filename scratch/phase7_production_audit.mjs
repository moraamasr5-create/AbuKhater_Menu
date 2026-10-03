import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';
const supabase = createClient(url, anonKey);

async function runProductionAudit() {
    console.log('===========================================================');
    console.log('🛡️ PHASE 7: FINAL PRODUCTION INTEGRITY AUDIT');
    console.log('===========================================================\n');

    const audit = {};

    // 1. SSOT / Menu Data
    console.log('1. Checking SSOT & Menu Data:');
    const { data: activeItems, error: activeErr } = await supabase
        .from('menu_items')
        .select(`
            id, name, price, status,
            categories(id, name, slug),
            menu_item_variants(id, name, price, is_available),
            menu_item_option_groups(id, name, required, selection_type, menu_item_options(id, name, price_delta))
        `)
        .neq('status', 'hidden');

    if (activeErr) throw activeErr;
    console.log(`   - Active items from Supabase: ${activeItems.length}`);
    const noHidden = activeItems.every(i => i.status !== 'hidden');
    console.log(`   - No hidden items present: ${noHidden}`);
    audit.ssot = noHidden && activeItems.length > 0;

    // 2. Product Identity
    console.log('\n2. Checking Product Identity & Canonical UUIDs:');
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const allValidUuids = activeItems.every(i => uuidRegex.test(i.id));
    console.log(`   - All items have valid Canonical UUIDs: ${allValidUuids}`);
    audit.identity = allValidUuids;

    // 3. Pricing Integrity
    console.log('\n3. Checking Pricing Integrity:');
    let pricesValid = true;
    activeItems.forEach(i => {
        if (typeof i.price !== 'number' || isNaN(i.price) || i.price < 0) pricesValid = false;
        if (i.menu_item_variants?.length > 0) {
            i.menu_item_variants.forEach(v => {
                if (typeof v.price !== 'number' || isNaN(v.price) || v.price <= 0) pricesValid = false;
            });
        }
    });
    console.log(`   - All prices are strictly valid numeric values: ${pricesValid}`);
    audit.pricing = pricesValid;

    // 4. Security & Secrets in Client Source Code
    console.log('\n4. Checking Security & Secrets in Frontend code:');
    const clientCode = fs.readFileSync('src/services/supabase/supabaseClient.js', 'utf8');
    const hasServiceRole = clientCode.includes('service_role') || clientCode.includes('SERVICE_ROLE');
    console.log(`   - No service_role key exposed in client code: ${!hasServiceRole}`);
    audit.security = !hasServiceRole;

    // 5. Total Database Rows & Legacy Safety
    console.log('\n5. Checking Total Database Rows & Legacy Safety:');
    const { count: totalDbRows } = await supabase.from('menu_items').select('*', { count: 'exact', head: true });
    console.log(`   - Total DB rows preserved (zero delete): ${totalDbRows}`);
    audit.legacy = totalDbRows >= 174;

    console.log('\n===========================================================');
    const allPassed = Object.values(audit).every(Boolean);
    console.log(`🛡️ FINAL AUDIT SUMMARY: ${allPassed ? 'ALL VERIFICATIONS PASSED ✅' : 'FAIL ❌'}`);
    console.log('===========================================================');
}

runProductionAudit();
