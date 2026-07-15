const { Collection } = require('postman-collection');
const { buildItem, jsonBody, authHeader, contentTypeHeader } = require('./lib/request');
const { statusTest, responseTimeTest, errorMessageTest, saveAuthTokensScript, refreshTokensScript } = require('./lib/test-scripts');
const { ensureAuthenticated } = require('./lib/auth-flow');

function buildAuthCollection() {
    const collection = new Collection({
        info: {
            name: 'auth',
            description: 'Authentication endpoints: login, get current user, refresh token. '
                + 'The login request stores accessToken/refreshToken/userId as collection '
                + 'variables — every other collection in this repo depends on it running first.',
            schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
    });

    collection.items.add(buildItem({
        name: 'Login - Valid Credentials',
        method: 'POST',
        url: '{{baseUrl}}/auth/login',
        headers: [contentTypeHeader()],
        body: jsonBody({ username: 'emilys', password: 'emilyspass', expiresInMins: 60 }),
        description: 'Authenticate with valid credentials. Saves accessToken/refreshToken/userId '
            + 'as collection variables for use by every other request in this repo.',
        test: [...saveAuthTokensScript(), ...responseTimeTest()],
    }));

    collection.items.add(buildItem({
        name: 'Login - Invalid Credentials',
        method: 'POST',
        url: '{{baseUrl}}/auth/login',
        headers: [contentTypeHeader()],
        body: jsonBody({ username: 'invalid_user', password: 'wrong_password' }),
        description: 'Attempt login with wrong credentials. Expected: 400.',
        test: [
            ...statusTest(400, 'Returns 400 for invalid credentials'),
            ...errorMessageTest(),
            ...responseTimeTest(),
        ],
    }));

    collection.items.add(buildItem({
        name: 'Get Authenticated User',
        method: 'GET',
        url: '{{baseUrl}}/auth/me',
        headers: [authHeader()],
        description: "Fetch the authenticated user profile. A pre-request script decodes the "
            + "stored access token's JWT exp claim and transparently re-authenticates if it's "
            + 'missing or expiring soon, so this request works standalone, not only after '
            + 'Login - Valid Credentials.',
        preRequest: ensureAuthenticated(),
        test: [
            ...statusTest(200, 'Returns 200 with user profile'),
            "const body = pm.response.json();",
            "pm.test('Profile has required fields', () => {",
            "    pm.expect(body.id).to.be.a('number');",
            "    pm.expect(body.username).to.be.a('string').and.not.empty;",
            "    pm.expect(body.email).to.be.a('string').and.not.empty;",
            "});",
            ...responseTimeTest(),
        ],
    }));

    collection.items.add(buildItem({
        name: 'Get Authenticated User - Invalid Token',
        method: 'GET',
        url: '{{baseUrl}}/auth/me',
        headers: [{ key: 'Authorization', value: 'Bearer this-is-not-a-valid-token', description: 'Deliberately invalid token' }],
        description: 'Call /auth/me with a deliberately invalid Bearer token. Expected: 401.',
        test: [
            ...statusTest(401, 'Returns 401 for invalid auth token'),
            ...errorMessageTest(),
            ...responseTimeTest(),
        ],
    }));

    collection.items.add(buildItem({
        name: 'Refresh Token',
        method: 'POST',
        url: '{{baseUrl}}/auth/refresh',
        headers: [contentTypeHeader()],
        body: jsonBody({ refreshToken: '{{refreshToken}}', expiresInMins: 60 }),
        description: 'Exchange a refresh token for a new access token. Run Login - Valid '
            + 'Credentials first to populate {{refreshToken}}. Updates the stored tokens.',
        test: [
            ...statusTest(200, 'Returns 200 with new tokens'),
            "const body = pm.response.json();",
            "pm.test('New tokens are strings', () => {",
            "    pm.expect(body.accessToken).to.be.a('string').and.not.empty;",
            "    pm.expect(body.refreshToken).to.be.a('string').and.not.empty;",
            "});",
            ...refreshTokensScript(),
            ...responseTimeTest(),
        ],
    }));

    return collection;
}

module.exports = { buildAuthCollection };
