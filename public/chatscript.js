// var $email = $("#email"); // refers to the jQuery object representation of the dom object
// var email_field = $("#email").get(0); // refers to the dom object itself

//The following go under #messages div
const SYS_MESSAGE_PRE_CONTENT = `<div class="system_message">`; // + content + closing div

const YOUR_MESSAGE_PRE_CONTENT = `
<div class="your_message">
	<div class="your_message_text">`;
const YOUR_MESSAGE_POST_CONTENT = `</div>
<div class="your_message_arrow_right"></div>
</div>`

// done in registerscript
// var socket = io.connect();

let users = [];
let $connectedUsers = $('#connectedUsers');
let $userMessageForm = $('#userMessageForm');
let $inputBox = $('#inputBox');
let $messages = $('#messages');
let messageSfx = new Audio('./sfx/new_msg.mp3');

if (!(yourName == null))
	appendToMessages(getSysMessageUserJoinedHtml(yourName));

// Retrieve connected users list
socket.emit('get_users');

//Send message
//----On Enter key press
$inputBox.on('keypress', function (key) {
	if (key.which == 13) {
		$userMessageForm.submit();
		return false;
	}
});
//----On "Send" button press
$userMessageForm.submit(function (e) {
	e.preventDefault();
	let msg = $inputBox.val();
	$inputBox.val('');
	if (!msg.trim().length) // inputBox is empty
		return;
	socket.emit('send_message', msg);
	appendToMessages(getYourMessageHtml(msg));
});

//Receive message
socket.on('new_message', function (data) {
	appendToMessages(getUserMessageHtml(data.msg, data.publicId));
	scrollToNewMessages();
});

//Sys messages
socket.on('sys_user_joined', function (data) {
	users.push(data);
	$connectedUsers.append(getConnectedUserHtml(data.publicId, data.username, data.colorGradientCss));
	appendToMessages(getSysMessageUserJoinedHtml(data.username));
});

socket.on('sys_user_left', function (publicId) {
	console.log('sys_user_left: ' + publicId);
	for (let i = 0; i < users.length; i++) {
		if (users[i].publicId == publicId) {
			appendToMessages(getSysMessageUserLeftHtml(users[i].username));
			$('#' + publicId.toString()).remove();
			users.splice(i, 1);
			// delete users[i]; //leaves an "empty" element behind and thus later give a typeerror: cannot read property publicId of 'undefined'
			break;
		}
	}
});

// On retrieving connected users list
socket.on('serve_users', function (userlist) {
	users = userlist;
	let connectedUsersHtml = '';
	for (let i = 0; i < users.length; i++) {
		let user = users[i];
		connectedUsersHtml += getConnectedUserHtml(user.publicId, user.username, user.colorGradientCss);
	}
	$connectedUsers.append(connectedUsersHtml);
});

// InputBox focus on chat click (if no text was selected)
$('.chat_box').mouseup(function () {
	let highlightedText = "";
	if (window.getSelection) {
		highlightedText = window.getSelection().toString();
	}
	else if (document.selection && document.selection.type != "Control") {
		highlightedText = document.selection.createRange().text;
	}
	if (highlightedText != "") {
		console.log("highlighted text");
	} else {
		$inputBox.focus();
	}
});

function getSysMessageUserLeftHtml(user) {
	return SYS_MESSAGE_PRE_CONTENT + `User<strong> ${user} </strong>has left the chat</div>`;
}

function getSysMessageUserJoinedHtml(user) {
	return SYS_MESSAGE_PRE_CONTENT + `User<strong> ${user} </strong>has joined the chat</div>`;
}
function getUserMessageHtml(msg, publicId) {
	let colorGradientCss;
	for (let i = 0; i < users.length; i++) {
		if (users[i].publicId == publicId) {
			// console.log(publicId);
			colorGradientCss = users[i].colorGradientCss;
			break;
		}
	}

	return `
	<div class="user_message">
	<div class="user_message_circle" style="` + colorGradientCss + `"></div>
	<div class="user_message_arrow_left"></div>
	<div class="user_message_text">` + msg + `</div></div>
	`;
}

function getYourMessageHtml(msg) {
	return YOUR_MESSAGE_PRE_CONTENT + msg + YOUR_MESSAGE_POST_CONTENT;
}

function getConnectedUserHtml(publicId, username, colorGradientCss) {
	return `
	<div class="user" id="` + publicId + `">
		<div class="connected_user_circle" style="` + colorGradientCss + `"></div>
		<div class="vertically_aligned_username">
			<div class="user_name">` + username + `</div>
			</div>
		</div>
	`;
}

function appendToMessages(html) {
	$messages.append(html);
	scrollToNewMessages();
	playSfx(messageSfx);
}

function scrollToNewMessages() {
	let messagesDomObj = $messages.get(0);
	messagesDomObj.scrollTop = messagesDomObj.scrollHeight;
}

function playSfx(sfx, volume = 1) {
	sfx.volume = volume;
	if (sfx.paused) {
		sfx.play().catch(error => {
			if (error instanceof DOMException) {
				console.log('Please interact with the document first to hear audio.');
			} else {
				throw error;
			}
		});
	} else {
		sfx.currentTime = 0;
	}
}