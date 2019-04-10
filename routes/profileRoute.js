const router = require('express').Router();
const User = require('../apps/models/User');
const brcypt = require('bcryptjs');
const Grid = require('gridfs-stream');
const GridFsStorage = require('multer-gridfs-storage');
const mongoose = require('mongoose');
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

// Handle GET request
router.get('/change-password', (req, res) => {
    res.render('change-password', {
        user: req.user
    });
});

router.get('/change-avatar', (req, res) => {
    gfs.files.findOne({ filename: req.user.avatar }, (err, file) => {
        if (err) throw err;
        res.render('change-avatar', {
            user: req.user,
            file: file
        });
    });
});

// Handle POST request from change-avatar
router.post('/change-avatar', upload.single('file'), (req, res) => {
    if (req.file) {
        User.findOne({ _id: req.user.id }, (err, foundObject) => {
            if (err) throw err;
            if (foundObject) {
                // Delete old avatar
                if (req.user.avatar !== null) {
                    gfs.remove({ filename: req.user.avatar, root: 'uploads' });
                }

                // Save new avatar
                foundObject.avatar = req.file.filename;
                foundObject.save((err) => {
                    if (err) throw err;
                    req.flash('success_msg', 'Your avatar has been changed!');
                    res.redirect('/profile/change-avatar');
                });
            }
        });
    }
    else {
        console.log("Unhandled file");
    }
});

// Handle POST request from change-password
router.post('/change-password', (req, res) => {

    let errors = [];

    const changePassword = {
        oldPassword: req.body.oldPassword,
        newPassword: req.body.newPassword,
        newPassword2: req.body.newPassword2
    };

    // Check old password validation
    brcypt.compare(changePassword.oldPassword, req.user.password, (err, isMatch) => {
        if (err) throw err;
        if (isMatch) {

            // Check password length
            if (changePassword.newPassword.length < 6) {
                errors.push({ msg: "Password should be at least 6 characters" });
            }

            // Check new password match
            if (changePassword.newPassword !== changePassword.newPassword2) {
                errors.push({ msg: "Passwords do not match" });
            }

            // Check new password different from old password
            if (changePassword.newPassword === changePassword.oldPassword) {
                errors.push({ msg: "New password must be different from previous password" });
            }

        }
        else {
            errors.push({ msg: "Old password incorrect" });
        }

        // Errors alert
        if (errors.length > 0) {
            res.render('change-password', {
                errors,
                user: req.user,
                oldPassword: changePassword.oldPassword,
                newPassword: changePassword.newPassword,
                newPassword2: changePassword.newPassword2,
            });
        }
        else {
            // Update password

            // Hash Password
            brcypt.genSalt(10, (err, salt) =>
                brcypt.hash(changePassword.newPassword, salt, (err, hash) => {
                    if (err) throw err;
                    User.findOne({ _id: req.user.id }, (err, foundObject) => {
                        if (err) throw err;
                        if (foundObject) {
                            foundObject.password = hash;
                            foundObject.save((err) => {
                                if (err) throw err;
                                req.flash('success_msg', 'Your password has been changed!');
                                res.redirect('/profile/change-password');
                            });
                        }
                    });
                })
            );
        }
    });
});

module.exports = router;