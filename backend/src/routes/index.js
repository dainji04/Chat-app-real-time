const auth = require('./auth.route.js');

function route(app) {
    app.use('/api/auth', auth);

    app.get('/', (req, res) => {
        res.send('Hello World from routes!');
    });
}

module.exports = route;
