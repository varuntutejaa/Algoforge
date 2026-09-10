// Serverless entrypoint. Vercel routes every request here (see vercel.json)
// and drives the Express app directly — server.js only binds a port when it
// is run as a standalone process.
module.exports = require('../server');
