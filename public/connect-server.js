


const socket = io("http://localhost:3000");

// Dang nhap
$("#btnSignup").click(() => {

    var username = $("#username").val();

    socket.emit('client-send-username', username);

    socket.on('sign-up-fail', () => {
        alert("Sign up failed, please to try other username!");
    });

    socket.on('sign-up-success', data => {
        $("#chat-form").removeClass("hidden");
        $("#chat-form").addClass("grid-20-80");
        $("#chat-form").show();
        $("#chat-line").empty();
        $("#login-form").hide(1000);
        $("#hello-sb").html(`Hello <b id="sender">` + data + "</b>");
    });
});

$("#username").keypress(e => {
    if (e.which === 13) {
        $("#btnSignup").click();
    }
});



// Nhan danh sach nguoi dung online
socket.on('server-send-users-list', data => {
    $("#user-online").empty();
    data.forEach(element => {
        let username = element.username;
        $("#user-online").append(`<div onclick=choosePerson("${username}") class="user-online">` + username + "</div>");
    });
});



// Dang xuat
$("#btn-logout").click(() => {
    // socket.emit('user-logout');
    // $("#login-form").show(1000);
    // $("#chat-form").hide(500);
    location.reload();
});

// Client gui tin nhan
$("#btn-send-mess").click(() => {
    let mess = $("#inp-mess").val().trim();
    let receiver = $("#receiver").text();
    let sender = $("#sender").text();
    if (mess != "") {
        $("#chat-box").append(`<div class="send-mess">` + mess + "</div>");
        socket.emit('client-send-client', { receiver, mess });
        $("#inp-mess").val("");
        let objDiv = document.getElementById("chat-box");
        objDiv.scrollTop = objDiv.scrollHeight;

    }


    // let mess = $("#inp-mess").val().trim();
    // if (mess != "") {
    //     socket.emit('client-send-client', {username, mess});
    //     $("#inp-mess").val("");
    //     let objDiv = document.getElementById("chat-box");
    //     objDiv.scrollTop = objDiv.scrollHeight;
    // }
});

$("#inp-mess").keypress(e => {
    if (e.which === 13 && e.which != "") {
        $("#btn-send-mess").click();
    }
});



// Client nhan tin nhan
// socket.on('server-send-message', data => {
//     $("#inp-mess").empty();
//     $("#chat-box").append("<div><strong>" + data.sender + ": </strong>" + data.data + "</div>");
// });

// Client nhan tin nhan tu 1 nguoi
socket.on('client-receive-client', data => {
    $("#chat-box").append(`<div class="receive-mess"><b>` + data.sender + ": </b>" + data.mess + "</div>");
    let objDiv = document.getElementById("chat-box");
    objDiv.scrollTop = objDiv.scrollHeight;
});


// Chon nguoi gui tin nhan
function choosePerson(username) {
    $("#receiver").text(username);
}