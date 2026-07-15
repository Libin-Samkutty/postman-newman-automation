const { Collection } = require('postman-collection');
const { buildItem, jsonBody, contentTypeHeader } = require('./lib/request');
const { statusTest, responseTimeTest, errorMessageTest, dynamicUserPreRequest } = require('./lib/test-scripts');
const { userSchema, schemaTestLines } = require('./lib/schemas');

function buildUsersCollection() {
    const collection = new Collection({
        info: {
            name: 'users',
            description: 'User CRUD: list, get, create, update, delete — with schema validation '
                + 'and negative cases. DummyJSON simulates writes; nothing persists server-side.',
            schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
    });

    collection.items.add(buildItem({
        name: 'Get All Users',
        method: 'GET',
        url: '{{baseUrl}}/users',
        description: 'Get the full list of users (default limit: 30). Expected: 200 with '
            + '{ users[], total, skip, limit }.',
        test: [
            ...statusTest(200, 'Returns 200 with user list'),
            "const body = pm.response.json();",
            "pm.test('Response has users array and pagination fields', () => {",
            "    pm.expect(body.users).to.be.an('array').and.not.empty;",
            "    pm.expect(body.total).to.be.a('number');",
            "    pm.expect(body.skip).to.be.a('number');",
            "    pm.expect(body.limit).to.be.a('number');",
            "});",
            `const schema = ${JSON.stringify(userSchema)};`,
            "pm.test('First user matches schema', () => {",
            "    pm.expect(tv4.validate(body.users[0], schema)).to.be.true;",
            "});",
            ...responseTimeTest(),
        ],
    }));

    collection.items.add(buildItem({
        name: 'Get User by ID',
        method: 'GET',
        url: '{{baseUrl}}/users/1',
        description: 'Get a single user by ID. Expected: 200 with full user profile matching schema.',
        test: [
            ...statusTest(200, 'Returns 200 with user details'),
            ...schemaTestLines('Response matches user schema', userSchema),
            "pm.test('Requested user id matches', () => {",
            "    pm.expect(response.id).to.eql(1);",
            "});",
            ...responseTimeTest(),
        ],
    }));

    collection.items.add(buildItem({
        name: 'Get User - Not Found',
        method: 'GET',
        url: '{{baseUrl}}/users/99999',
        description: 'Request a user with an ID that does not exist. Expected: 404.',
        test: [
            ...statusTest(404, 'Returns 404 for non-existent user'),
            ...errorMessageTest(),
            ...responseTimeTest(),
        ],
    }));

    collection.items.add(buildItem({
        name: 'Create User',
        method: 'POST',
        url: '{{baseUrl}}/users/add',
        headers: [contentTypeHeader()],
        body: jsonBody({
            firstName: '{{dynamicFirstName}}',
            lastName: '{{dynamicLastName}}',
            email: '{{dynamicEmail}}',
            age: 30,
        }),
        description: 'Create a new user. firstName/lastName/email come from --iteration-data '
            + '(see data/users.csv) when run data-driven, or a timestamp-based fallback '
            + "otherwise, so repeat runs don't collide. DummyJSON simulates the creation and "
            + 'assigns a server-side id.',
        preRequest: dynamicUserPreRequest(),
        test: [
            ...statusTest(201, 'Returns 201 with created user'),
            "const body = pm.response.json();",
            "pm.test('Created user has server-assigned id', () => {",
            "    pm.expect(body.id).to.be.a('number');",
            "});",
            "pm.collectionVariables.set('createdUserId', body.id);",
            ...responseTimeTest(),
        ],
    }));

    collection.items.add(buildItem({
        name: 'Update User',
        method: 'PUT',
        url: '{{baseUrl}}/users/2',
        headers: [contentTypeHeader()],
        body: jsonBody({ firstName: 'Updated' }),
        description: 'Update a seeded user by ID. Note: user 2 exists in the fixed DummyJSON '
            + 'dataset — the id from Create User cannot be reused here, since /users/add is '
            + "simulated and doesn't persist a real record to update or delete. Expected: 200 "
            + 'with the updated field echoed back.',
        test: [
            ...statusTest(200, 'Returns 200 with updated user'),
            "const body = pm.response.json();",
            "pm.test('Updated field is echoed back', () => {",
            "    pm.expect(body.firstName).to.eql('Updated');",
            "});",
            ...responseTimeTest(),
        ],
    }));

    collection.items.add(buildItem({
        name: 'Delete User',
        method: 'DELETE',
        url: '{{baseUrl}}/users/2',
        description: 'Delete a seeded user by ID (see note on Update User re: why a fixed id '
            + 'is used instead of {{createdUserId}}). Expected: 200 with isDeleted: true.',
        test: [
            ...statusTest(200, 'Returns 200 for delete'),
            "const body = pm.response.json();",
            "pm.test('User marked as deleted', () => {",
            "    pm.expect(body.isDeleted).to.be.true;",
            "    pm.expect(body.deletedOn).to.be.a('string');",
            "});",
            ...responseTimeTest(),
        ],
    }));

    return collection;
}

module.exports = { buildUsersCollection };
