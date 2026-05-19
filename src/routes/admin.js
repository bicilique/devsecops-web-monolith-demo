const express = require('express');

function createAdminRouter({ db, requireAuth }) {
  const router = express.Router();

  router.get('/admin', requireAuth, async (req, res, next) => {
    try {
      const dashboard = await db.getDashboardSnapshot(5);

      res.render('dashboard', {
        title: 'Administrator Dashboard',
        productCount: dashboard.productCount,
        auditLogs: dashboard.auditLogs,
        currentUser: req.session.user,
        totalAuditLogCount: dashboard.totalAuditLogCount || dashboard.auditLogs.length
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = {
  createAdminRouter
};
