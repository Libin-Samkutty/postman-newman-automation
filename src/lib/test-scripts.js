function statusTest(code, label) {
    return [
        `pm.test("${label || `Returns ${code}`}", () => {`,
        `    pm.expect(pm.response.code).to.eql(${code});`,
        `});`,
    ];
}

function responseTimeTest(maxMs = 2000) {
    return [
        `pm.test("Response time is under ${maxMs}ms", () => {`,
        `    pm.expect(pm.response.responseTime).to.be.below(${maxMs});`,
        `});`,
    ];
}

function errorMessageTest() {
    return [
        `pm.test("Error message present", () => {`,
        `    const body = pm.response.json();`,
        `    pm.expect(body.message).to.be.a('string').and.not.empty;`,
        `});`,
    ];
}

function saveAuthTokensScript() {
    return [
        "if (pm.response.code === 200) {",
        "    const body = pm.response.json();",
        "    pm.collectionVariables.set('accessToken', body.accessToken);",
        "    pm.collectionVariables.set('refreshToken', body.refreshToken);",
        "    pm.collectionVariables.set('userId', body.id);",
        "    pm.test('Login succeeded and tokens saved', () => {",
        "        pm.expect(body.accessToken).to.be.a('string').and.not.empty;",
        "        pm.expect(body.refreshToken).to.be.a('string').and.not.empty;",
        "    });",
        "    pm.test('Response contains user data', () => {",
        "        pm.expect(body.username).to.eql('emilys');",
        "        pm.expect(body.email).to.be.a('string');",
        "        pm.expect(body.id).to.be.a('number');",
        "    });",
        "}",
    ];
}

function refreshTokensScript() {
    return [
        "if (pm.response.code === 200) {",
        "    const body = pm.response.json();",
        "    pm.collectionVariables.set('accessToken', body.accessToken);",
        "    pm.collectionVariables.set('refreshToken', body.refreshToken);",
        "}",
    ];
}

function dynamicUserPreRequest() {
    return [
        "const timestamp = Date.now();",
        "// Falls back to timestamp-based generation on a plain run; picks up",
        "// per-row values automatically when run with --iteration-data (see data/users.csv).",
        "pm.variables.set('dynamicFirstName', pm.iterationData.get('firstName') || `Test_${timestamp}`);",
        "pm.variables.set('dynamicLastName', pm.iterationData.get('lastName') || 'Automation');",
        "pm.variables.set('dynamicEmail', pm.iterationData.get('email') || `testuser_${timestamp}@healthsaas.com`);",
    ];
}

module.exports = {
    statusTest,
    responseTimeTest,
    errorMessageTest,
    saveAuthTokensScript,
    refreshTokensScript,
    dynamicUserPreRequest,
};
