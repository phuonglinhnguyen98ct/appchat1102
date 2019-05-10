const User = require('./apps/models/User');
const Message = require('./apps/models/Message');
const Group = require('./apps/models/Group');

function socket(io) {
    const users = [];

    io.on('connection', socket => {

        // Send online users list to client
        function sendOnlineUsers() {
            io.sockets.emit('server-send-online-users', users);
        }

        // Receive client's username
        socket.on('client-send-username', username => {

            console.log(username + " connected");

            // Load user list from DB
            let usersDB = [];
            User.find({}, (err, users) => {
                if (err) throw err;
                users.forEach(user => {
                    usersDB.push({ username: user.username, fullname: user.fullname, avatar: user.avatar });
                });

                // Send to client usersDB
                socket.emit('send-users-db', usersDB);
                // Send online users list to client
                sendOnlineUsers();

                // Send waitting messsage's username
                Message.find({ receiver: socket.username, seen: false }, (err, messageArr) => {
                    if (err) throw err;
                    let wattingMessagUsername = [];
                    messageArr.forEach(message => {
                        wattingMessagUsername.push(message.sender);
                    });
                    socket.emit('server-send-watting-message-username', wattingMessagUsername);
                });
            });

            // Load client's groups from DB
            User.findOne({ username: username }, (err, user) => {
                if (err) throw err;
                if (user.groupIds) {
                    Group.find({ _id: { $in: user.groupIds } }, (err, groups) => {
                        if (err) throw err;
                        // Send client's groups to client
                        socket.emit('sever-send-chat-groups', groups);
                    });

                    // Add user to room socketIO
                    user.groupIds.forEach(groupId => {
                        socket.join(groupId);
                    });
                }
            });


            // Storage client's username to socket
            socket.username = username;

            // Check user existed
            let check = false;
            for (let i = 0, n = users.length; i < n; i++) {
                if (users[i].username === username) {
                    users[i].socketId.push(socket.id);
                    check = true;
                    break;
                }
            }
            if (!check) {
                users.push({ username: username, socketId: [socket.id] });
            }
        });

        // User is typing 
        socket.on('client-typing', data => {
            users.forEach(user => {
                if (user.username === data) {
                    user.socketId.forEach(id => {
                        io.to(id).emit('your-friend-is-typing', socket.username);
                    });
                }
            });
        });

        // Handle stop typing status from client
        socket.on('client-stop-typing', data => {
            users.forEach(user => {
                if (user.username === data) {
                    user.socketId.forEach(id => {
                        io.to(id).emit('your-friend-stop-typing', socket.username);
                    });
                }
            });
        });

        // Send seen status to user's friend - receiver is seen user  
        function userSeenMessage(sender, receiver) {
            users.forEach(user => {
                if (user.username === sender) {
                    user.socketId.forEach(id => {
                        io.to(id).emit('your-friend-has-seen-your-message', receiver);
                    });
                }
            });
        }

        // Get datetime string
        function dateToString(date) {
            let dd = String(date.getDate()).padStart(2, '0');
            let MM = String(date.getMonth() + 1).padStart(2, '0');
            let yyyy = date.getFullYear();
            let HH = String(date.getHours()).padStart(2, '0');
            let mm = String(date.getMinutes()).padStart(2, '0');
            let datetime = HH + ":" + mm + " " + dd + '/' + MM + '/' + yyyy;

            return datetime;
        }

        // User have seen message
        socket.on('client-send-seen-message-status', data => {
            userSeenMessage(data.sender, data.receiver);
        });

        // User send message to a friend
        socket.on('client-send-message', data => {
            // Get sent time
            let datetime = new Date();
            let datetimeString = dateToString(datetime);

            users.forEach(user => {
                if (user.username === data.receiver) {
                    // Sending to receiver
                    user.socketId.forEach(id => {
                        io.to(id).emit('client-receive-message', { sender: socket.username, message: data.message, datetime: datetimeString });
                    });
                }
                // Send to other user's socketId 
                if (user.username === socket.username) {
                    user.socketId.forEach(id => {
                        if (id !== socket.id) {
                            io.to(id).emit('client-receive-message-from-their-socketids', { message: data.message, datetime: datetimeString });
                        }
                    });
                }
            });

            // Saving to MongoDB
            Message.create({
                sender: socket.username,
                receiver: data.receiver,
                message: data.message,
                datetime: datetime,
                seen: false
            }, (err) => {
                if (err) throw err;
            });
        });

        // User send image to a friend
        socket.on('client-send-image', data => {
            // Get sent time
            let datetime = new Date();
            let datetimeString = dateToString(datetime);

            // Get send file
            let base64Image = data.file.toString('base64');

            users.forEach(user => {
                if (user.username === data.receiver) {
                    // Sending to receiver
                    user.socketId.forEach(id => {
                        io.to(id).emit('client-receive-image', { sender: socket.username, file: base64Image, datetime: datetimeString });
                    });
                }
                // Send to other user's socketId 
                if (user.username === socket.username) {
                    user.socketId.forEach(id => {
                        if (id !== socket.id) {
                            io.to(id).emit('client-receive-image-from-their-socketids', { file: base64Image, datetime: datetimeString });
                        }
                    });
                }
            });

            // Saving to MongoDB
            Message.create({
                sender: socket.username,
                receiver: data.receiver,
                file: base64Image,
                datetime: datetime,
                seen: false
            }, (err) => {
                if (err) throw err;
            });
        });

        // Load old message with a friend from MongoDB
        socket.on('client-get-old-message', (data) => {
            Message.find({
                $or: [
                    { sender: socket.username, receiver: data.receiver },
                    { sender: data.receiver, receiver: socket.username }]
            },
                (err, messageArr) => {
                    if (err) throw err;
                    socket.emit('server-send-old-message', messageArr);

                    // Change seen status
                    messageArr.forEach(message => {
                        if (message.receiver === socket.username) {
                            message.seen = true;
                            message.save(err => {
                                if (err) throw err;
                            });
                        }

                        // Send seen status to friend
                        // At the client side, receiver is sender when client load old message
                        userSeenMessage(data.receiver, socket.username);
                    });
                });
        });

        // Client send message to group
        socket.on('client-send-message-to-group', data => {
            // Get sent time
            let datetime = new Date();
            let datetimeString = dateToString(datetime);

            // Send to room socketIO
            socket.to(data.receivedGroupId).emit('client-receive-message-from-group', { sender: socket.username, receivedGroupId: data.receivedGroupId, message: data.message, datetime: datetimeString });

            // Saving to MongoDB
            Message.create({
                sender: socket.username,
                receivedGroupId: data.receivedGroupId,
                message: data.message,
                datetime: datetime,
                seen: false
            }, (err) => {
                if (err) throw err;
            });
        });

        // User send image to group
        socket.on('client-send-image-to-group', data => {
            // Get sent time
            let datetime = new Date();
            let datetimeString = dateToString(datetime);

            // Get send file
            let base64Image = data.file.toString('base64');

            // Send to room socketIO
            socket.to(data.receivedGroupId).emit('client-receive-image-from-group', { sender: socket.username, receivedGroupId: data.receivedGroupId, file: base64Image, datetime: datetimeString });

            // Saving to MongoDB
            Message.create({
                sender: socket.username,
                receivedGroupId: data.receivedGroupId,
                file: base64Image,
                datetime: datetime,
                seen: false
            }, (err) => {
                if (err) throw err;
            });
        });

        // Load old message with a group from MongoDB
        socket.on('client-get-old-message-with-group', (data) => {
            Message.find({ receivedGroupId: data.receivedGroupId }, (err, messageArr) => {
                if (err) throw err;
                socket.emit('server-send-old-message-with-group', messageArr);

                // Change seen status
                messageArr.forEach(message => {
                    if (message.receiver === socket.username) {
                        message.seen = true;
                        message.save(err => {
                            if (err) throw err;
                        });
                    }

                    // Send seen status to friend
                    // At the client side, receiver is sender when client load old message
                    // userSeenMessage(data.receiver, socket.username);
                });
            });
        });

        // Change avatar
        socket.on('client-change-avatar', avatar => {
            let base64Image = avatar.toString('base64');
            // Change user's avatar in DB
            User.findOne({ username: socket.username }, (err, user) => {
                if (err) throw err;
                user.avatar = base64Image;
                user.save(err => {
                    if (err) throw err;
                });
            });
        })

        // Change full name
        socket.on('client-change-fullname', fullname => {
            User.findOne({ username: socket.username }, (err, user) => {
                if (err) throw err;
                user.fullname = fullname;
                user.save(err => {
                    if (err) throw err;
                });
            });
        });

        // Client disconnect
        socket.on('disconnect', () => {
            console.log(socket.username + " disconnected");

            // Delete user in users[] by username
            users.forEach((user, i) => {
                if (user.username === socket.username) {
                    users.splice(i, 1);
                }
            })

            // Send stop typing event
            io.sockets.emit('your-friend-stop-typing', socket.username);

            // Send disconnect username
            io.sockets.emit('sever-send-disconnect-username', socket.username);
        });
    });
}

module.exports = socket;