const { Collection } = require('postman-collection');
const { buildAuthCollection } = require('./build-auth');
const { buildUsersCollection } = require('./build-users');
const { buildProductsCollection } = require('./build-products');
const { buildCartsCollection } = require('./build-carts');

const FOLDERS = [
    { name: 'Auth', build: buildAuthCollection },
    { name: 'Users', build: buildUsersCollection },
    { name: 'Products', build: buildProductsCollection },
    { name: 'Carts', build: buildCartsCollection },
];

function buildRegressionCollection() {
    const collection = new Collection({
        info: {
            name: 'regression',
            description: 'Orchestrates Auth -> Users -> Products -> Carts in sequence. '
                + 'Auth must run first — it seeds the accessToken/refreshToken/userId '
                + 'collection variables every other folder depends on.',
            schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
    });

    for (const { name, build } of FOLDERS) {
        const built = build().toJSON();
        collection.items.add({ name, item: built.item });
    }

    return collection;
}

module.exports = { buildRegressionCollection };
