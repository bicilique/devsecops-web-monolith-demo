const { createApp } = require('../src/app');
const { invokeApp } = require('./helpers/http');

describe('GET /health', () => {
  test('returns ok status payload', async () => {
    const app = createApp({
      config: {
        sessionSecret: 'test-secret',
        isProduction: false
      },
      db: {}
    });
    const { res } = await invokeApp(app, {
      method: 'GET',
      url: '/health'
    });

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({ status: 'ok' });
  });
});
