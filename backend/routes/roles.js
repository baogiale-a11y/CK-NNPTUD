const express = require('express');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const roleController = require('../controllers/role');
const { ok, fail } = require('../utils/response');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const data = await roleController.getRoles();
    return ok(res, data, 'Get roles success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const data = await roleController.createRole(req.body);
    return ok(res, data, 'Create role success', 201);
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const data = await roleController.updateRole({ id: req.params.id, body: req.body });
    return ok(res, data, 'Update role success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const data = await roleController.deleteRole({ id: req.params.id });
    return ok(res, data, 'Delete role success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

module.exports = router;
