const express = require('express');
const router = express.Router();

const groupController = require('../controllers/group.controller');

const { verifyAccessToken } = require('../middlewares/auth.middleware.js');

router.post('/create', verifyAccessToken, groupController.createGroup); // Create a new group chat

module.exports = router;
