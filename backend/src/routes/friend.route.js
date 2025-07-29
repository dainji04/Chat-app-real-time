const express = require('express');
const router = express.Router();

const { verifyAccessToken } = require('../middlewares/auth.middleware.js');

const friendController = require('../controllers/friend.controller');

router.get('/list', verifyAccessToken, friendController.getListFriends);

router.post('/add', verifyAccessToken, friendController.addFriend);

router.post(
    '/accept-request',
    verifyAccessToken,
    friendController.acceptFriendRequest
);

router.get(
    '/list-requests',
    verifyAccessToken,
    friendController.getFriendRequests
);

router.delete('/unfriend', verifyAccessToken, friendController.unFriend);

module.exports = router;
