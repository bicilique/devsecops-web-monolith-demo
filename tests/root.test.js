const { createApp } = require('../src/app');
const { invokeApp } = require('./helpers/http');

describe('GET /', () => {
  test('redirects unauthenticated user to login', async () => {
    const app = createApp({
      config: {
        sessionSecret: 'test-secret',
        isProduction: false
      },
      db: {}
    });

    const { res } = await invokeApp(app, {
      method: 'GET',
      url: '/'
    });

    expect(res.statusCode).toBe(302);
    expect(res._getRedirectUrl()).toBe('/login');
  });
});
