const { Item } = require('postman-collection');

function jsonBody(payload) {
    return {
        mode: 'raw',
        raw: JSON.stringify(payload, null, 2),
        options: { raw: { language: 'json' } },
    };
}

function authHeader(tokenVar = 'accessToken') {
    return {
        key: 'Authorization',
        value: `Bearer {{${tokenVar}}}`,
        description: `Auto-populated after running Login - Valid Credentials (var: ${tokenVar})`,
    };
}

function contentTypeHeader() {
    return { key: 'Content-Type', value: 'application/json' };
}

function buildItem({ name, method, url, headers = [], body, description, preRequest, test }) {
    const item = new Item({
        name,
        request: {
            method,
            header: headers,
            ...(body ? { body } : {}),
            url,
            description,
        },
    });

    if (preRequest) {
        item.events.add({ listen: 'prerequest', script: { exec: preRequest } });
    }
    if (test) {
        item.events.add({ listen: 'test', script: { exec: test } });
    }

    return item;
}

module.exports = { jsonBody, authHeader, contentTypeHeader, buildItem };
