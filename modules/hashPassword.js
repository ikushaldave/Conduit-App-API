const bcrypt = require("bcrypt")

module.exports = async function (password) {
	return await bcrypt.hash(password, 12);
}
