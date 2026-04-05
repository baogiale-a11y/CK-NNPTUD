const express = require('express');
const auth = require('../middlewares/auth');
const postController = require('../controllers/post.controller');
const { ok, fail } = require('../utils/response');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const data = await postController.getPosts({ query: req.query });
    return ok(res, data, 'Get posts success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const data = await postController.getPostById({ id: req.params.id });
    return ok(res, data, 'Get post success');
  } catch (error) {
    return fail(res, error.message, 404);
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const data = await postController.createPost({
      body: req.body,
      currentUser: req.user,
    });
    return ok(res, data, 'Create post success', 201);
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const data = await postController.updatePost({
      id: req.params.id,
      body: req.body,
      currentUser: req.user,
    });
    return ok(res, data, 'Update post success');
  } catch (error) {
    return fail(res, error.message, error.message === 'Forbidden' ? 403 : 400);
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const data = await postController.deletePost({
      id: req.params.id,
      currentUser: req.user,
    });
    return ok(res, data, 'Delete post success');
  } catch (error) {
    return fail(res, error.message, error.message === 'Forbidden' ? 403 : 400);
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const data = await postController.likePost({
      id: req.params.id,
      currentUser: req.user,
    });
    return ok(res, data, 'Like/Unlike post success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

module.exports = router;
