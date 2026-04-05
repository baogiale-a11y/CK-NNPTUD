const express = require('express');
const auth = require('../middlewares/auth');
const notificationController = require('../controllers/notification');
const { ok, fail } = require('../utils/response');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const data = await notificationController.getNotifications({ currentUser: req.user });
    return ok(res, data, 'Get notifications success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    const data = await notificationController.markRead({
      id: req.params.id,
      currentUser: req.user,
    });
    return ok(res, data, 'Mark notification as read success');
  } catch (error) {
    return fail(res, error.message, error.message === 'Forbidden' ? 403 : 400);
  }
});

router.put('/read-all', auth, async (req, res) => {
  try {
    const data = await notificationController.markReadAll({ currentUser: req.user });
    return ok(res, data, 'Mark all notifications as read success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const data = await notificationController.deleteNotification({
      id: req.params.id,
      currentUser: req.user,
    });
    return ok(res, data, 'Delete notification success');
  } catch (error) {
    return fail(res, error.message, error.message === 'Forbidden' ? 403 : 400);
  }
});

module.exports = router;
