import fs from 'fs';
import path from 'path';

function searchTerms(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            if (f !== 'node_modules' && f !== '.git' && f !== 'dist') searchTerms(full);
        } else if (f.endsWith('.js') || f.endsWith('.jsx')) {
            const content = fs.readFileSync(full, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
                if (line.includes('غير موجود') || line.includes('غير متاح') || line.includes('لا توجد') || line.includes('statusLabel') || line.includes('isAvailable')) {
                    console.log(`${full}:${idx + 1} -> ${line.trim()}`);
                }
            });
        }
    }
}

searchTerms('./src');
