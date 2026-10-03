import fs from 'fs';
import path from 'path';

function searchAll(dir, query) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        try {
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
                if (f !== '.git' && f !== 'node_modules' && f !== '.next') {
                    searchAll(full, query);
                }
            } else {
                const content = fs.readFileSync(full, 'utf8');
                if (content.includes(query)) {
                    console.log(`Match in ${full}`);
                }
            }
        } catch (e) {}
    }
}

searchAll('.', 'الصنف المطلوب');
searchAll('.', 'غير موجود');
