const router = require('express').Router();
const User = require('../apps/models/User');
const brcypt = require('bcryptjs');

// Handle GET request
router.get('/', (req, res) => {
    res.render('change-profile', {
        user: req.user
    });
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
            res.render('change-profile', {
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
                                res.redirect('/profile');
                            });
                        }
                    });
                })
            );
        }
    });
});

module.exports = router;