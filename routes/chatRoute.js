const router = require('express').Router();

router.get('/', (req, res) => {
    res.render('chat', {
        user: req.user,
    });
});

router.get('/video-call', (req, res) => {
    res.render('video-call', {
        user: req.user
    })
});

router.post('/add-group', (req, res) => {
    let userInGroup = req.body.userInGroup;
    if (userInGroup) {
        userInGroup.forEach(user => {
            console.log(user);
        });
    }
    res.redirect('/chat');
});

module.exports = router;