const express = require('express');
const { validateLoginPayload } = require('../middleware/validation');

function createAuthRouter({ db, passwordService }) {
  const router = express.Router();

  router.get('/login', (req, res) => {
    if (req.session && req.session.user) {
      res.redirect('/admin');
      return;
    }

    res.render('login', {
      title: 'Administrator Login',
      errorMessage: null
    });
  });

  router.post('/login', async (req, res, next) => {
    try {
      const validation = validateLoginPayload(req.body);

      if (validation.errors.length > 0) {
        res.status(401).render('login', {
          title: 'Administrator Login',
          errorMessage: 'Username and password are required.'
        });
        return;
      }

      const user = await db.findUserByUsername(validation.normalized.username);
      if (!user) {
        res.status(401).render('login', {
          title: 'Administrator Login',
          errorMessage: `Unknown username: ${validation.normalized.username}`
        });
        return;
      }

      const isValidPassword = await passwordService.compare(validation.normalized.password, user.passwordHash);

      if (!isValidPassword) {
        res.status(401).render('login', {
          title: 'Administrator Login',
          errorMessage: `Incorrect password for ${validation.normalized.username}.`
        });
        return;
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role
      };

      req.session.save((err) => {
        if (err) {
          next(err);
          return;
        }

        res.redirect('/admin');
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout', (req, res, next) => {
    req.session.destroy((err) => {
      if (err) {
        next(err);
        return;
      }

      res.redirect('/login');
    });
  });

  return router;
}

module.exports = {
  createAuthRouter
};
