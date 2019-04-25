const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: String,
    receiver: String,
    receivedGroupId: String,
    message: String,
    file: String,
    datetime: String,
    seen: Boolean
});

const Message = mongoose.model('message', messageSchema);

module.exports = Message;
