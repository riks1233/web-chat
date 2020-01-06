var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');

//seems like __dirname is equal to including a . before name
//i.e. __dirname + '/index.html' == './index.html'

console.log('after calling readFile');

server.listen(process.env.PORT || 3000);
console.log('Server running...');

app.use(express.static(__dirname + '/'));

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

var connections = [];
var circle_colors = [];

fs.readFile(__dirname + '/circle_colors.json', 'utf8', function (err, contents) {
	// console.log(contents);
	circle_colors = JSON.parse(contents);
	console.log(circle_colors.length); //16
	console.log(circle_colors[0].name); //skyline
});

io.sockets.on('connection', function (socket) {
	//this approach doesnt work as duplicates may occur, when people come and go
	// socket.publicId = connections.length - 1; // sending this id to clients

	let id = generateId();
	socket.publicId = id;
	connections.push(socket);

	console.log('Connected: %s sockets connected', connections.length);

	//Disconnect
	socket.on('disconnect', function (data) {
		if (!(typeof socket.publicId === 'undefined' || socket.publicId === null)) {
			io.sockets.emit('sys_user_left', socket.publicId);
		}
		connections.splice(connections.indexOf(socket), 1);
		console.log('Disconnected: %s sockets connected', connections.length);
	});

	//Send message
	socket.on('send_message', function (msg) {
		socket.broadcast.emit('new_message', {
			"msg": msg,
			"publicId": socket.publicId
		}
		);
		// io.sockets.emit('new_message', {msg: data, user: socket.});
	});

	//Registering new user
	socket.on('new_user', function (data) {
		socket.username = data.username;
		// console.log(socket.username);
		let colorsValues = circle_colors[data.color_schema].colors;
		let rgbValues = '';
		for (let i = 0; i < colorsValues.length; i++) {
			rgbValues += hexToRgbString(colorsValues[i]);
			if (!(i == colorsValues.length - 1)) {
				rgbValues += ',';
			}
		}
		let user_circle_background_css_string = `background: linear-gradient(` + data.color_schema_deg + `deg,` + rgbValues + `);`;
		// console.log(user_circle_background_css_string);

		// background: linear-gradient(130deg, rgb(255, 0, 153), rgb(73, 50, 64));

		socket.colorGradientCss = user_circle_background_css_string;
		// console.log(socket.colors);
		socket.broadcast.emit('sys_user_joined', {
			"publicId": socket.publicId,
			"username": socket.username,
			"colorGradientCss": socket.colorGradientCss
		});
	});

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

function hexToRgbString(hex) {
	hex = hex.replace('#', '');
	let r = parseInt(hex.substring(0, 2), 16);
	let g = parseInt(hex.substring(2, 4), 16);
	let b = parseInt(hex.substring(4, 6), 16);
	return 'rgb(' + r + "," + g + "," + b + ')';
}
// console.log("hexToRgbConverson: " + hexToRgbString("#CC00CC")); // "rgb(204,0,204)"

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