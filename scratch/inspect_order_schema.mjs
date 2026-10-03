import { createClient } from '@supabase/supabase-js';

const url = 'https://htpnxizfqmnnkhemvmdz.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cG54aXpmcW1ubmtoZW12bWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTMzODAsImV4cCI6MjA5NDM4OTM4MH0.HFhoKhyf5VrfAXLGdg1I8ndSgiWBSm6fRXMs56V8rjU';

const supabase = createClient(url, anonKey);

async function inspectOrderSchema() {
    console.log('--- Inspecting Orders and Order Items Schema ---');

    // 1. Fetch a sample order_item if any exists
    const { data: sampleItems, error: itemsErr } = await supabase
        .from('order_items')
        .select('*')
        .limit(3);

    console.log('Sample order_items columns:', sampleItems?.[0] ? Object.keys(sampleItems[0]) : 'No rows found', sampleItems);

    // 2. Fetch a sample order if any exists
    const { data: sampleOrders, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .limit(1);

    console.log('Sample orders columns:', sampleOrders?.[0] ? Object.keys(sampleOrders[0]) : 'No rows found');
}

inspectOrderSchema();
