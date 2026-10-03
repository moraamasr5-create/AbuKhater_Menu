import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function inspectExactTargetRows() {
    console.log('--- Inspecting Exact Target Rows for Alignment ---');

    // 1. Shw فراخ
    const { data: shwItems } = await supabase
        .from('menu_items')
        .select('id, name, price, description, status, category_id')
        .ilike('name', '%شاورما فراخ%');
    console.log('\nشاورما فراخ rows:', shwItems);

    // 2. Burger rows
    const { data: burgerItems } = await supabase
        .from('menu_items')
        .select('id, name, price, description, status, category_id')
        .ilike('name', '%برجر%');
    console.log('\nبرجر rows:', burgerItems);

    // 3. Broast meal rows
    const { data: broastItems } = await supabase
        .from('menu_items')
        .select('id, name, price, description, status, category_id')
        .ilike('name', '%بروست%');
    console.log('\nبروست rows:', broastItems);

    // 4. Shish chicken rows
    const { data: shishChicken } = await supabase
        .from('menu_items')
        .select('id, name, price, description, status, category_id')
        .ilike('name', '%فرخة شيش%');
    console.log('\nفرخة شيش rows:', shishChicken);

    // 5. Toum & Coleslaw rows
    const { data: salads } = await supabase
        .from('menu_items')
        .select('id, name, price, description, status, category_id')
        .or('name.ilike.%تومية%,name.ilike.%كلوسلو%');
    console.log('\nسلطات rows:', salads);

    // 6. Categories
    const { data: categories } = await supabase
        .from('categories')
        .select('*');
    console.log('\nCategories:', categories);
}

inspectExactTargetRows();
