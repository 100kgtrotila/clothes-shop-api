import type { Request, Response } from "express";
import multer from "multer";
import { AppError } from "../../errors/app.error.js";
import { uploadFileToS3 } from "./upload.service.js";

export class UploadController {
	async uploadImage(req: Request, res: Response) {
		if (!req.file) {
			throw new AppError("No file uploaded", 400);
		}

		const imageUrl = await uploadFileToS3(
			req.file.buffer,
			req.file.originalname,
			req.file.mimetype,
		);

		res.status(200).json({
			success: true,
			data: {
				url: imageUrl,
			},
		});
	}
}

export default new UploadController();
