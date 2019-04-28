const router = require('express').Router();
const Group = require('../apps/models/Group');
const User = require('../apps/models/User');

router.get('/', (req, res) => {
    res.render('chat', {
        user: req.user,
    });
});

// router.get('/video-call', (req, res) => {
//     res.render('video-call', {
//         user: req.user
//     })
// });

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

// Edit group's mem
router.post('/edit-group', async (req, res) => {
    let newUserInGroup = req.body.userInGroup;
    newUserInGroup.push(req.user.username);
    let oldUserInGroup;
    let groupCreator;

    await Group.findOne({ _id: req.body.groupId }, (err, group) => {
        if (err) throw err;
        // Get old members
        oldUserInGroup = group.members.slice();
        groupCreator = group.creator;

        // Change group's name
        if (req.body.groupName) {
            group.name = req.body.groupName;
        }

        // Save new members into DB
        group.members = newUserInGroup.slice();
        group.save();
    });

    // Check user is creator
    if (groupCreator === req.user.username) {
        // Delete old groupId when user leave group
        await User.find({
            $and: [
                { username: { $in: oldUserInGroup } },
                { username: { $nin: newUserInGroup } }]
        }, (err, users) => {
            if (err) throw err;
            users.forEach(user => {
                user.groupIds.forEach((groupId, index) => {
                    if (groupId == req.body.groupId) {
                        // Delete groupId
                        user.groupIds.splice(index, 1);
                        user.save();
                    }
                });
            });
        });

        // Insert groupId when user join in group
        await User.find({
            $and: [
                { username: { $in: newUserInGroup } },
                { username: { $nin: oldUserInGroup } }]
        }, (err, users) => {
            if (err) throw err;
            users.forEach(user => {
                user.groupIds.push(req.body.groupId);
                user.save();
            });
        });
    }

    res.redirect('/chat');
});

// Delete group
router.post('/delete-group', async (req, res) => {
    let oldUserInGroup;
    let groupCreator;

    await Group.findOne({ _id: req.body.groupId }, (err, group) => {
        if (err) throw err;
        // Get old members
        oldUserInGroup = group.members.slice();
        groupCreator = group.creator;
    });

    // Check user is creator
    if (groupCreator === req.user.username) {
        // Delete group
        Group.deleteOne({ _id: req.body.groupId }, (err) => {
            if (err) throw err;
        });

        // Delete groupId in User collection
        await User.find({ username: { $in: oldUserInGroup } }, (err, users) => {
            if (err) throw err;
            users.forEach(user => {
                user.groupIds.forEach((groupId, index) => {
                    if (groupId == req.body.groupId) {
                        user.groupIds.splice(index, 1);
                        user.save();
                    }
                });
            });
        });
    }
    res.redirect('/chat');
});

// Leave group
router.post('/leave-group', async (req, res) => {
    // Delete userId in Group collection
    await Group.findOne({ _id: req.body.groupId }, (err, group) => {
        if (err) throw err;
        group.members.forEach((member, index) => {
            if (member == req.user.username) {
                group.members.splice(index, 1);
                group.save();
            }
        });
    });

    // Delete groupId in User collection
    await User.findOne({ _id: req.user._id }, (err, user) => {
        if (err) throw err;
        user.groupIds.forEach((groupId, index) => {
            if (groupId == req.body.groupId) {
                user.groupIds.splice(index, 1);
                user.save();
            }
        })
    });

    res.redirect('/chat');
});

// router.post('/delete-all-groupId-in-user-model', (req, res) => {
//     User.find({}, (err, users) => {
//         if (err) throw err;
//         let arr = [];
//         users.forEach(user => {
//             user.groupIds = arr;
//             user.save();
//         });
//     });
//     console.log("deleted all groupId in users model");
//     res.redirect('/chat');
// });

module.exports = router;