import fs from 'fs';

console.log('=== VERIFYING CONNECTION ALIGNMENT ACROSS REPOSITORIES ===\n');

// 1. Check Menu .env
const menuEnv = fs.readFileSync('c:\\Users\\mamdo\\Documents\\GitHub\\AbuKhater_Menu\\.env', 'utf8');
const menuEnvLines = menuEnv.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

// 2. Check Delivery .env
const deliveryEnv = fs.readFileSync('c:\\Users\\mamdo\\Documents\\GitHub\\AbuKhater_delivery\\.env', 'utf8');
const deliveryEnvLines = deliveryEnv.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

console.log('--- AbuKhater_Menu Environment ---');
menuEnvLines.forEach(l => {
  const [k, ...v] = l.split('=');
  const val = v.join('=');
  console.log(`  ${k} = ${val.length > 40 ? val.slice(0, 30) + '...' + val.slice(-10) : val}`);
});

console.log('\n--- AbuKhater_delivery Environment ---');
deliveryEnvLines.forEach(l => {
  const [k, ...v] = l.split('=');
  const val = v.join('=');
  console.log(`  ${k} = ${val.length > 40 ? val.slice(0, 30) + '...' + val.slice(-10) : val}`);
});

// 3. Inspect Supabase Client in Menu
const menuClientCode = fs.readFileSync('c:\\Users\\mamdo\\Documents\\GitHub\\AbuKhater_Menu\\src\\services\\supabase\\supabaseClient.js', 'utf8');
console.log('\n--- Menu Supabase Client ---');
console.log(menuClientCode.trim());

// 4. Inspect Supabase Client in Delivery
const deliveryClientCode = fs.readFileSync('c:\\Users\\mamdo\\Documents\\GitHub\\AbuKhater_delivery\\src\\services\\supabase\\supabaseClient.js', 'utf8');
console.log('\n--- Delivery Supabase Client ---');
console.log(deliveryClientCode.trim());
