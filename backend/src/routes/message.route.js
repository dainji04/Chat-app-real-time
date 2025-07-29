const express = require('express');
const router = express.Router();

const messageController = require('../controllers/message.controller.js');

const { verifyAccessToken } = require('../middlewares/auth.middleware.js');
const {
    uploadSingle,
    handleMulterError,
} = require('../middlewares/upload.middleware.js');

router.get('/', verifyAccessToken, messageController.getAllConversations);

router.get(
    '/conversations/:conversationId',
    verifyAccessToken,
    messageController.getConversationById
);

router.post(
    '/conversations',
    verifyAccessToken,
    messageController.getOrCreateConversation
);

router.post(
    '/upload',
    verifyAccessToken,
    uploadSingle,
    handleMulterError,
    messageController.uploadMedia
);

router.post('/send-message', verifyAccessToken, messageController.sendMessage);

module.exports = router;
