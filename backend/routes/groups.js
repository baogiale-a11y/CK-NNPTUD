const express = require('express');
const auth = require('../middlewares/auth');
const groupController = require('../controllers/group');
const { getIO } = require('../utils/socket');
const { ok, fail } = require('../utils/response');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const data = await groupController.getGroups();
    return ok(res, data, 'Get groups success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = await groupController.getGroupById({ id: req.params.id });
    return ok(res, data, 'Get group success');
  } catch (error) {
    return fail(res, error.message, 404);
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const data = await groupController.createGroup({
      body: req.body,
      currentUser: req.user,
    });
    return ok(res, data, 'Create group success', 201);
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const data = await groupController.updateGroup({
      id: req.params.id,
      body: req.body,
      currentUser: req.user,
    });
    return ok(res, data, 'Update group success');
  } catch (error) {
    return fail(res, error.message, error.message === 'Forbidden' ? 403 : 400);
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const data = await groupController.deleteGroup({
      id: req.params.id,
      currentUser: req.user,
    });
    return ok(res, data, 'Delete group success');
  } catch (error) {
    return fail(res, error.message, error.message === 'Forbidden' ? 403 : 400);
  }
});

router.post('/:id/join', auth, async (req, res) => {
  try {
    const data = await groupController.joinGroup({
      id: req.params.id,
      currentUser: req.user,
    });

    const io = getIO();
    io.to(`user_${String(data.owner)}`).emit('notification:new', { groupId: data._id });

    return ok(res, data, 'Join group success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.post('/:id/leave', auth, async (req, res) => {
  try {
    const data = await groupController.leaveGroup({
      id: req.params.id,
      currentUser: req.user,
    });
    return ok(res, data, 'Leave group success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

module.exports = router;
