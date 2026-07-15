const { Collection } = require('postman-collection');
const { buildItem, jsonBody, contentTypeHeader } = require('./lib/request');
const { statusTest, responseTimeTest } = require('./lib/test-scripts');
const { cartSchema } = require('./lib/schemas');
const { ensureAuthenticated } = require('./lib/auth-flow');

function buildCartsCollection() {
    const collection = new Collection({
        info: {
            name: 'carts',
            description: "Cart endpoints, keyed off {{userId}}. A pre-request script (the same "
                + 'JWT-expiry-aware auto-login used in the auth collection) guarantees a fresh '
                + '{{userId}} is set, so these requests work standalone, not only after the '
                + 'auth collection has run.',
            schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
    });

    collection.items.add(buildItem({
        name: 'Get User Carts',
        method: 'GET',
        url: '{{baseUrl}}/carts/user/{{userId}}',
        description: 'Get all carts belonging to the logged-in user. Expected: 200 with '
            + '{ carts[], total, skip, limit }.',
        preRequest: ensureAuthenticated(),
        test: [
            ...statusTest(200, 'Returns 200 with user carts'),
            "const body = pm.response.json();",
            "pm.test('Response has carts array and pagination fields', () => {",
            "    pm.expect(body.carts).to.be.an('array');",
            "    pm.expect(body.total).to.be.a('number');",
            "});",
            ...responseTimeTest(),
        ],
    }));

    collection.items.add(buildItem({
        name: 'Add Cart',
        method: 'POST',
        url: '{{baseUrl}}/carts/add',
        headers: [contentTypeHeader()],
        body: jsonBody({
            userId: '{{userId}}',
            products: [
                { id: 1, quantity: 2 },
                { id: 2, quantity: 1 },
            ],
        }),
        description: 'Create a new cart for the logged-in user. Expected: 201 with the new '
            + 'cart, including a computed total.',
        preRequest: ensureAuthenticated(),
        test: [
            ...statusTest(201, 'Returns 201 with created cart'),
            `const schema = ${JSON.stringify(cartSchema)};`,
            "const body = pm.response.json();",
            "pm.test('Created cart matches schema', () => {",
            "    pm.expect(tv4.validate(body, schema)).to.be.true;",
            "});",
            "pm.test('Cart total reflects submitted products', () => {",
            "    pm.expect(body.totalProducts).to.eql(2);",
            "    pm.expect(body.total).to.be.above(0);",
            "});",
            ...responseTimeTest(),
        ],
    }));

    return collection;
}

module.exports = { buildCartsCollection };
