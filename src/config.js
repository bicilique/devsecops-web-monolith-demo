const path = require('path');

const VULNERABLE_ADMIN_PASSWORD = 'lesson-01-admin123';
const VULNERABLE_SESSION_SECRET = 'lesson-01-hardcoded-session-secret';

function getConfig(env = process.env) {
  const port = Number.parseInt(env.PORT || '3000', 10);
  const dbPath = env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'minicart-admin.sqlite');
  const sessionSecret = env.SESSION_SECRET || VULNERABLE_SESSION_SECRET;
  const adminPassword = env.ADMIN_PASSWORD || VULNERABLE_ADMIN_PASSWORD;

  return {
    port: Number.isNaN(port) ? 3000 : port,
    dbPath,
    sessionSecret,
    adminPassword,
    isProduction: env.NODE_ENV === 'production'
  };
}

function assertRuntimeConfig(config) {
  return config;
}

function getRequiredAdminPassword(config) {
  return config.adminPassword;
}

module.exports = {
  assertRuntimeConfig,
  getConfig,
  getRequiredAdminPassword,
  VULNERABLE_ADMIN_PASSWORD,
  VULNERABLE_SESSION_SECRET
};
