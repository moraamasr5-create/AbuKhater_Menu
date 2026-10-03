import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';
const supabase = createClient(url, anonKey);

async function cleanTestOptionGroup() {
    console.log('Cleaning test option group "نوع العيش" from شاورما فراخ...');
    
    // First delete options in group
    const { error: optErr } = await supabase
        .from('menu_item_options')
        .delete()
        .eq('group_id', 'd32d8b03-64c6-48ef-b482-d0bc4f5d5859');

    if (optErr) console.error('Error deleting options:', optErr);
    else console.log('✓ Deleted test options (فينو, كايزر, فرنساوي)');

    // Then delete option group
    const { error: grpErr } = await supabase
        .from('menu_item_option_groups')
        .delete()
        .eq('id', 'd32d8b03-64c6-48ef-b482-d0bc4f5d5859');

    if (grpErr) console.error('Error deleting option group:', grpErr);
    else console.log('✓ Deleted test option group "نوع العيش"');

    // Also update variant for برجر سادة from 'عيش سوري' to 'كبير'
    const { error: varErr } = await supabase
        .from('menu_item_variants')
        .update({ name: 'كبير' })
        .eq('menu_item_id', '1e772dbd-643c-4d2a-af71-6cf0666d0b60')
        .eq('name', 'عيش سوري');

    if (varErr) console.error('Error updating burger variant:', varErr);
    else console.log('✓ Corrected variant name for برجر سادة to "كبير"');
}

cleanTestOptionGroup();
