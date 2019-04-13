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
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const path = require('path');

// EJS
//app.use(expressLayouts);
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(methodOverride('_method'));

// Bodyparser
app.use(express.urlencoded({ extended: false }));
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
const mongoURI = 'mongodb://localhost:27017/nienluancoso';

mongoose.connect(mongoURI, { useNewUrlParser: true }, (err) => {
    if (err) throw err;
    console.log('MongoDB Connected');
});

const conn = mongoose.connection;

// Init gfs
let gfs;
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

// Get image from mongoDB
app.get('/image/:filename', (req, res) => {
    gfs.files.findOne({filename: req.params.filename}, (err, file) => {
        if (err) throw err;
        const readStream = gfs.createReadStream(file.filename);
        readStream.pipe(res);
    });
});

// SocketIO
require('./socket')(io);


// Router
app.use(router);




