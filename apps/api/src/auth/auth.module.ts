import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UsersModule } from "../users/users.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from "../users/application/ports/password-hasher";
import {
  USER_REPOSITORY,
  type UserRepository,
} from "../users/application/ports/user.repository";
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from "../storage/application/ports/object-storage.port";
import { UpdateOwnProfileUseCase } from "../users/application/use-cases/update-own-profile.use-case";
import { ChangeOwnPasswordUseCase } from "../users/application/use-cases/change-own-password.use-case";
import {
  DeleteOwnAvatarUseCase,
  UploadOwnAvatarUseCase,
} from "../users/application/use-cases/upload-own-avatar.use-case";

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET", "change-me"),
        signOptions: {
          expiresIn: config.get("JWT_EXPIRES_IN", "7d") as `${number}d`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: UpdateOwnProfileUseCase,
      useFactory: (repo: UserRepository) => new UpdateOwnProfileUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: ChangeOwnPasswordUseCase,
      useFactory: (repo: UserRepository, hasher: PasswordHasher) =>
        new ChangeOwnPasswordUseCase(repo, hasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: UploadOwnAvatarUseCase,
      useFactory: (repo: UserRepository, storage: ObjectStorage) =>
        new UploadOwnAvatarUseCase(repo, storage),
      inject: [USER_REPOSITORY, OBJECT_STORAGE],
    },
    {
      provide: DeleteOwnAvatarUseCase,
      useFactory: (repo: UserRepository, storage: ObjectStorage) =>
        new DeleteOwnAvatarUseCase(repo, storage),
      inject: [USER_REPOSITORY, OBJECT_STORAGE],
    },
  ],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
