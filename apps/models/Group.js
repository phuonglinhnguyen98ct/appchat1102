const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: String,
    creator: String,
    members: Array,
    datetime: String,
});

const Group = mongoose.model('group', groupSchema);

module.exports = Group;
