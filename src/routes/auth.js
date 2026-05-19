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
          errorMessage: validation.errors[0]
        });
        return;
      }

      const user = await db.findUserByUsername(validation.normalized.username);
      const isValidPassword = user
        ? await passwordService.compare(validation.normalized.password, user.passwordHash)
        : false;

      if (!isValidPassword) {
        res.status(401).render('login', {
          title: 'Administrator Login',
          errorMessage: 'Invalid username or password.'
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
