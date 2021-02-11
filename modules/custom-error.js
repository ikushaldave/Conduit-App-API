module.exports = function customError(errorCode, detail, message, status) {
	return {
		message,
		status,
		detail,
		errorCode,
	};
};
