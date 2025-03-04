const io = require('socket.io-client');

// Connect to WebSocket server using the namespace 'chat'
const socket = io('http://localhost:3001/chat');

socket.on('connect', () => {
  console.log('Connected to WebSocket server:', socket.id);

  // Join a room
  socket.emit('joinRoom', 'room1');

  // Send a message to the room
  setTimeout(() => {
    socket.emit('sendMessage', {
      room: 'room1',
      message: 'Hello, this is a test message!'
    });
  }, 2000);
});

// Receive messages from the server
socket.on('receiveMessage', (data) => {
  console.log('New message:', data);
});

socket.on('joinedRoom', (room) => {
  console.log('Joined room:', room);
});
