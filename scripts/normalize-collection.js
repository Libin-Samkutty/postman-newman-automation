// Strips `id`/`_postman_id` fields before diffing collections — postman-collection
// assigns a fresh random UUID to every item/script/collection on each build, so
// comparing raw output would always show "drift" even with no real content change.
const fs = require('fs');

function stripIds(value) {
    if (Array.isArray(value)) {
        return value.map(stripIds);
    }
    if (value && typeof value === 'object') {
        const result = {};
        for (const [key, val] of Object.entries(value)) {
            if (key === 'id' || key === '_postman_id') continue;
            result[key] = stripIds(val);
        }
        return result;
    }
    return value;
}

const [, , filePath] = process.argv;
const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
process.stdout.write(JSON.stringify(stripIds(parsed), null, 2) + '\n');
