const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// Statik fayllarni www papkasidan beramiz
app.use(express.static('www'));

// WebRTC Signaling mantiqlari
io.on('connection', (socket) => {
    console.log('Foydalanuvchi ulandi:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`${socket.id} joined room: ${roomId}`);
        // Xonadagi boshqalarga yangi foydalanuvchi kirdi deb xabar beramiz
        socket.to(roomId).emit('user-joined', socket.id);
    });

    socket.on('offer', (data) => {
        socket.to(data.roomId).emit('offer', data);
    });

    socket.on('answer', (data) => {
        socket.to(data.roomId).emit('answer', data);
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.roomId).emit('ice-candidate', data);
    });

    socket.on('disconnect', () => {
        console.log('Foydalanuvchi uzildi:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`WebRTC Signaling Server is running on port ${PORT}`);
});
