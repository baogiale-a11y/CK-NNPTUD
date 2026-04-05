const express = require('express');
const auth = require('../middlewares/auth');
const followController = require('../controllers/follow');
const { getIO } = require('../utils/socket');
const { ok, fail } = require('../utils/response');

const router = express.Router();

router.post('/:userId', auth, async (req, res) => {
  try {
    const data = await followController.followUser({
      userId: req.params.userId,
      currentUser: req.user,
    });

    const io = getIO();
    io.to(`user_${req.params.userId}`).emit('follow:new', {
      followerId: req.user._id,
    });

    return ok(res, data, 'Follow success', 201);
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.delete('/:userId', auth, async (req, res) => {
  try {
    const data = await followController.unfollowUser({
      userId: req.params.userId,
      currentUser: req.user,
    });
    return ok(res, data, 'Unfollow success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.get('/:userId/followers', async (req, res) => {
  try {
    const data = await followController.getFollowers({ userId: req.params.userId });
    return ok(res, data, 'Get followers success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.get('/:userId/following', async (req, res) => {
  try {
    const data = await followController.getFollowing({ userId: req.params.userId });
    return ok(res, data, 'Get following success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

module.exports = router;
