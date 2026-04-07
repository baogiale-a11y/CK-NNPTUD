const express = require('express');
const auth = require('../middlewares/auth');
const userController = require('../controllers/user');
const { ok, fail } = require('../utils/response');

const router = express.Router();

router.get('/search', auth, async (req, res) => {
  try {
    const data = await userController.searchUsers({ query: req.query });
    return ok(res, data, 'Search users success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const data = await userController.getUsers();
    return ok(res, data, 'Get users success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const data = await userController.getUserById({ id: req.params.id });
    return ok(res, data, 'Get user success');
  } catch (error) {
    return fail(res, error.message, 404);
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const data = await userController.updateUser({
      id: req.params.id,
      currentUser: req.user,
      body: req.body,
    });
    return ok(res, data, 'Update user success');
  } catch (error) {
    return fail(res, error.message, error.message === 'Forbidden' ? 403 : 400);
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const data = await userController.deleteUser({
      id: req.params.id,
      currentUser: req.user,
    });
    return ok(res, data, 'Delete user success');
  } catch (error) {
    return fail(res, error.message, error.message === 'Forbidden' ? 403 : 400);
  }
});

module.exports = router;
