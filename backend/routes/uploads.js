const express = require('express');
const auth = require('../middlewares/auth');
const uploadController = require('../controllers/upload.controller');
const uploadMulter = require('../utils/upload.multer');
const { ok, fail } = require('../utils/response');

const router = express.Router();

router.post('/', auth, uploadMulter.single('file'), async (req, res) => {
  try {
    const data = await uploadController.createUpload({
      file: req.file,
      currentUser: req.user,
      body: req.body,
    });
    return ok(res, data, 'Upload success', 201);
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const data = await uploadController.getUploads({ currentUser: req.user });
    return ok(res, data, 'Get uploads success');
  } catch (error) {
    return fail(res, error.message, 400);
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const data = await uploadController.deleteUpload({
      id: req.params.id,
      currentUser: req.user,
    });
    return ok(res, data, 'Delete upload success');
  } catch (error) {
    return fail(res, error.message, error.message === 'Forbidden' ? 403 : 400);
  }
});

module.exports = router;
