const path = require('path');

function getConfig(env = process.env) {
  const port = Number.parseInt(env.PORT || '3000', 10);
  const dbPath = env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'minicart-admin.sqlite');
  const sessionSecret = env.SESSION_SECRET || null;
  const adminPassword = env.ADMIN_PASSWORD || null;

  return {
    port: Number.isNaN(port) ? 3000 : port,
    dbPath,
    sessionSecret,
    adminPassword,
    isProduction: env.NODE_ENV === 'production'
  };
}

function assertRuntimeConfig(config) {
  if (!config.sessionSecret) {
    throw new Error('SESSION_SECRET is required.');
  }

  return config;
}

function getRequiredAdminPassword(config) {
  if (!config.adminPassword) {
    throw new Error('ADMIN_PASSWORD is required for database seeding.');
  }

  return config.adminPassword;
}

module.exports = {
  assertRuntimeConfig,
  getConfig,
  getRequiredAdminPassword
};
