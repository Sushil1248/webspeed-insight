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


app.use(cors());
app.set('io', io); // Set the io object for access in other routes if needed
// Middleware to parse JSON requests
app.use(express.json());

// Connect to MongoDB
connectDB();

// Socket.io connection check
const activeJobs = {}; // Store active jobs by socketId
io.on('connection', (socket) => {
    const socketId = socket.id;

    console.log(`Client connected: ${socketId}`);
    app.set('currentSocketId', socketId);
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socketId}`);
        if (activeJobs[socketId]) {
            // Cancel or clean up all jobs for the disconnected client
            console.log(`Cancelling jobs for ${socketId}`);
            cancelJobsForClient(socketId); // Implement the cleanup logic here
            delete activeJobs[socketId]; // Remove job references
        }
    });
});

// Function to cancel jobs for a client (you need to define the cancellation logic)
const cancelJobsForClient = (socketId) => {
    if (activeJobs[socketId]) {
        activeJobs[socketId].forEach((jobUrl) => {
            console.log(`Job for ${jobUrl} cancelled for client ${socketId}`);
            // Implement specific logic to stop or cancel the job here
            // You might need to clear timers, stop processing, etc.
        });
    }
};

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

module.exports = { activeJobs }