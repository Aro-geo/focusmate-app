const authRegister = require('./auth-register.js');

async function handler(req, res) {
  return authRegister(req, res);
}

module.exports = handler;
module.exports.default = handler;