class ExpressError extends Error {
  constructor(status, message) {
    super(message); // Pass message to the Error class
    this.status = status;
  }
}

module.exports = ExpressError;
