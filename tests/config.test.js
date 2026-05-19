const path = require('path');
const {
  assertRuntimeConfig,
  getConfig,
  getRequiredAdminPassword,
  VULNERABLE_ADMIN_PASSWORD,
  VULNERABLE_SESSION_SECRET
} = require('../src/config');

describe('getConfig', () => {
  test('uses insecure fallback values on vulnerable branch', () => {
    const config = getConfig({});

    expect(config.port).toBe(3000);
    expect(config.dbPath).toBe(path.join(process.cwd(), 'data', 'minicart-admin.sqlite'));
    expect(config.sessionSecret).toBe(VULNERABLE_SESSION_SECRET);
    expect(config.adminPassword).toBe(VULNERABLE_ADMIN_PASSWORD);
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

  test('accepts runtime config without session secret env', () => {
    expect(assertRuntimeConfig(getConfig({})).sessionSecret).toBe(VULNERABLE_SESSION_SECRET);
  });

  test('accepts seed password without env', () => {
    expect(getRequiredAdminPassword(getConfig({ SESSION_SECRET: 'x' }))).toBe(VULNERABLE_ADMIN_PASSWORD);
  });
});
