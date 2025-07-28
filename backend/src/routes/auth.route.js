const express = require('express');
const authController = require('../controllers/auth.controller.js');
const {
    verifyAccessToken,
    verifyRefreshToken,
} = require('../middlewares/auth.middleware.js');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', verifyRefreshToken, authController.logout);
router.post('/refresh-token', verifyRefreshToken, authController.refreshToken);
router.post(
    '/change-password',
    verifyAccessToken,
    authController.changePassword
);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-password', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);
router.get('/me', verifyAccessToken, authController.getMe);

module.exports = router;
