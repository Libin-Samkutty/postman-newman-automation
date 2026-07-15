const fs = require('fs');
const path = require('path');
const { Collection } = require('postman-collection');

const collectionsDir = path.join(__dirname, '..', 'collections');
const files = fs.readdirSync(collectionsDir).filter((f) => f.endsWith('.json'));

if (files.length === 0) {
    console.error('No collections found in collections/. Run npm run build:collections first.');
    process.exit(1);
}

let failed = false;

for (const file of files) {
    const filePath = path.join(collectionsDir, file);
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(raw);
        const collection = new Collection(json);

        if (!collection.name) {
            throw new Error('collection is missing info.name');
        }
        if (collection.items.count() === 0) {
            throw new Error('collection has no items');
        }

        console.log(`ok   ${file} (${collection.items.count()} top-level items)`);
    } catch (err) {
        console.error(`fail ${file} — ${err.message}`);
        failed = true;
    }
}

process.exit(failed ? 1 : 0);
