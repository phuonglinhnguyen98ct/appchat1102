const router = require('express').Router();
const Group = require('../apps/models/Group');
const User = require('../apps/models/User');

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

router.post('/add-group', async (req, res) => {
    let userInGroup = req.body.userInGroup;
    userInGroup.push(req.user.username);

    let now = new Date();
    let dd = String(now.getDate()).padStart(2, '0');
    let MM = String(now.getMonth() + 1).padStart(2, '0');
    let yyyy = now.getFullYear();
    let HH = String(now.getHours()).padStart(2, '0');
    let mm = String(now.getMinutes()).padStart(2, '0');
    // Get date time
    let datetime = HH + ":" + mm + " " + dd + '/' + MM + '/' + yyyy;

    await Group.create({
        name: req.body.groupName,
        creator: req.user.username,
        datetime: datetime,
        members: req.body.userInGroup
    });

    // Get lastest user's groupId 
    let groupId;
    await Group.findOne({ creator: req.user.username }, (err, group) => {
        groupId = group._id;
    }).sort({ _id: -1 });

    // Save user's groupIds
    User.find({ username: { $in: userInGroup } }, (err, users) => {
        users.forEach(user => {
            user.groupIds.push(groupId);
            user.save();
        });
    });



    res.redirect('/chat');
});

module.exports = router;