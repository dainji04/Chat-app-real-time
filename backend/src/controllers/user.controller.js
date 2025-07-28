const cloudinary = require('../utils/cloudinary.js');
const User = require('../models/user.model.js');

class UserController {
    async uploadAvatar(req, res) {
        try {
            const user = req.user; // middleware should set req.user

            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            if (user.avatar) {
                if (user.avatar.includes('cloudinary')) {
                    const publicId = user.avatar.split('/').pop().split('.')[0];
                    await cloudinary.deleteFromCloudinary(
                        'chat-app/avatars/' + publicId
                    );
                }
            }

            const uploadResult = await cloudinary.uploadToCloudinary(
                req.file,
                'chat-app/avatars'
            );

            if (!uploadResult || !uploadResult.secure_url) {
                return res
                    .status(500)
                    .json({ message: 'Failed to upload avatar' });
            }

            user.avatar = uploadResult.secure_url;

            await user.save();

            return res.status(200).json({
                message: 'Avatar uploaded successfully',
                avatarUrl: user.avatar,
            });
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Server error', error: error.message });
        }
    }

    async updateProfile(req, res) {
        try {
            const user = req.user; // middleware should set req.user
            const {
                firstName,
                lastName,
                username,
                email,
                bio,
                phone,
                dateOfBirth,
            } = req.body;

            const updated = {};

            if (firstName) updated.firstName = firstName.trim();
            if (lastName) updated.lastName = lastName.trim();
            if (username) updated.username = username.trim();
            if (email) updated.email = email.trim();
            if (bio) updated.bio = bio.trim();
            if (phone) updated.phone = phone.trim();
            if (dateOfBirth) {
                const dateDiff = new Date() - new Date(dateOfBirth);
                if (dateDiff < 0) {
                    return res.status(400).json({
                        message: 'Date of birth cannot be in the future',
                    });
                }
                if (dateDiff < 568025136000) {
                    // 18 years in milliseconds
                    return res.status(400).json({
                        message: 'You must be at least 18 years old',
                    });
                }
            }

            const newUser = await User.findByIdAndUpdate(
                user._id,
                { $set: updated },
                { new: true, runValidators: true }
            );

            if (!newUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            return res.status(200).json({
                message: 'Profile updated successfully',
                user: newUser,
            });
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Server error', error: error.message });
        }
    }

    async getProfile(req, res) {
        try {
            const user = req.user; // middleware should set req.user

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            return res.status(200).json({
                message: 'Profile retrieved successfully',
                user,
            });
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Server error', error: error.message });
        }
    }

    async searchUserByEmail(req, res) {
        try {
            const email = req.query.email;
            if (!email) {
                return res.status(400).json({ message: 'Email is required' });
            }

            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            return res.status(200).json({
                message: 'User retrieved successfully',
                user,
            });
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Server error', error: error.message });
        }
    }

    async getListFriends(req, res) {
        try {
            const user = req.user; // middleware should set req.user

            const friends = await User.find({ _id: { $in: user.friends } });

            return res.status(200).json({
                message: 'Friends retrieved successfully',
                friends,
            });
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Server error', error: error.message });
        }
    }

    async addFriend(req, res) {
        try {
            const user = req.user; // middleware should set req.user
            const friendId = req.body.friendId;

            if (!friendId) {
                return res
                    .status(400)
                    .json({ message: 'Friend ID is required' });
            }

            const friend = await User.findById(friendId);
            if (friendId === user._id.toString()) {
                return res.status(400).json({
                    message: 'Cannot send friend request to yourself',
                });
            }
            if (!friend) {
                return res.status(404).json({ message: 'Friend not found' });
            }

            if (user.friends.toString().includes(friendId)) {
                return res.status(400).json({ message: 'Already friends' });
            }

            user.friendRequests.sent.push(friendId);

            friend.friendRequests.received.push(user._id);
            await friend.save();
            await user.save();

            return res.status(200).json({
                message: 'send friend request successfully',
            });
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Server error', error: error.message });
        }
    }

    async acceptFriendRequest(req, res) {
        try {
            const user = req.user; // middleware should set req.user
            const friendId = req.body.friendId;

            if (!friendId) {
                return res
                    .status(400)
                    .json({ message: 'Friend ID is required' });
            }

            if (!user.friendRequests.received.toString().includes(friendId)) {
                return res
                    .status(400)
                    .json({ message: 'No friend request found' });
            }

            user.friends.push(friendId);
            user.friendRequests.received.pull(friendId);

            const friend = await User.findById(friendId);
            if (!friend) {
                return res.status(404).json({ message: 'Friend not found' });
            }
            friend.friends.push(user._id);
            friend.friendRequests.sent.pull(user._id);

            await friend.save();
            await user.save();

            return res.status(200).json({
                message: 'Friend request accepted successfully',
            });
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Server error', error: error.message });
        }
    }
}

module.exports = new UserController();
