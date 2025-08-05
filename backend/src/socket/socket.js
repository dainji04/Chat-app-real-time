const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js');
const Conversation = require('../models/conversation.model.js');
const Message = require('../models/message.model.js');

const authenSocket = async (socket, next) => {
    try {
        const token =
            socket.handshake.auth.token ||
            socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
    } catch (error) {
        console.log('Socket authentication error:', error);
        next(new Error('Authentication error'));
    }
};

const socketHandler = (io) => {
    io.use(authenSocket);

    io.on('connection', async (socket) => {
        console.log(
            `✅ Client socket: ${socket.user.username} connected with socket id: ${socket.id}`
        );

        await User.findByIdAndUpdate(
            socket.userId,
            { $set: { isOnline: true } },
            { new: true }
        );

        // Get user's conversations and join those rooms
        const conversations = await Conversation.find({
            participants: socket.userId,
            isActive: true,
        });

        conversations.forEach((conversation) => {
            socket.join(conversation._id.toString());
        });

        // Handle joining a conversation
        socket.on('join_conversation', (conversationId) => {
            socket.join(conversationId);
            console.log(
                `User ${socket.user.username} joined conversation: ${conversationId}`
            );
        });

        // Handle leaving a conversation
        socket.on('leave_conversation', (conversationId) => {
            socket.leave(conversationId);
            console.log(
                `User ${socket.user.username} left conversation: ${conversationId}`
            );
        });

        // Handle sending messages
        socket.on('send_message', async (data) => {
            try {
                const {
                    conversationId,
                    content,
                    type = 'text',
                    replyTo,
                    media,
                } = data;

                if (!conversationId) {
                    socket.emit('error', {
                        message: 'Conversation ID is required',
                    });
                    return;
                }

                if (!content || content.trim().length === 0) {
                    socket.emit('error', {
                        message: 'Message content cannot be empty',
                    });
                    return;
                }

                if (content.length > 2000) {
                    socket.emit('error', {
                        message:
                            'Message content exceeds maximum length of 2000 characters',
                    });
                    return;
                }

                // Validate conversation access
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: socket.userId,
                    isActive: true,
                });

                if (!conversation) {
                    socket.emit('error', { message: 'Conversation not found' });
                    return;
                }

                // Create message
                const messageData = {
                    conversation: conversationId,
                    sender: socket.userId,
                    content: {
                        text: content.trim(),
                        type,
                    },
                };

                if (media && type !== 'text') {
                    messageData.content.media = media;
                }

                if (replyTo) {
                    messageData.replyTo = replyTo;
                }

                const message = await Message.create(messageData);
                console.log(message);

                // Populate message data với lean() để tăng performance
                const populateMessage = await Message.findById(message._id)
                    .populate('sender', 'username firstName lastName avatar')
                    .populate('replyTo', 'content sender')
                    .populate('reactions.user', 'username firstName lastName')
                    .lean();

                console.log(
                    `📩 Message sent by ${socket.user.username} in conversation ${conversationId}`
                );

                // Emit message to all participants TRƯỚC khi update conversation
                io.to(conversationId).emit('receive_message', {
                    message: populateMessage,
                    conversationId: conversationId,
                });

                // Update conversation last message and activity SAU khi đã emit
                conversation.lastMessage = message._id;
                conversation.lastActivity = new Date();
                await conversation.save();

                // Send push notification to offline users (if implemented)
                // await sendPushNotification(conversation, message);
            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('disconnect', async () => {
            await User.findByIdAndUpdate(
                socket.userId,
                { $set: { isOnline: false } },
                { new: true }
            );
            console.log(
                `❌ Client ${socket.user.username} disconnected:`,
                socket.id
            );
        });
    });
};

module.exports = socketHandler;
