const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

module.exports = async (body) => {
	try {
		const client = new S3Client({ region: "ap-south-1", credentials: { secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, accessKeyId: process.env.AWS_ACCESS_ID } });
		const command = new PutObjectCommand({ ACL: "public-read", Bucket: "conduit-app", ...body });
		const output = await client.send(command);
		return true;
	} catch (error) {
		return false;
	}
};
