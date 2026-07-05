// Wraps an async route/controller so thrown errors and rejected promises are
// forwarded to Express's error-handling middleware instead of crashing the
// process or hanging the request.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
