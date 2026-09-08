import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import type { AuthUserDto } from "@helpdesk/types";
import { LoginRequestDto } from "./dto/login.dto";
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from "../users/application/ports/password-hasher";
import {
  USER_REPOSITORY,
  type UserRepository,
} from "../users/application/ports/user.repository";
import { toUserDto } from "../users/infrastructure/http/user.presenter";

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginRequestDto): Promise<AuthUserDto> {
    const auth = await this.users.findAuthByEmail(dto.email);
    if (!auth || !auth.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await this.passwords.compare(dto.password, auth.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const profile = await this.users.findById(auth.id);
    if (!profile) {
      throw new UnauthorizedException("Invalid credentials");
    }

    await this.users.touchLastSignIn(auth.id);

    const expiresIn = this.config.get<string>("JWT_EXPIRES_IN", "7d");
    const accessToken = await this.jwtService.signAsync({
      sub: auth.id,
      email: auth.email,
      role: auth.role,
    });

    return {
      user: toUserDto(profile),
      tokens: {
        accessToken,
        tokenType: "Bearer",
        expiresIn,
      },
    };
  }

    async getProfile(userId: string) {
    const user = await this.users.findById(userId);
    if (!user || user.deletedAt) {
      throw new UnauthorizedException();
    }
    return toUserDto(user);
  }

  async validateUser(userId: string) {
    const user = await this.users.findById(userId);
    if (!user || user.deletedAt) {
      return null;
    }
    return user;
  }
}
