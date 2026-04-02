const express = require('express');
const auth = require('../middlewares/auth');
const authController = require('../controllers/auth');
const { ok, fail } = require('../utils/response');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const data = await authController.register(req.body);
    return ok(res, data, 'Register success', 201);
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = await authController.login(req.body);
    return ok(res, data, 'Login success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.post('/refresh-token', async (req, res) => {
  try {
    const data = await authController.refreshToken(req.body);
    return ok(res, data, 'Refresh token success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.post('/logout', auth, async (req, res) => {
  try {
    const data = await authController.logout({ userId: req.user._id });
    return ok(res, data, 'Logout success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const data = await authController.me({ userId: req.user._id });
    return ok(res, data, 'Get profile success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

module.exports = router;
