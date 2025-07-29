const User = require('../models/user.model');

class FriendController {
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

    async getFriendRequests(req, res) {
        try {
            const user = req.user;

            res.status(200).json({
                message: 'Friend requests retrieved successfully',
                friendRequests: user.friendRequests.received,
            });
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Server error', error: error.message });
        }
    }

    async unFriend(req, res) {
        try {
            const user = req.user; // middleware should set req.user
            const friendId = req.body.friendId;

            if (!friendId) {
                return res
                    .status(400)
                    .json({ message: 'Friend ID is required' });
            }

            if (!user.friends.toString().includes(friendId)) {
                return res.status(400).json({ message: 'Not friends' });
            }

            user.friends.pull(friendId);
            await user.save();

            const friend = await User.findById(friendId);
            if (friend) {
                friend.friends.pull(user._id);
                await friend.save();
            }

            return res.status(200).json({
                message: 'Unfriended successfully',
            });
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Server error', error: error.message });
        }
    }
}

module.exports = new FriendController();
