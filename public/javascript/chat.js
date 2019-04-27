const socket = io('http://localhost:3000');

const username = $("#login-username").text();
let receiver;

// Client send username
socket.emit('client-send-username', username);

// Receive all users
socket.on('send-users-db', users => {
    $("#online-user-container").empty();
    let clickUser = false; // Check first user online is clicked

    users.forEach(user => {
        // Check user's avatar existed
        if (user.avatar) {
            if (!clickUser) {
                $("#online-user-container").append(`<div onclick="choosePerson('${user.username}', '${user.fullname}', this)" class="online-user" username="${user.username}"><img src="data:image/jpeg;base64,${user.avatar}"><span>${user.username}</span><div class="online-status"></div></div>`);

                // Click on first online user
                $(".online-user").click();
                clickUser = true;
            }
            else {
                $("#online-user-container").append(`<div onclick="choosePerson('${user.username}', '${user.fullname}', this)" class="online-user" username="${user.username}"><img src="data:image/jpeg;base64,${user.avatar}"><span>${user.username}</span><div class="online-status"></div></div>`);
            }
        }
        else {
            if (!clickUser) {
                $("#online-user-container").append(`<div onclick="choosePerson('${user.username}', '${user.fullname}', this)" class="online-user" username="${user.username}"><img src="/images/avatar-icon.png"><span>${user.username}</span><div class="online-status"></div></div>`);

                // Click on first online user
                $(".online-user").click();
                clickUser = true;
            }
            else {
                $("#online-user-container").append(`<div onclick="choosePerson('${user.username}', '${user.fullname}', this)" class="online-user" username="${user.username}"><img src="/images/avatar-icon.png"><span>${user.username}</span><div class="online-status"></div></div>`);
            }
        }
    });
});

// Receive online users
socket.on('server-send-online-users', users => {
    users.forEach(user => {
        $(`[username=${user.username}]`).children('div').css('background-color', '#00E500');
    });
});

// Receive disconnect users
socket.on('sever-send-disconnect-username', username => {
    $(`[username=${username}]`).children('div').css('background-color', '#888888');
});

// Client send image
let file;
$('input[type=file]').change(function () {
    file = this.files[0];
    if (file) {
        // Check file is image        
        if (file.type !== 'image/png' && file.type !== 'image/gif' && file.type !== 'image/jpeg') {
            alert("The file must be an image");
        }
        else {
            // Check file's size 
            if (file.size >= 4000000) {
                alert("Maximum upload file: 4MB");
            }
            else {
                let url = URL.createObjectURL(file);

                // Set heigt of message container
                $("#message-container").innerHeight($("#message-container").innerHeight() - 80);

                // Set margin-top of insert file button and send button
                $(".input-file").css('margin-top', "80px");
                $("#btn-send-mess-container").css('margin-top', "80px");

                // Insert image into message input
                $(".input-file label input").attr('disabled', 'disabled');
                $(".input-container").prepend(`<i class="far fa-times-circle"></i>`);
                $(".input-container").prepend(`<img src="${url}" height="79px">`);

                // Handle click X button (cancel send image)
                $(".input-container i").click(() => {
                    // Delete temperature file (image)
                    file = "";

                    // Delete image into message input
                    $(".input-container img").remove();
                    $(".input-container i").remove();

                    // Abled input file
                    $(".input-file label input").removeAttr('disabled');

                    // Refresh input file
                    $(".input-file label input").val("");

                    // Set margin-top of insert file button and send button
                    $(".input-file").css('margin-top', "0px");
                    $("#btn-send-mess-container").css('margin-top', "0px");

                    // Set height of message container
                    $("#message-container").innerHeight($("#message-container").innerHeight() + 80);

                    // Focus to input-message box
                    $("#inp-message").focus();
                });

                // Focus to input-message box
                $("#inp-message").focus();

            }
        }
    }
});

let showTypingStatusToFriend = false; // Typing status is showing to client's friend

// Handle stop typing event
socket.on('your-friend-stop-typing', () => {
    if ($(".status-container").length > 0) {
        $(".status-container").remove();
    }
});

// Handle typing event
$("#inp-message").keyup(() => {
    if (receiver !== "") {
        // Check text exists in message input 
        if ($("#inp-message").val()) {
            // Isn't a status
            if (!showTypingStatusToFriend) {
                // Send status to server
                socket.emit('client-typing', receiver);
                showTypingStatusToFriend = true;
            }
        }
        else {
            socket.emit('client-stop-typing', receiver);
            showTypingStatusToFriend = false;
        }
    }
});

// Receive TYPING event from server
socket.on('your-friend-is-typing', data => {
    // Insert typing image into message box
    if (data === receiver) {
        $("#message-container").append(`<div class="status-container"><img src="/images/3-dots-gif.gif"></div>`);

        // Scroll to the bottom of message container 
        $("#message-container").scrollTop($("#message-container")[0].scrollHeight);

        // Set timeout (case client's friend log out...)
        setTimeout(() => {
            if ($(".status-container").length > 0) {
                $(".status-container").remove();
            }
        }, 10000);
    }
});

// Receive SEEN event from server
socket.on('your-friend-has-seen-your-message', data => {
    if (data === receiver) {
        // Delete old seen status
        if ($(".seen-container").length > 0) {
            $(".seen-container").remove();
        }

        // Insert seen status into message box
        $("#message-container").append(`<div class="seen-container">seen</div>`);

        // Scroll to the bottom of message container 
        $("#message-container").scrollTop($("#message-container")[0].scrollHeight);
    }
});

// Client send message
$("#btn-send-message").click(() => {
    let message = $("#inp-message").val().trim();
    if (receiver === "") {
        // alert("Please select a person before chatting");
    }
    else {
        // Send text
        if (message) {
            let now = new Date();
            let dd = String(now.getDate()).padStart(2, '0');
            let MM = String(now.getMonth() + 1).padStart(2, '0');
            let yyyy = now.getFullYear();
            let HH = String(now.getHours()).padStart(2, '0');
            let mm = String(now.getMinutes()).padStart(2, '0');

            datetime = HH + ":" + mm + " " + dd + '/' + MM + '/' + yyyy;
            // Showing immediately to message container 
            $("#message-container").append(`<div class="send-message">${message}<div class="send-datetime">${datetime}</div></div>`);

            // Delete text in inp-message
            $("#inp-message").val("");

            // Send message to server
            socket.emit('client-send-message', { receiver: receiver, message: message });
        }
        // Send image
        if (file) {
            // Delete image into message input
            $(".input-container img").remove();
            $(".input-container i").remove();

            // Abled input file
            $(".input-file label input").removeAttr('disabled');

            // Refresh input file
            $(".input-file label input").val("");

            // Set margin-top of insert file button and send button
            $(".input-file").css('margin-top', "0px");
            $("#btn-send-mess-container").css('margin-top', "0px");

            // Set height of message container
            $("#message-container").innerHeight($("#message-container").innerHeight() + 80);

            // Showing immediately to message container 
            let url = URL.createObjectURL(file);
            $("#message-container").append(`<div class="send-image"><img src="${url}" height="150px"></div>`);

            // Send image to server
            socket.emit('client-send-image', { receiver: receiver, file: file });

            // Delete temperature file (image)
            file = "";
        }
    }
    // Scroll to the bottom of message container 
    $("#message-container").scrollTop($("#message-container")[0].scrollHeight);
});

// Handle Send message's ENTER event
$("#inp-message").keypress(e => {
    if (e.which === 13 && e.which != "") {
        $("#btn-send-message").click();
    }
});

// Client receive message
socket.on('client-receive-message', data => {
    if (data.sender === receiver) {
        // Case: not send to myself
        if (data.sender !== username) {
            $("#message-container").append(`<div class="receive-message"><b>${data.sender}: </b>${data.message}<div class="receive-datetime">${data.datetime}</div></div>`);

            // Scroll to the bottom of message container 
            $("#message-container").scrollTop($("#message-container")[0].scrollHeight);

            sendSeenStatus(data.sender, username);
        }
    }
    else {
        $(`[username=${data.sender}]`).addClass('waiting-message');
    }
});

// Client receive image
socket.on('client-receive-image', data => {
    if (data.sender === receiver) {
        // Case: not send to myself
        if (data.sender !== username) {
            $("#message-container").append(`<div class="receive-image"><div><img src="data:image/jpeg;base64,${data.file}"></div><div class="receive-datetime">${data.datetime}</div></div>`);

            // Scroll to the bottom of message container 
            $("#message-container").scrollTop($("#message-container")[0].scrollHeight);

            sendSeenStatus(data.sender, username);
        }
    }
    else {
        $(`[username=${data.sender}]`).addClass('waiting-message');
    }
});

// Client receive message from other socketIDs
socket.on('client-receive-message-from-their-socketids', data => {
    $("#message-container").append(`<div class="send-message">${data.message}<div class="send-datetime">${data.datetime}</div></div>`);

    // Scroll to the bottom of message container 
    $("#message-container").scrollTop($("#message-container")[0].scrollHeight);
});

// Client receive image from other socketIDs
socket.on('client-receive-image-from-their-socketids', data => {
    $("#message-container").append(`<div class="send-image"><img src="data:image/jpeg;base64,${data.file}" height="150px"><div class="send-datetime">${data.datetime}</div></div>`);

    // Scroll to the bottom of message container 
    $("#message-container").scrollTop($("#message-container")[0].scrollHeight);
});

// Load old message from server (with a friend)
socket.on('server-send-old-message', data => {
    $("#message-container").empty();
    let seenStatus = false;
    data.forEach(message => {
        if (message.sender === username) {
            // If message is a text
            if (message.message) {
                $("#message-container").append(`<div class="send-message">${message.message}<div class="send-datetime">${message.datetime}</div></div>`);
            }
            // If message is a image
            else {
                $("#message-container").append(`<div class="send-image"><img src="data:image/jpeg;base64,${message.file}"><div class="send-datetime">${message.datetime}</div></div>`);
            }
            seenStatus = message.seen;
        }
        else {
            // If message is a text
            if (message.message) {
                $("#message-container").append(`<div class="receive-message"><b>${message.sender}: </b>${message.message}<div class="receive-datetime">${message.datetime}</div></div>`);
            }
            // If message is a image
            else {
                $("#message-container").append(`<div class="receive-image"><div><img src="data:image/jpeg;base64,${message.file}"></div><div class="receive-datetime">${message.datetime}</div></div>`);
            }
        }
    });

    if (seenStatus) {
        // Insert seen status into message box
        $("#message-container").append(`<div class="seen-container">seen</div>`);
    }

    // Show datetime when click on message content
    showDateTime();

    // Scroll to the bottom of message container 
    $("#message-container").scrollTop($("#message-container")[0].scrollHeight);
});

// Receive waitting message's username 
socket.on('server-send-watting-message-username', usernames => {
    usernames.forEach(username => {
        $(`[username=${username}]`).addClass('waiting-message');
    });
});

function sendSeenStatus(sender, receiver) {
    socket.emit('client-send-seen-message-status', { sender, receiver });
}

// Showing sent datetime when click on message content
function showDateTime() {
    $(".send-message").on('click', (event) => {
        $(event.target).children(".send-datetime").toggle(200);
    });
    $(".receive-message").on('click', (event) => {
        $(event.target).children(".receive-datetime").toggle(200);
    });
    $(".send-image").on('click', (event) => {
        $(event.target).siblings(".send-datetime").toggle(200);
    });
    $(".receive-image div img").on('click', (event) => {
        $(event.target).parent().siblings("div .receive-datetime").toggle(200);
    });
}


// Choose person to send message
function choosePerson(username, fullname, element) {
    // Delete receiveGroup's id
    receivedGroupId = "";

    // Get receiver's name
    receiver = username;

    $("#receiver-container").html(`<div>${username}</div><div class="fullname">${fullname}</div>`);
    $(".chat-group").removeClass("active");
    $(".online-user").removeClass("active");
    $(element).addClass("active");

    // Seen message
    $(`[username=${username}]`).removeClass('waiting-message');

    // Focus to input-message box
    $("#inp-message").focus();

    // Get old message from server
    socket.emit('client-get-old-message', { receiver: receiver });
}

// Handle press add group
$("#btn-add-group").click(() => {
    $('input').filter(':checkbox').prop('checked', false);
    $(".modal").css('display', 'block');
});

// Handle press exit add group
$("#btn-exit-add-group").click(() => {
    $(".modal").css('display', 'none');
});

// Handle press outside add group form to exit
$(window).click((e) => {
    if (e.target.className === 'modal') {
        $(".modal").css('display', 'none');
    }
});

// Get user list to create group
socket.on('send-users-db', users => {
    $(".user-container").empty();

    users.forEach(user => {
        if (user.username !== username) {
            // Insert into user list to add group 
            $(".user-container").append(`<div class="user-group"><input type="checkbox" name="userInGroup[]" value="${user.username}">${user.username}</input></div>`);
            // Insert into user list to edit group 
            $(".user-container-to-edit").append(`<div class="user-group"><input type="checkbox" name="userInGroup[]" edit-user-value="${user.username}" value="${user.username}">${user.username}</input></div>`);
        }
    });
});

// Receive chat groups from server
socket.on('sever-send-chat-groups', groups => {
    groups.forEach(group => {
        groupMembersString = group.members.join("---&&*&&*%%*%%---");
        $(".chat-group-container").append(`<div class="chat-group" groupId="${group._id}" onclick="chooseGroup('${group.name}', '${group._id}', '${group.creator}', '${groupMembersString}', this)">${group.name}</div>`);
    });
});

let receivedGroupId;
let groupMembers; // group's members to edit

// Choose group to chat
function chooseGroup(groupName, groupId, groupCreator, groupMembersString, element) {
    // Delete receiver name
    receiver = "";

    if (groupMembersString) {
        groupMembers = groupMembersString.split("---&&*&&*%%*%%---");
    }

    // Get receiverGroup name
    receivedGroupId = groupId;

    // Check user is group's creator
    if (username === groupCreator) {
        $("#receiver-container").html(`<div>${groupName}<i class="fas fa-cog" id="btn-edit-group"></i></div><div class="group-id">ID: ${groupId}</div>`);
    }
    else {
        $("#receiver-container").html(`<div>${groupName}</div><div class="group-id">ID: ${groupId}</div>`);
    }
    
    // Insert groupId into edit group form
    $(".group-id").val(groupId);

    // Insert groupCreator into edit group form
    $(".group-creator").html(`<b>Creator:</b> ${groupCreator}`);

    $(".online-user").removeClass("active");
    $(".chat-group").removeClass("active");
    $(element).addClass("active");

    // Seen message
    $(`[groupId=${groupId}]`).removeClass('waiting-message');

    // Delete message in message box
    $("#message-container").empty();

    // Focus to input-message box
    $("#inp-message").focus();

    // Get old message from server
    socket.emit('client-get-old-message-with-group', { receivedGroupId: receivedGroupId });
}

// Client send message to group
$("#btn-send-message").click(() => {
    let message = $("#inp-message").val().trim();
    if (receivedGroupId === "") {
        // alert("Please select a person before chatting");
    }
    else {
        // Send text
        if (message) {
            let now = new Date();
            let dd = String(now.getDate()).padStart(2, '0');
            let MM = String(now.getMonth() + 1).padStart(2, '0');
            let yyyy = now.getFullYear();
            let HH = String(now.getHours()).padStart(2, '0');
            let mm = String(now.getMinutes()).padStart(2, '0');

            datetime = HH + ":" + mm + " " + dd + '/' + MM + '/' + yyyy;
            // Showing immediately to message container 
            $("#message-container").append(`<div class="send-message">${message}<div class="send-datetime">${datetime}</div></div>`);

            // Delete text in inp-message
            $("#inp-message").val("");

            // Send message to server
            socket.emit('client-send-message-to-group', { receivedGroupId: receivedGroupId, message: message });
        }
        // Send image
        if (file) {
            // Delete image into message input
            $(".input-container img").remove();
            $(".input-container i").remove();

            // Abled input file
            $(".input-file label input").removeAttr('disabled');

            // Refresh input file
            $(".input-file label input").val("");

            // Set margin-top of insert file button and send button
            $(".input-file").css('margin-top', "0px");
            $("#btn-send-mess-container").css('margin-top', "0px");

            // Set height of message container
            $("#message-container").innerHeight($("#message-container").innerHeight() + 80);

            // Showing immediately to message container 
            let url = URL.createObjectURL(file);
            $("#message-container").append(`<div class="send-image"><img src="${url}" height="150px"></div>`);

            // Send image to server
            socket.emit('client-send-image-to-group', { receivedGroupId: receivedGroupId, file: file });

            // Delete temperature file (image)
            file = "";
        }
    }
    // Scroll to the bottom of message container 
    $("#message-container").scrollTop($("#message-container")[0].scrollHeight);
});

// Receive message from client's groups
socket.on('client-receive-message-from-group', data => {
    if (data.receivedGroupId === receivedGroupId) {
        // Case: receive from other user's socket
        if (username === data.sender) {
            $("#message-container").append(`<div class="send-message">${data.message}<div class="send-datetime">${data.datetime}</div></div>`);

            // Scroll to the bottom of message container 
            $("#message-container").scrollTop($("#message-container")[0].scrollHeight);

            // sendSeenStatus(data.sender, username);
        }
        else {
            $("#message-container").append(`<div class="receive-message"><b>${data.sender}: </b>${data.message}<div class="receive-datetime">${data.datetime}</div></div>`);

            // Scroll to the bottom of message container 
            $("#message-container").scrollTop($("#message-container")[0].scrollHeight);

            // sendSeenStatus(data.sender, username);
        }
    }
    else {
        $(`[groupId=${data.receivedGroupId}]`).addClass('waiting-message');
    }
});

// Client receive image from client's groups
socket.on('client-receive-image-from-group', data => {
    if (data.receivedGroupId === receivedGroupId) {
        // Case: receive from other user's socket
        if (username === data.sender) {
            $("#message-container").append(`<div class="send-image"><div><img src="data:image/jpeg;base64,${data.file}"></div><div class="send-datetime">${data.datetime}</div></div>`);

            // Scroll to the bottom of message container 
            $("#message-container").scrollTop($("#message-container")[0].scrollHeight);

            // sendSeenStatus(data.sender, username);
        }
        else {
            $("#message-container").append(`<div class="receive-image"><div><div><b>${data.sender}: </b></div><img src="data:image/jpeg;base64,${data.file}"></div><div class="receive-datetime">${data.datetime}</div></div>`);

            // Scroll to the bottom of message container 
            $("#message-container").scrollTop($("#message-container")[0].scrollHeight);

            // sendSeenStatus(data.sender, username);
        }
    }
    else {
        $(`[groupId=${data.receivedGroupId}]`).addClass('waiting-message');
    }
});

// Load old message from server (with a group)
socket.on('server-send-old-message-with-group', data => {
    $("#message-container").empty();
    let seenStatus = false;
    data.forEach(message => {
        if (message.sender === username) {
            // If message is a text
            if (message.message) {
                $("#message-container").append(`<div class="send-message">${message.message}<div class="send-datetime">${message.datetime}</div></div>`);
            }
            // If message is a image
            else {
                $("#message-container").append(`<div class="send-image"><img src="data:image/jpeg;base64,${message.file}"><div class="send-datetime">${message.datetime}</div></div>`);
            }
            seenStatus = message.seen;
        }
        else {
            // If message is a text
            if (message.message) {
                $("#message-container").append(`<div class="receive-message"><b>${message.sender}: </b>${message.message}<div class="receive-datetime">${message.datetime}</div></div>`);
            }
            // If message is a image
            else {
                $("#message-container").append(`<div class="receive-image"><div><div><b>${message.sender}: </b></div><img src="data:image/jpeg;base64,${message.file}"></div><div class="receive-datetime">${message.datetime}</div></div>`);
            }
        }
    });

    // if (seenStatus) {
    //     // Insert seen status into message box
    //     $("#message-container").append(`<div class="seen-container">seen</div>`);
    // }

    // Show datetime when click on message content
    showDateTime();

    // Scroll to the bottom of message container 
    $("#message-container").scrollTop($("#message-container")[0].scrollHeight);
});

// Handle press edit group
$(document).on('click', '#btn-edit-group', () => {
    $(".edit-group").css('display', 'block');

    // Show group's members
    $('input').filter(':checkbox').prop('checked', false);
    groupMembers.forEach(member => {
        $(`[edit-user-value=${member}]`).prop('checked', true);
    });
});

// Handle press exit edit group
$("#btn-exit-edit-group").click(() => {
    $(".edit-group").css('display', 'none');
});

// Handle press outside add group form to exit
$(window).click((e) => {
    if (e.target.className === 'edit-group') {
        $(".edit-group").css('display', 'none');
    }
});

// Handle press delete group
$(document).on('click', '#btn-delete-group', () => {
    $(".delete-group-modal").css('display', 'block');

});

// Handle press cancel delete group
$("#btn-cancel-delete-group").click(() => {
    $(".delete-group-modal").css('display', 'none');
});

// Handle press outside delete group form to exit
$(window).click((e) => {
    if (e.target.className === 'delete-group-modal') {
        $(".delete-group-modal").css('display', 'none');
    }
});