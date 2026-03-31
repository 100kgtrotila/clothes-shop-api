import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const s3Client = new S3Client({
	region: process.env.AWS_REGION!,
	endpoint: process.env.AWS_ENDPOINT!,
	forcePathStyle: true,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

export const uploadFileToS3 = async (
	fileBuffer: Buffer,
	fileName: string,
	mimetype: string,
): Promise<string> => {
	const safeFileName = fileName
		.replace(/\s+/g, "-")
		.replace(/[^a-zA-Z0-9.\-]/g, "");

	const uniqueFileName = `${crypto.randomBytes(16).toString("hex")}-${safeFileName}`;

	const bucketName = process.env.AWS_S3_BUCKET_NAME!;

	const command = new PutObjectCommand({
		Bucket: bucketName,
		Key: uniqueFileName,
		Body: fileBuffer,
		ContentType: mimetype,
	});

	await s3Client.send(command);

	return `${process.env.AWS_ENDPOINT}/${bucketName}/${uniqueFileName}`;
};
