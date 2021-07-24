const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');

const app = express();
const server = http.createServer(app);
const io = socketio(server); // socketio instance with http server passed in

app.use(express.static(path.join(__dirname, '../public')));

const {
  generateMessage,
  generateLocationMessage,
} = require('./helper/messages');

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require('./helper/users');

// server (emit) => client (receive) - message

io.on('connection', (socket) => {
  // room communication
  socket.on('join', (options, callback) => {
    // options = {username, room}
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }
    const { username, room } = user;
    socket.join(room);
    socket.emit('message', generateMessage('Welcome', 'Admin')); // emits a welcome message on getting connection
    socket.broadcast
      .to(room)
      .emit('message', generateMessage(`${username} has joined`, 'Admin')); // send to everybody except the current client
    io.to(user.room).emit('roomData', {
      room,
      users: getUsersInRoom(room),
    });
    callback();
    // io.to.emit, socket.broadcast.to.emit - communication only to specific room, to is a function that takes in room name as parameter
  });

  socket.on('sendMessage', (message, callback) => {
    // receiving the callback to send acknowledgment
    const user = getUser(socket.id);
    const { username, room } = user;
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback('Profanity is not allowed');
    } else {
      io.to(room).emit('message', generateMessage(message, username));
      callback(); // acknowledging the event
    }
  });

  socket.on('sendLocation', (coords, callback) => {
    // on getting request from client, emit back location url along with acknowledgement
    const user = getUser(socket.id);
    const { username, room } = user;
    if (coords) {
      io.to(room).emit(
        'locationMessage',
        generateLocationMessage(coords, username)
      );
      callback();
    } else {
      callback('Coordinates not received');
    }
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
      const { username, room } = user;
      io.to(room).emit(
        'message',
        generateMessage(`${username} has left`, 'Admin')
      ); // sends to every client
      io.to(room).emit('roomData', {
        room,
        users: getUsersInRoom(room),
      });
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log('Listening on port 3000'));
