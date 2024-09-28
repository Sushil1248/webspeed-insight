require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const sitemapRoute = require('./routes/sitemapRoute');
const { errorHandler } = require('./middleware/errorHandler');
const { connectDB } = require('./utils/dbConnect');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

// Initialize Express App
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*', // Allows all origins, you can also specify allowed origins like 'http://example.com'
        methods: ['GET', 'POST'], // Allowed HTTP methods
        allowedHeaders: ['Authorization'], // Allowed headers
        credentials: true, // Whether or not to allow credentials (cookies)
    },
});

io.on('connection', (socket) => {
    console.log(`A client connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

app.use(cors());
app.set('io', io); // Set the io object for access in other routes if needed
// Middleware to parse JSON requests
app.use(express.json());

// Connect to MongoDB
connectDB();

// Socket.io connection check
io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    // Optional: You can send a message to the client on connection
    socket.emit('welcome', 'Hello, you are connected to the socket server!');

    // Log disconnection events
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Routes
app.use('/api/sitemap', sitemapRoute);

// Error Handling Middleware
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Socket.io server is running as well.`);
});