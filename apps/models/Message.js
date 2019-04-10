const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: String,
    receiver: String,
    message: String,
    file: String,
    datetime: String
});

const Message = mongoose.model('message', messageSchema);

module.exports = Message;
