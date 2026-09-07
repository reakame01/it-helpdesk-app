import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import type { AuthUserDto } from "@helpdesk/types";
import { UsersService } from "../users/users.service";
import { LoginRequestDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginRequestDto): Promise<AuthUserDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const profile = await this.usersService.findById(user.id);
    if (!profile) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const expiresIn = this.config.get<string>("JWT_EXPIRES_IN", "7d");
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: profile,
      tokens: {
        accessToken,
        tokenType: "Bearer",
        expiresIn,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }
}
