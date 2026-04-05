const express = require('express');
const authRouter = require('./auth');
const usersRouter = require('./users');
const rolesRouter = require('./roles');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/roles', rolesRouter);
router.use('/posts', postsRouter);
router.use('/comments', commentsRouter);
router.use('/groups', groupsRouter);
router.use('/follows', followsRouter);
router.use('/messages', messagesRouter);
router.use('/uploads', uploadsRouter);
router.use('/notifications', notificationsRouter);

module.exports = router;
