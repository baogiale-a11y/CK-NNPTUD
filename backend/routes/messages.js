const express = require('express');
const auth = require('../middlewares/auth');
const messageController = require('../controllers/message.controller');
const { getIO } = require('../utils/socket');
const { ok, fail } = require('../utils/response');

const router = express.Router();

router.get('/:userId', auth, async (req, res) => {
  try {
    const data = await messageController.getConversation({
      userId: req.params.userId,
      currentUser: req.user,
    });
    return ok(res, data, 'Get conversation success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const data = await messageController.sendMessage({
      body: req.body,
      currentUser: req.user,
    });

    const io = getIO();
    io.to(`user_${String(data.receiver._id)}`).emit('message:receive', data);

    return ok(res, data, 'Send message success', 201);
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    const data = await messageController.markAsRead({
      id: req.params.id,
      currentUser: req.user,
    });
    return ok(res, data, 'Mark as read success');
  } catch (error) {
    return fail(res, error.message, error.message === 'Forbidden' ? 403 : 400);
  }
});

module.exports = router;
