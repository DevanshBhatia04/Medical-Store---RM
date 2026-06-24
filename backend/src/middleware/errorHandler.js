function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  const details = [];

  if (err.code && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      statusCode = 409;
      const target = err.meta?.target ? err.meta.target.join(', ') : 'field';
      message = `Unique constraint violation on ${target}`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    }
  }

  if (err.name === 'ValidationError' || err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation error';
    if (err.errors) {
      for (const e of err.errors) {
        details.push(e.message || e);
      }
    }
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(statusCode).json({ error: message, details });
}

module.exports = errorHandler;
