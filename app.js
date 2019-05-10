const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const router = require('./routes/index');
const flash = require('connect-flash');
const session = require('express-session');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const passport = require('passport');
const methodOverride = require('method-override');

// EJS
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(methodOverride('_method'));

// Bodyparser
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Express Session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Passport config
require('./config/passport')(passport);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global vars
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.success_login_msg = req.flash('success_login_msg');
    next();
});

// Starting server 
server.listen(3000, () => {
    console.log("Server started...");
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/nienluancoso', {useNewUrlParser: true}, (err) => {
    if (err) throw err;
    console.log('MongoDB connected...');
});

// SocketIO
require('./socket')(io);


// Router
app.use(router);




