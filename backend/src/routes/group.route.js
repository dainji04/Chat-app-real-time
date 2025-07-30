const express = require('express');
const router = express.Router();

const groupController = require('../controllers/group.controller');

const { verifyAccessToken } = require('../middlewares/auth.middleware.js');

const {
    handleMulterError,
    uploadSingle,
} = require('../middlewares/upload.middleware.js');

router.post('/create', verifyAccessToken, groupController.createGroup); // Create a new group chat
router.put('/add-members', verifyAccessToken, groupController.addMembers); // Add members to a group
router.put('/remove-members', verifyAccessToken, groupController.removeMembers); // Remove members from a group
router.put(
    '/upload-avatar',
    verifyAccessToken,
    uploadSingle,
    handleMulterError,
    groupController.uploadAvatar
); // Upload group avatar
router.put('/update-info', verifyAccessToken, groupController.updateInfo); // Update group info

module.exports = router;
