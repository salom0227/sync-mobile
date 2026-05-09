const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Listen for incoming Socket.io connections
io.on('connection', (socket) => {
    console.log('Foydalanuvchi ulandi:', socket.id);

    // Listen for 'state-change' event from a client
    socket.on('state-change', (data) => {
        // Broadcast the state change to ALL OTHER clients
        socket.broadcast.emit('state-update', data);
    });

    socket.on('disconnect', () => {
        console.log('Foydalanuvchi uzildi:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ishga tushdi: http://localhost:${PORT}`);
});
