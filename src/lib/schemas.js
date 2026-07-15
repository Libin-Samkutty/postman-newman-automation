const userSchema = {
    type: 'object',
    required: ['id', 'firstName', 'lastName', 'email', 'age'],
    properties: {
        id: { type: 'number' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        age: { type: 'number', minimum: 0 },
    },
};

const productSchema = {
    type: 'object',
    required: ['id', 'title', 'price', 'category'],
    properties: {
        id: { type: 'number' },
        title: { type: 'string' },
        price: { type: 'number', minimum: 0 },
        category: { type: 'string' },
    },
};

const cartSchema = {
    type: 'object',
    required: ['id', 'products', 'total', 'userId'],
    properties: {
        id: { type: 'number' },
        products: { type: 'array' },
        total: { type: 'number', minimum: 0 },
        userId: { type: 'number' },
    },
};

function schemaTestLines(testName, schema, { responseVar = 'response' } = {}) {
    return [
        `const schema = ${JSON.stringify(schema)};`,
        `const ${responseVar} = pm.response.json();`,
        `pm.test("${testName}", () => {`,
        `    pm.expect(tv4.validate(${responseVar}, schema)).to.be.true;`,
        `});`,
    ];
}

module.exports = { userSchema, productSchema, cartSchema, schemaTestLines };
