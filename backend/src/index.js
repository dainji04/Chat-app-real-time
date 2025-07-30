const express = require('express');
const env = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const route = require('./routes/index');
const connectDB = require('./config/db/index.js');
const { specs, swaggerUi } = require('./config/swagger');

env.config();

const app = express();

app.use(cookieParser());

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

route(app);

app.listen(process.env.PORT || 3000, () => {
    console.log(
        `Server is running on port http://localhost:${process.env.PORT || 3000}`
    );
});
