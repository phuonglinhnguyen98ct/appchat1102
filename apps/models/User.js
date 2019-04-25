const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    fullname: String,
    avatar: String, 
    groupIds: Array
});

const User = mongoose.model('user', userSchema);

module.exports = User;