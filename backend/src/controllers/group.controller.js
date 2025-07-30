const userModel = require('../models/user.model');
const Conversation = require('../models/conversation.model.js');

class GroupController {
    // /api/groups/create [POST] : create a new group chat
    async createGroup(req, res) {
        try {
            const { name, description, participantIds = [] } = req.body;
            const user = req.user;

            if (!name || !description || !participantIds) {
                return res.status(400).json({
                    message:
                        'Name, description, and participantIds are required.',
                });
            }

            // check if the creator is in the participantIds
            if (!participantIds.includes(user._id.toString())) {
                participantIds.push(user._id.toString());
            }

            // 2 participantIds + creator
            if (!Array.isArray(participantIds) || participantIds.length < 3) {
                return res.status(400).json({
                    message: 'A group must have at least three members.',
                });
            }

            const participants = await userModel.find({
                _id: { $in: participantIds },
            });

            if (participants.length !== participantIds.length) {
                return res.status(404).json({
                    message: 'Some participants not found.',
                });
            }

            const avatarGroup = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                name
            )}&background=random&color=fff&size=256`;

            const newGroup = await Conversation.create({
                participants: participants,
                type: 'group',
                name,
                description,
                avatar: avatarGroup,
                admin: user._id,
            });

            const group = await newGroup.populate([
                {
                    path: 'participants',
                    select: 'username avatar lastSeen isOnline',
                },
                { path: 'admin', select: 'username avatar lastSeen isOnline' },
            ]);

            return res.status(201).json({
                message: 'Group created successfully',
                data: {
                    group: group,
                },
            });
        } catch (error) {
            console.error('Error creating group:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // /api/groups/add-members [PUT] : add arrays of user
    async addMembers(req, res) {
        try {
            const user = req.user;

            const { groupId, participantIds = [] } = req.body;

            if (!groupId || !participantIds) {
                return res.status(400).json({
                    message: 'Group ID and participant IDs are required.',
                });
            }

            // check if the group exists
            const group = await Conversation.findById(groupId);
            if (!group) {
                return res.status(404).json({ message: 'Group not found.' });
            }

            // check if the user is the admin of the group
            if (
                group.admin.toString() !== user._id.toString() ||
                !group.moderators.includes(user._id)
            ) {
                return res.status(403).json({
                    message:
                        'Only the group admin or moderators can add members.',
                });
            }

            if (!Array.isArray(participantIds) || participantIds.length === 0) {
                return res.status(400).json({
                    message: 'Participant IDs must be a non-empty array.',
                });
            }

            // check if the participants exist
            const participants = await userModel.find({
                _id: { $in: participantIds },
            });

            if (participants.length !== participantIds.length) {
                return res.status(404).json({
                    message: 'Some participants not found.',
                });
            }

            // check if the participants are already in the group
            const existingParticipants = group.participants.map((p) =>
                p._id.toString()
            );
            const newParticipants = participants.filter(
                (p) => !existingParticipants.includes(p._id.toString())
            );

            if (newParticipants.length === 0) {
                return res.status(400).json({
                    message: 'All participants are already in the group.',
                });
            }

            group.participants.push(...newParticipants);
            await group.save();

            return res.status(200).json({
                message: 'Members added successfully.',
                data: {
                    group: group,
                },
            });
        } catch (error) {
            console.error('Error adding members to group:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new GroupController();
