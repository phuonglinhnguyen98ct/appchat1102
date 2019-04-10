const socket = io('http://localhost:3000');

const username = $("#login-username").text();

// Client send username
socket.emit('client-send-username', username);

// Preview avatar
$('input[type=file]').change(function () {
    if (this.files[0]) {
        console.log(this.files[0]);
        // Check file is image
        if (this.files[0].type !== 'image/png' && this.files[0].type !== 'image/gif' && this.files[0].type !== 'image/jpeg') {
            $("#btn-apply").attr('disabled', 'disabled');
            $("#msg-error-success").empty();
            $("#msg-error-success").append(`<div class="error-msg"><ul><li>The file must be an image</li></ul></div>`);
            // alert("The file must be an image");
        }
        else {
            // Check file's size 
            if (this.files[0].size >= 4000000) {
                $("#btn-apply").attr('disabled', 'disabled');
                $("#msg-error-success").empty();
                $("#msg-error-success").append(`<div class="error-msg"><ul><li>Maximum upload file: 4MB</li></ul></div>`);
                // alert("Maximum upload file: 4MB");
            }
            else {
                let url = URL.createObjectURL(this.files[0]);
                $("#img-avatar").attr('src', url);
                $("#btn-apply").removeAttr('disabled');
            }
        }
    }
});