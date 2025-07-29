const express = require('express');
const { verifyAccessToken } = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');
const {
    handleMulterError,
    uploadAvatar,
} = require('../middlewares/upload.middleware');

const router = express.Router();

router.post(
    '/upload-avatar',
    verifyAccessToken,
    uploadAvatar,
    handleMulterError,
    userController.uploadAvatar
);

router.put('/update-profile', verifyAccessToken, userController.updateProfile);

router.get('/profile', verifyAccessToken, userController.getProfile);

router.get('/search', verifyAccessToken, userController.searchUserByEmail);

router.get('/list-friends', verifyAccessToken, userController.getListFriends);

router.post('/add-friend', verifyAccessToken, userController.addFriend);

router.post(
    '/accept-friend-request',
    verifyAccessToken,
    userController.acceptFriendRequest
);

router.get(
    '/friend-requests',
    verifyAccessToken,
    userController.getFriendRequests
);

router.delete('/unfriend', verifyAccessToken, userController.unFriend);

module.exports = router;
