const path = require('path');
const { assertRuntimeConfig, getConfig, getRequiredAdminPassword } = require('../src/config');

describe('getConfig', () => {
  test('uses default values without insecure secret fallback', () => {
    const config = getConfig({});

    expect(config.port).toBe(3000);
    expect(config.dbPath).toBe(path.join(process.cwd(), 'data', 'minicart-admin.sqlite'));
    expect(config.sessionSecret).toBeNull();
    expect(config.adminPassword).toBeNull();
    expect(config.isProduction).toBe(false);
  });

  test('respects environment overrides', () => {
    const config = getConfig({
      PORT: '4010',
      SQLITE_DB_PATH: '/tmp/minicart.db',
      SESSION_SECRET: 'phase2-secret',
      ADMIN_PASSWORD: 'seeded-admin-secret',
      NODE_ENV: 'production'
    });

    expect(config.port).toBe(4010);
    expect(config.dbPath).toBe('/tmp/minicart.db');
    expect(config.sessionSecret).toBe('phase2-secret');
    expect(config.adminPassword).toBe('seeded-admin-secret');
    expect(config.isProduction).toBe(true);
  });

  test('fails fast when runtime session secret missing', () => {
    expect(() => assertRuntimeConfig(getConfig({}))).toThrow('SESSION_SECRET is required.');
  });

  test('fails fast when seed password missing', () => {
    expect(() => getRequiredAdminPassword(getConfig({ SESSION_SECRET: 'x' }))).toThrow(
      'ADMIN_PASSWORD is required for database seeding.'
    );
  });
});
