var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

server.listen(process.env.PORT || 3000);
console.log('Server running...');

var publicRoot = __dirname + '/public/';
app.use(express.static(publicRoot));
app.use(express.urlencoded());

// GET requests
app.get('/', function (req, res) {
	res.sendFile(publicRoot + '/register.html');
});
app.get('/circle_colors', function (req, res) {
	res.sendFile(publicRoot + '/circle_colors.json')
});
app.get('/chat', function (req, res) {
	res.sendFile(publicRoot + '/chat.html');
});

var connections = [];

io.sockets.on('connection', function (socket) {
	//Disconnect
	socket.on('disconnect', function (data) {
		if (!(typeof socket.publicId === 'undefined' || socket.publicId === null)) {
			io.sockets.emit('sys_user_left', socket.publicId);
		}
		connections.splice(connections.indexOf(socket), 1);
		console.log('User disconnected: %s sockets connected', connections.length);
	});

	//Send message
	socket.on('send_message', function (msg) {
		socket.broadcast.emit('new_message', {
			"msg": msg,
			"publicId": socket.publicId
		}
		);
	});

	//Registering new user
	socket.on('new_user', function (data) {
		let id = generateId();
		socket.publicId = id;
		connections.push(socket);
		console.log('User connected: %s sockets connected', connections.length);
		
		socket.username = data.username;
		socket.colorGradientCss = `background: ${data.color_schema};`;
		socket.broadcast.emit('sys_user_joined', {
			"publicId": socket.publicId,
			"username": socket.username,
			"colorGradientCss": socket.colorGradientCss
		});
	});

	//Sending out user list to specific client that requested it
	socket.on('get_users', function () {
		let userlist = [];
		connections.forEach(connection => {
			userlist.push({
				"publicId": connection.publicId,
				"username": connection.username,
				"colorGradientCss": connection.colorGradientCss
			});
		})
		socket.emit('serve_users', userlist);
	})
});

// console.log("hexToRgbConverson: " + hexToRgbString("#CC00CC")); // "rgb(204,0,204)"
function hexToRgbString(hex) {
	hex = hex.replace('#', '');
	let r = parseInt(hex.substring(0, 2), 16);
	let g = parseInt(hex.substring(2, 4), 16);
	let b = parseInt(hex.substring(4, 6), 16);
	return 'rgb(' + r + "," + g + "," + b + ')';
}

function generateId() {
	let taken_ids = [];
	let id = -1;
	for (let i = 0; i < connections.length; i++) {
		taken_ids.push(connections[i].publicId);
	}
	for (let i = 0; i < taken_ids.length; i++) {
		if (!(taken_ids.includes(i))) {
			id = i;
		}
	}
	if (id == -1) {
		id = taken_ids.length;
	}
	return id;
}