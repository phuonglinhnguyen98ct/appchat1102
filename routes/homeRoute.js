const router = require('express').Router();
const User = require('../apps/models/User');
const brcypt = require('bcryptjs');
const passport = require('passport');

router.get('/', (req, res) => {
    res.render('home');
});

router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_login_msg', 'You are logged out');
    res.redirect('/');
});

// Log In handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/chat',
        failureRedirect: '/',
        failureFlash: true
    })(req, res, next);
});

// Sign Up handle
router.post('/signup', (req, res) => {
    let errors = [];

    const userSignup = {
        fullname: req.body.fullnameSignup,
        username: req.body.usernameSignup,
        password: req.body.passwordSignup,
        password2: req.body.passwordSignup2
    };
    
    // Check usernameSignup existed
    User.findOne({ username: userSignup.username }, (err, user) => {
        if (err) throw err;
        if (user) {
            errors.push({ msg: "Username already exists" });
        }
        else {
            // Check required fields
            if (!userSignup.fullname || !userSignup.username || !userSignup.password || !userSignup.password2) {
                errors.push({ msg: "Please fill in all fields" });
            }

            // Check password length
            if (userSignup.password.length < 6 && userSignup.password.length > 0) {
                errors.push({ msg: "Password should be at least 6 characters" });
            }

            // Check password match
            if ((userSignup.password !== userSignup.password2) && userSignup.password2.length > 0) {
                errors.push({ msg: "Passwords do not match" });
            }
        }

        // Errors alert
        if (errors.length > 0) {
            const { fullname, username, password, password2 } = userSignup;
            res.render('home', {
                errors,
                fullname,
                username,
                password,
                password2
            });
        }
        else {
            // Add user
            const newUser = new User(userSignup);

            // Hash Password
            brcypt.genSalt(10, (err, salt) =>
                brcypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    newUser.save()
                        .then((user) => {
                            req.flash('success_msg', 'You are now register and can log in');
                            res.redirect('/');
                        })
                        .catch(err => console.log(err));
                })
            );
        }
    });
});

module.exports = router;