import type { Request, Response } from "express";
import userService from "./user.service.js";


export class UserController {
    async getAllUsers(_req: Request, res: Response) {
        const users = await userService.getAll();
        res.status(200).json({
            success: true, data: users
        });
    }

    async createUser()
}
