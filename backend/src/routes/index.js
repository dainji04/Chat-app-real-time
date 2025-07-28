const auth = require('./auth.route.js');
const user = require('./user.route.js');

function route(app) {
    app.use('/api/auth', auth);

    app.use('/api/user', user);

    app.get('/', (req, res) => {
        res.send('Hello World from routes!');
    });
}

module.exports = route;
