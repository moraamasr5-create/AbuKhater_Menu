import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function inspect() {
    console.log('--- Inspecting existing data for the 3 target items ---');
    const targetIds = [
        '808c11d2-d7af-4512-bb2c-1c14510a1d14', // وجبة الشرقي
        'ade87b63-64f7-417e-93a6-5b92cd71a594', // شاورما فراخ
        '260329a4-49a5-411d-ac19-c5733277ad48'  // بيبسي
    ];

    const { data: menuItems, error: mErr } = await supabase
        .from('menu_items')
        .select('id, name, price, category_id, status')
        .in('id', targetIds);

    if (mErr) console.error('menu_items query error:', mErr);
    else console.log('Found menu items:', menuItems);

    const { data: variants, error: vErr } = await supabase
        .from('menu_item_variants')
        .select('*')
        .in('menu_item_id', targetIds);

    if (vErr) console.error('variants query error:', vErr);
    else console.log('Existing variants:', variants);

    const { data: groups, error: gErr } = await supabase
        .from('menu_item_option_groups')
        .select('*')
        .in('menu_item_id', targetIds);

    if (gErr) console.error('groups query error:', gErr);
    else console.log('Existing groups:', groups);

    const { data: options, error: oErr } = await supabase
        .from('menu_item_options')
        .select('*');

    if (oErr) console.error('options query error:', oErr);
    else console.log('Existing options count:', options?.length);
}

inspect();
