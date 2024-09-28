const { Response } = require('../models/response');

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;
  res.status(statusCode).json(new Response(statusCode, err.message || 'Internal Server Error', err.data || {}));
};

module.exports = { errorHandler };