const bcrypt = require("bcryptjs");

module.exports = async function (password) {
	return await bcrypt.hash(password, 12);
};
