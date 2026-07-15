// Shared pre-request script: decodes the stored access token's JWT `exp`
// claim and transparently re-authenticates via /auth/login if it's missing,
// unparseable, or expiring within `bufferSeconds` — so any request using
// this doesn't depend on the auth collection having run first, and survives
// token expiry mid-run without failing.
function ensureAuthenticated({ bufferSeconds = 60 } = {}) {
    return [
        "function decodeJwtExp(token) {",
        "    try {",
        "        return JSON.parse(atob(token.split('.')[1])).exp;",
        "    } catch (e) {",
        "        return null;",
        "    }",
        "}",
        "",
        "const existingToken = pm.collectionVariables.get('accessToken');",
        "const existingUserId = pm.collectionVariables.get('userId');",
        "const nowSeconds = Math.floor(Date.now() / 1000);",
        `const bufferSeconds = ${bufferSeconds};`,
        "const exp = existingToken ? decodeJwtExp(existingToken) : null;",
        "const needsReauth = !existingToken || !existingUserId || !exp || (exp - nowSeconds) < bufferSeconds;",
        "",
        "if (needsReauth) {",
        "    pm.sendRequest({",
        "        url: pm.variables.get('baseUrl') + '/auth/login',",
        "        method: 'POST',",
        "        header: { 'Content-Type': 'application/json' },",
        "        body: {",
        "            mode: 'raw',",
        "            raw: JSON.stringify({ username: 'emilys', password: 'emilyspass', expiresInMins: 60 }),",
        "        },",
        "    }, (err, res) => {",
        "        if (!err && res.code === 200) {",
        "            const body = res.json();",
        "            pm.collectionVariables.set('accessToken', body.accessToken);",
        "            pm.collectionVariables.set('refreshToken', body.refreshToken);",
        "            pm.collectionVariables.set('userId', body.id);",
        "        }",
        "    });",
        "}",
    ];
}

module.exports = { ensureAuthenticated };
