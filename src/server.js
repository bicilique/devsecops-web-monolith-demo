const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const { assertRuntimeConfig, getConfig } = require('./config');
const { connectToDb } = require('./db');
const { createApp } = require('./app');

function startServer(env = process.env) {
  const config = assertRuntimeConfig(getConfig(env));
  const db = connectToDb(config.dbPath);
  const app = createApp({
    config,
    db,
    passwordService: bcrypt
  });
  const server = app.listen(config.port, () => {
    console.log(`MiniCart Admin listening on port ${config.port}`);
  });

  server.on('close', () => {
    db.close();
  });

  return { app, server, db, config };
}

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer
};
