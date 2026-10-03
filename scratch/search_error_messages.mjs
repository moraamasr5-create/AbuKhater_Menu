import fs from 'fs';
import path from 'path';

function searchInDir(dir, pattern) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            if (f !== 'node_modules' && f !== '.git' && f !== 'dist') searchInDir(full, pattern);
        } else if (f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.json')) {
            const content = fs.readFileSync(full, 'utf8');
            if (content.includes(pattern)) {
                console.log(`Found "${pattern}" in: ${full}`);
            }
        }
    }
}

console.log('Searching for error messages...');
searchInDir('./src', 'غير موجود');
searchInDir('./src', 'قائمة الطعام');
searchInDir('./src', 'غير متاح');
