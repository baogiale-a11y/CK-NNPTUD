const express = require('express');
const authRouter = require('./auth');
const usersRouter = require('./users');
const rolesRouter = require('./roles');

const router = express.Router();

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/roles', rolesRouter);

module.exports = router;
