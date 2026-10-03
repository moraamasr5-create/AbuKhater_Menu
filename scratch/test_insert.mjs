import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function testInsert() {
    const { data, error } = await supabase
        .from('menu_item_variants')
        .insert({
            menu_item_id: '808c11d2-d7af-4512-bb2c-1c14510a1d14',
            name: 'عادي',
            price: 105,
            display_order: 1,
            is_available: true
        })
        .select();

    console.log('Insert result:', { data, error });
}

testInsert();
