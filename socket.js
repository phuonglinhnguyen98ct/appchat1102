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
        socket.on('client-send-username', async username => {

            console.log(username + " connected");

            // Storage client's username to socket
            socket.username = username;

            // Get avatar's name from DB
            let avatar;
            await User.findOne({ username: username }, (err, user) => {
                if (err) throw err;
                avatar = user.avatar;
            });

            // Check user existed
            let check = false;
            for (let i = 0, n = users.length; i < n; i++) {
                if (users[i].username === username) {
                    users[i].socketId.push(socket.id);
                    users[i].avatar = avatar;
                    check = true;
                    break;
                }
            }
            if (!check) {
                users.push({ username: username, socketId: [socket.id], avatar: avatar });
            }

            // Send online users list to client
            sendOnlineUsers();
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
                if (user.username === data)  {
                    user.socketId.forEach(id => {
                        io.to(id).emit('your-friend-stop-typing');
                    });
                }
            });
        });

        // User send message
        socket.on('client-send-message', data => {
            users.forEach(user => {
                if (user.username === data.receiver) {
                    let now = new Date();
                    let dd = String(now.getDate()).padStart(2, '0');
                    let MM = String(now.getMonth() + 1).padStart(2, '0');
                    let yyyy = now.getFullYear();
                    let HH = String(now.getHours()).padStart(2, '0');
                    let mm = String(now.getMinutes()).padStart(2, '0');

                    datetime = HH + ":" + mm + " " + dd + '/' + MM + '/' + yyyy;

                    // Sending to receiver
                    user.socketId.forEach(id => {
                        io.to(id).emit('client-receive-message', { sender: socket.username, message: data.message, datetime: datetime });
                    });

                    // Saving to MongoDB
                    Message.create({
                        sender: socket.username,
                        receiver: data.receiver,
                        message: data.message,
                        datetime: datetime
                    }, (err) => {
                        if (err) throw err;
                    });
                }
            });
        });

        // User send image
        socket.on('client-send-image', data => {
            users.forEach(user => {
                if (user.username === data.receiver) {
                    // Get send file
                    let base64Image = data.file.toString('base64');

                    // Get send time
                    let now = new Date();
                    let dd = String(now.getDate()).padStart(2, '0');
                    let MM = String(now.getMonth() + 1).padStart(2, '0');
                    let yyyy = now.getFullYear();
                    let HH = String(now.getHours()).padStart(2, '0');
                    let mm = String(now.getMinutes()).padStart(2, '0');
                    datetime = HH + ":" + mm + " " + dd + '/' + MM + '/' + yyyy;

                    // Sending to receiver
                    user.socketId.forEach(id => {
                        io.to(id).emit('client-receive-image', { sender: socket.username, file: base64Image, datetime: datetime });
                    });

                    // Saving to MongoDB
                    Message.create({
                        sender: socket.username,
                        receiver: data.receiver,
                        file: base64Image,
                        datetime: datetime
                    }, (err) => {
                        if (err) throw err;
                    });
                }
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

            // Send online users list to client
            sendOnlineUsers();
        });
    });
}

module.exports = socket;