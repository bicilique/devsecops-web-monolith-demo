function createAuditService(db) {
  function normalizeAuditRow(row) {
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      username: row.username,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      metadata: row.metadata,
      createdAt: row.created_at
    };
  }

  async function listAuditLogs(limit = null) {
    const baseQuery =
      `SELECT id, username, action, entity_type, entity_id, metadata, created_at
       FROM audit_logs
       ORDER BY datetime(created_at) DESC, id DESC`;
    const rows = limit
      ? await db.all(`${baseQuery} LIMIT ?`, [limit])
      : await db.all(baseQuery);

    return rows.map(normalizeAuditRow);
  }

  async function logProductAction({ username, action, entityId, metadata }) {
    const result = await db.run(
      `INSERT INTO audit_logs (username, action, entity_type, entity_id, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [username, action, 'product', entityId, JSON.stringify(metadata || {})]
    );

    return db.get(
      `SELECT id, username, action, entity_type, entity_id, metadata, created_at
       FROM audit_logs
       WHERE id = ?`,
      [result.lastID]
    ).then(normalizeAuditRow);
  }

  return {
    listAuditLogs,
    logProductAction
  };
}

module.exports = {
  createAuditService
};
