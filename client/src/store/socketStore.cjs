// socketStore.js
const socketStore = {};

const addSocketId = (userId, socketId) => {
    socketStore[userId] = socketId;
};

const removeSocketId = (userId) => {
    delete socketStore[userId];
};

const getSocketId = (userId) => {
    return socketStore[userId];
};

module.exports = {
    addSocketId,
    removeSocketId,
    getSocketId,
};
