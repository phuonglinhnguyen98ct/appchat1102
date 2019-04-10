const router = require('express').Router();
const { ensureAuthenticated } = require('../config/authenticated');
const Grid = require('gridfs-stream');
const mongoose = require('mongoose');
const GridFsStorage = require('multer-gridfs-storage');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

// Connect to MongoDB
const mongoURI = 'mongodb://localhost:27017/nienluancoso';

mongoose.connect(mongoURI, { useNewUrlParser: true }, (err) => {
    if (err) throw err;
});

const conn = mongoose.connection;

// Create storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });

let gfs;
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});


router.get('/', (req, res) => {
    gfs.files.findOne({ filename: req.user.avatar }, (err, file) => {
        if (err) throw err;
        res.render('chat', {
            user: req.user,
            file: file
        });
    });
});

// router.post('/', upload.single('file'), (req, res) => {
//     console.log("Tin nhan la: " + req.message);
//     if (req.file) {
//         console.log(req.file);
//     }
//     res.redirect('/chat');
// });

module.exports = router;