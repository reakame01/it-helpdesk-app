import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from "../../application/ports/object-storage.port";

@Controller("files")
export class FilesController {
  constructor(
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  @Get("avatars/:userId/:filename")
  async getAvatar(
    @Param("userId") userId: string,
    @Param("filename") filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const key = `avatars/${userId}/${filename}`;
    await this.sendObject(key, res);
  }

  @Get("attachments/:ticketId/:filename")
  async getAttachment(
    @Param("ticketId") ticketId: string,
    @Param("filename") filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const key = `attachments/${ticketId}/${filename}`;
    await this.sendObject(key, res);
  }

  private async sendObject(key: string, res: Response): Promise<void> {
    const object = await this.storage.get(key);
    if (!object) {
      throw new NotFoundException("File not found");
    }
    res.setHeader("Content-Type", object.contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(object.body);
  }
}
