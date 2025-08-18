const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js');
const Conversation = require('../models/conversation.model.js');
const Message = require('../models/message.model.js');

const firebase = require('../utils/firebase.js');

const authenSocket = async (socket, next) => {
    try {
        const token =
            socket.handshake.auth.token ||
            socket.handshake.headers.authorization?.split(' ')[1];

        console.log('🔑 Token received:', token ? 'Found' : 'Not found');

        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        console.log('👤 User found:', user ? user.username : 'None');

        if (!user) {
            return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
    } catch (error) {
        console.log('❌ Socket authentication error:', error.message);
        next(new Error('Authentication error'));
    }
};

const onlineUsers = new Map();

const socketHandler = (io) => {
    io.use(authenSocket);

    io.on('connection', async (socket) => {
        console.log(
            `✅ Client socket: ${socket.user.username} connected with socket id: ${socket.id}`
        );

        onlineUsers.set(socket.userId, socket.id);

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

        // update status message to delivered if its not readed
        const messages = await Message.find({
            conversation: { $in: conversations.map((c) => c._id) },
            status: 'sent',
        });

        messages.forEach((message) => {
            message.status = 'delivered';
            message.save();
        });

        // Handle joining a conversation
        socket.on('join_conversation', (conversationId) => {
            console.log(
                `User ${socket.user.username} joined conversation: ${conversationId}`
            );
            socket.join(conversationId);
        });

        // Handle leaving a conversation
        socket.on('leave_conversation', (conversationId) => {
            console.log(
                `User ${socket.user.username} left conversation: ${conversationId}`
            );
            socket.leave(conversationId);
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

                let receiveUserId;
                // Update status messages if receiver is online
                if (conversation.participants.length > 1) {
                    receiveUserId = conversation.participants
                        .find((p) => p._id.toString() !== socket.userId)
                        .toString();

                    if (onlineUsers.has(receiveUserId.toString())) {
                        messageData.status = 'delivered';
                    }
                }

                const message = await Message.create(messageData);

                // Populate message data với lean() để tăng performance
                const populateMessage = await Message.findById(message._id)
                    .populate('sender', 'username firstName lastName avatar')
                    .populate('replyTo', 'content sender')
                    .populate('reactions.user', 'username firstName lastName')
                    .lean();

                console.log(
                    `📩 Message sent by ${socket.user.username} in conversation ${conversationId}`
                );

                // Update conversation last message and activity status after emitting
                conversation.lastMessage = message._id;
                conversation.lastActivity = new Date();

                await conversation.save();
                
                // Emit message to all participants before updating conversation
                io.to(conversationId).emit('receive_message', {
                    message: populateMessage,
                    conversationId: conversationId,
                });

                console.log(
                    `📩 Message delivered to online user: ${receiveUserId}`
                );

                const populateConversation = await Conversation.findById(
                    conversationId
                )
                    .populate(
                        'participants',
                        'username firstName lastName avatar isInConversation FCMtoken'
                    )
                    .lean();

                for (const participant of populateConversation.participants) {
                    if (participant._id.toString() !== socket.userId && !participant.isInConversation && participant.FCMtoken) {
                        await firebase.sendPushNotification({
                            userId: participant._id.toString(),
                            title: 'Tin nhắn mới',
                            body: message.content.text,
                            conversationId,
                            token: participant.FCMtoken,
                        });
                    }
                }
            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('disconnect', async () => {
            console.log(
                `❌ Client ${socket.user?.username || 'Unknown'} disconnected:`,
                socket.id
            );

            if (socket.userId) {
                await User.findByIdAndUpdate(
                    socket.userId,
                    { $set: { isOnline: false } },
                    { new: true }
                );

                // Leave all conversations
                const conversations = await Conversation.find({
                    participants: socket.userId,
                    isActive: true,
                });
                conversations.forEach((conversation) => {
                    socket.leave(conversation._id.toString());
                });
                console.log(
                    `User ${
                        socket.user?.username || 'Unknown'
                    } left all conversations on disconnect`
                );
            }
        });
    });
};

module.exports = socketHandler;
