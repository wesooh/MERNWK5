// server/index.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const onlineUsers = {};
const userRooms = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('registerUser', (username) => {
    onlineUsers[socket.id] = username;
    userRooms[socket.id] = 'general'; // default room

    socket.join('general');
    io.to('general').emit('chatMessage', {
      user: 'System',
      message: `${username} joined general`,
      time: new Date().toLocaleTimeString()
    });

    io.emit('onlineUsers', Object.values(onlineUsers));
  });

  socket.on('joinRoom', (roomName) => {
    const username = onlineUsers[socket.id];
    const currentRoom = userRooms[socket.id];

    socket.leave(currentRoom);
    socket.join(roomName);

    userRooms[socket.id] = roomName;

    socket.to(currentRoom).emit('chatMessage', {
      user: 'System',
      message: `${username} left the room`,
      time: new Date().toLocaleTimeString()
    });

    socket.to(roomName).emit('chatMessage', {
      user: 'System',
      message: `${username} joined ${roomName}`,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on('chatMessage', (data) => {
    const room = userRooms[socket.id];
    io.to(room).emit('chatMessage', data);
  });

  socket.on('typing', (user) => {
    const room = userRooms[socket.id];
    socket.to(room).emit('typing', user);
  });

  socket.on('disconnect', () => {
    const username = onlineUsers[socket.id];
    const room = userRooms[socket.id];

    delete onlineUsers[socket.id];
    delete userRooms[socket.id];

    io.to(room).emit('chatMessage', {
      user: 'System',
      message: `${username} left the room`,
      time: new Date().toLocaleTimeString()
    });

    io.emit('onlineUsers', Object.values(onlineUsers));
  });
});

app.get('/', (req, res) => {
  res.send('Server is running...');
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
