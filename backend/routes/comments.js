const express = require('express');
const auth = require('../middlewares/auth');
const commentController = require('../controllers/comment.controller');
const { ok, fail } = require('../utils/response');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const data = await commentController.getComments({ postId: req.query.postId });
    return ok(res, data, 'Get comments success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const data = await commentController.createComment({
      body: req.body,
      currentUser: req.user,
    });
    return ok(res, data, 'Create comment success', 201);
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const data = await commentController.updateComment({
      id: req.params.id,
      body: req.body,
      currentUser: req.user,
    });
    return ok(res, data, 'Update comment success');
  } catch (error) {
    return fail(res, error.message, error.message === 'Forbidden' ? 403 : 400);
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const data = await commentController.deleteComment({
      id: req.params.id,
      currentUser: req.user,
    });
    return ok(res, data, 'Delete comment success');
  } catch (error) {
    return fail(res, error.message, error.message === 'Forbidden' ? 403 : 400);
  }
});

module.exports = router;
