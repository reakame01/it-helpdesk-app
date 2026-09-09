import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { AuthService } from "./auth.service";
import { LoginRequestDto } from "./dto/login.dto";
import { UpdateOwnProfileRequestDto } from "./dto/update-own-profile.dto";
import { ChangeOwnPasswordRequestDto } from "./dto/change-own-password.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { UpdateOwnProfileUseCase } from "../users/application/use-cases/update-own-profile.use-case";
import { ChangeOwnPasswordUseCase } from "../users/application/use-cases/change-own-password.use-case";
import {
  DeleteOwnAvatarUseCase,
  UploadOwnAvatarUseCase,
} from "../users/application/use-cases/upload-own-avatar.use-case";
import { mapUserError } from "../users/infrastructure/http/map-user-error";
import { toUserDto } from "../users/infrastructure/http/user.presenter";
import { InvalidAvatarFileError } from "../users/domain/errors";

type AuthedRequest = { user: { userId: string } };

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly updateOwnProfile: UpdateOwnProfileUseCase,
    private readonly changeOwnPassword: ChangeOwnPasswordUseCase,
    private readonly uploadOwnAvatar: UploadOwnAvatarUseCase,
    private readonly deleteOwnAvatar: DeleteOwnAvatarUseCase,
  ) {}

  @Post("login")
  login(@Body() dto: LoginRequestDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() req: AuthedRequest) {
    return this.authService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("me")
  async updateMe(
    @Req() req: AuthedRequest,
    @Body() body: UpdateOwnProfileRequestDto,
  ) {
    try {
      const user = await this.updateOwnProfile.execute({
        userId: req.user.userId,
        ...body,
      });
      return toUserDto(user);
    } catch (error) {
      mapUserError(error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("me/password")
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Req() req: AuthedRequest,
    @Body() body: ChangeOwnPasswordRequestDto,
  ) {
    try {
      await this.changeOwnPassword.execute({
        userId: req.user.userId,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      });
    } catch (error) {
      mapUserError(error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("me/avatar")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(
    @Req() req: AuthedRequest,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    try {
      if (!file) {
        throw new InvalidAvatarFileError("Avatar file is required");
      }
      const user = await this.uploadOwnAvatar.execute({
        userId: req.user.userId,
        buffer: file.buffer,
        mimeType: file.mimetype,
        originalName: file.originalname,
      });
      return toUserDto(user);
    } catch (error) {
      mapUserError(error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete("me/avatar")
  async deleteAvatar(@Req() req: AuthedRequest) {
    try {
      const user = await this.deleteOwnAvatar.execute(req.user.userId);
      return toUserDto(user);
    } catch (error) {
      mapUserError(error);
    }
  }
}
