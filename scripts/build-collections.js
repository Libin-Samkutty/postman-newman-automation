const fs = require('fs');
const path = require('path');
const { buildAuthCollection } = require('../src/build-auth');
const { buildUsersCollection } = require('../src/build-users');
const { buildProductsCollection } = require('../src/build-products');
const { buildCartsCollection } = require('../src/build-carts');
const { buildRegressionCollection } = require('../src/build-regression');

const builders = {
    'auth.collection.json': buildAuthCollection,
    'users.collection.json': buildUsersCollection,
    'products.collection.json': buildProductsCollection,
    'carts.collection.json': buildCartsCollection,
    'regression.collection.json': buildRegressionCollection,
};

const outDir = path.join(__dirname, '..', 'collections');
fs.mkdirSync(outDir, { recursive: true });

for (const [filename, build] of Object.entries(builders)) {
    const outPath = path.join(outDir, filename);
    fs.writeFileSync(outPath, JSON.stringify(build().toJSON(), null, 2) + '\n');
    console.log(`built ${filename}`);
}
