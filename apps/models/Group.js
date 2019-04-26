const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: String,
    creator: String,
    members: [String],
    datetime: String,
});

const Group = mongoose.model('group', groupSchema);

module.exports = Group;
