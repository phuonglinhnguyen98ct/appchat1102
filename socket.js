const User = require('./apps/models/User');
const Message = require('./apps/models/Message');

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
                    usersDB.push({ username: user.username, avatar: user.avatar });
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
                        console.log(wattingMessagUsername);
                    });
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
                        io.to(id).emit('your-friend-stop-typing');
                    });
                }
            });
        });

        // User send message
        socket.on('client-send-message', data => {
            let now = new Date();
            let dd = String(now.getDate()).padStart(2, '0');
            let MM = String(now.getMonth() + 1).padStart(2, '0');
            let yyyy = now.getFullYear();
            let HH = String(now.getHours()).padStart(2, '0');
            let mm = String(now.getMinutes()).padStart(2, '0');
            // Get sent time
            let datetime = HH + ":" + mm + " " + dd + '/' + MM + '/' + yyyy;

            users.forEach(user => {
                if (user.username === data.receiver) {
                    // Sending to receiver
                    user.socketId.forEach(id => {
                        io.to(id).emit('client-receive-message', { sender: socket.username, message: data.message, datetime: datetime });
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

        // User send image
        socket.on('client-send-image', data => {
            let now = new Date();
            let dd = String(now.getDate()).padStart(2, '0');
            let MM = String(now.getMonth() + 1).padStart(2, '0');
            let yyyy = now.getFullYear();
            let HH = String(now.getHours()).padStart(2, '0');
            let mm = String(now.getMinutes()).padStart(2, '0');
            // Get sent time
            let datetime = HH + ":" + mm + " " + dd + '/' + MM + '/' + yyyy;

            // Get send file
            let base64Image = data.file.toString('base64');

            users.forEach(user => {
                if (user.username === data.receiver) {
                    // Sending to receiver
                    user.socketId.forEach(id => {
                        io.to(id).emit('client-receive-image', { sender: socket.username, file: base64Image, datetime: datetime });
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

        // Load message from MongoDB
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
                        message.seen = true;
                        message.save(err => {
                            if (err) throw err;
                        });
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

            // Send disconnect username
            io.sockets.emit('sever-send-disconnect-username', socket.username);
        });
    });
}

module.exports = socket;