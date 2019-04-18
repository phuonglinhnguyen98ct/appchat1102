const router = require('express').Router();

router.get('/', (req, res) => {
    res.render('chat', {
        user: req.user,
    });
});

module.exports = router;