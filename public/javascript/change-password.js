const socket = io('http://localhost:3000');

const username = $("#login-username").text();

// Client send username
socket.emit('client-send-username', username);
