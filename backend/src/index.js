const express = require('express');
const env = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const socket = require('socket.io');
const http = require('http');

const route = require('./routes/index');
const connectDB = require('./config/db/index.js');
const { specs, swaggerUi } = require('./config/swagger');
const handleSocket = require('./socket/socket.js');

env.config();

const app = express();
const server = http.createServer(app);
const io = socket(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:4200',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

connectDB();

app.use(cookieParser());
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

route(app);

handleSocket(io);

server.listen(process.env.PORT || 3000, () => {
    console.log(
        `Server is running on port http://localhost:${process.env.PORT || 3000}`
    );
});
