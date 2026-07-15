const { Collection } = require('postman-collection');
const { buildItem, jsonBody, contentTypeHeader } = require('./lib/request');
const { statusTest, responseTimeTest, errorMessageTest } = require('./lib/test-scripts');
const { productSchema, schemaTestLines } = require('./lib/schemas');

function buildProductsCollection() {
    const collection = new Collection({
        info: {
            name: 'products',
            description: 'Product endpoints: list, paginate, search, get by ID, create.',
            schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
    });

    collection.items.add(buildItem({
        name: 'Get All Products',
        method: 'GET',
        url: '{{baseUrl}}/products',
        description: 'Get the full list of products (default limit: 30). Expected: 200 with '
            + '{ products[], total, skip, limit }.',
        test: [
            ...statusTest(200, 'Returns 200 with product list'),
            "const body = pm.response.json();",
            "pm.test('Response has products array and pagination fields', () => {",
            "    pm.expect(body.products).to.be.an('array').and.not.empty;",
            "    pm.expect(body.total).to.be.a('number');",
            "    pm.expect(body.skip).to.be.a('number');",
            "    pm.expect(body.limit).to.be.a('number');",
            "});",
            `const schema = ${JSON.stringify(productSchema)};`,
            "pm.test('First product matches schema', () => {",
            "    pm.expect(tv4.validate(body.products[0], schema)).to.be.true;",
            "});",
            ...responseTimeTest(),
        ],
    }));

    collection.items.add(buildItem({
        name: 'Get Products - Paginated',
        method: 'GET',
        url: '{{baseUrl}}/products?limit=10&skip=10',
        description: 'Get a paginated subset of products (page 2, 10 per page). Expected: 200 '
            + 'with skip: 10 and limit: 10 in the response.',
        test: [
            ...statusTest(200, 'Returns 200 with paginated results'),
            "const body = pm.response.json();",
            "pm.test('Pagination fields match the request', () => {",
            "    pm.expect(body.products).to.be.an('array');",
            "    pm.expect(body.limit).to.eql(10);",
            "    pm.expect(body.skip).to.eql(10);",
            "});",
            ...responseTimeTest(),
        ],
    }));

    collection.items.add(buildItem({
        name: 'Search Products',
        method: 'GET',
        url: '{{baseUrl}}/products/search?q=phone',
        description: 'Search products by keyword. Expected: 200 with matching products only.',
        test: [
            ...statusTest(200, 'Returns 200 with search results'),
            "const body = pm.response.json();",
            "pm.test('All results match the search term', () => {",
            "    pm.expect(body.products).to.be.an('array');",
            "    body.products.forEach((p) => {",
            "        const haystack = `${p.title} ${p.description}`.toLowerCase();",
            "        pm.expect(haystack).to.include('phone');",
            "    });",
            "});",
            ...responseTimeTest(),
        ],
    }));

    collection.items.add(buildItem({
        name: 'Get Product by ID',
        method: 'GET',
        url: '{{baseUrl}}/products/1',
        description: 'Get a single product by ID. Expected: 200 with full product details '
            + 'matching schema.',
        test: [
            ...statusTest(200, 'Returns 200 with product details'),
            ...schemaTestLines('Response matches product schema', productSchema),
            "pm.test('Requested product id matches', () => {",
            "    pm.expect(response.id).to.eql(1);",
            "});",
            ...responseTimeTest(),
        ],
    }));

    collection.items.add(buildItem({
        name: 'Get Product - Not Found',
        method: 'GET',
        url: '{{baseUrl}}/products/99999',
        description: 'Request a product with an ID that does not exist. Expected: 404.',
        test: [
            ...statusTest(404, 'Returns 404 for non-existent product'),
            ...errorMessageTest(),
            ...responseTimeTest(),
        ],
    }));

    collection.items.add(buildItem({
        name: 'Create Product',
        method: 'POST',
        url: '{{baseUrl}}/products/add',
        headers: [contentTypeHeader()],
        body: jsonBody({
            title: 'Test Product',
            description: 'A product created for automation testing',
            price: 99.99,
            stock: 50,
            category: 'electronics',
            brand: 'TestBrand',
        }),
        description: 'Create a new product. DummyJSON simulates the creation but does not '
            + 'persist data. Expected: 201 with a server-assigned id.',
        test: [
            ...statusTest(201, 'Returns 201 with created product'),
            "const body = pm.response.json();",
            "pm.test('Created product echoes submitted fields', () => {",
            "    pm.expect(body.id).to.be.a('number');",
            "    pm.expect(body.title).to.eql('Test Product');",
            "    pm.expect(body.price).to.eql(99.99);",
            "});",
            ...responseTimeTest(),
        ],
    }));

    return collection;
}

module.exports = { buildProductsCollection };
