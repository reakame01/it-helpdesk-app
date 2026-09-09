import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/jwt-auth.guard";
import { CreateManagedUserUseCase } from "../../application/use-cases/create-managed-user.use-case";
import { DeleteManagedUserUseCase } from "../../application/use-cases/delete-managed-user.use-case";
import { ListManagedUsersUseCase } from "../../application/use-cases/list-managed-users.use-case";
import { ListOnDutyStaffUseCase } from "../../application/use-cases/list-on-duty-staff.use-case";
import { ResetManagedUserPasswordUseCase } from "../../application/use-cases/reset-managed-user-password.use-case";
import { UpdateManagedUserUseCase } from "../../application/use-cases/update-managed-user.use-case";
import { USER_REPOSITORY } from "../../application/ports/user.repository";
import type { UserRepository } from "../../application/ports/user.repository";
import { CreateManagedUserRequestDto } from "./dto/create-managed-user.dto";
import { ResetManagedUserPasswordRequestDto } from "./dto/reset-password.dto";
import { UpdateManagedUserRequestDto } from "./dto/update-managed-user.dto";
import { mapUserError } from "./map-user-error";
import { toOnDutyStaffDto, toUserDto } from "./user.presenter";

@Controller("users")
export class UsersController {
  constructor(
    private readonly listUsers: ListManagedUsersUseCase,
    private readonly listOnDutyStaff: ListOnDutyStaffUseCase,
    private readonly createUser: CreateManagedUserUseCase,
    private readonly updateUser: UpdateManagedUserUseCase,
    private readonly resetPassword: ResetManagedUserPasswordUseCase,
    private readonly deleteUser: DeleteManagedUserUseCase,
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  /** Public portal roster — no auth. Must be declared before `:id`. */
  @Get("on-duty")
  async findOnDuty() {
    try {
      const users = await this.listOnDutyStaff.execute();
      return users.map(toOnDutyStaffDto);
    } catch (error) {
      mapUserError(error);
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    try {
      const users = await this.listUsers.execute();
      return users.map(toUserDto);
    } catch (error) {
      mapUserError(error);
    }
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async findOne(@Param("id") id: string) {
    try {
      const user = await this.users.findById(id);
      if (!user || !user.managedRole || user.deletedAt) {
        throw new NotFoundException(`User ${id} not found`);
      }
      return toUserDto(user);
    } catch (error) {
      mapUserError(error);
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: CreateManagedUserRequestDto) {
    try {
      const user = await this.createUser.execute(body);
      return toUserDto(user);
    } catch (error) {
      mapUserError(error);
    }
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  async update(
    @Param("id") id: string,
    @Body() body: UpdateManagedUserRequestDto,
  ) {
    try {
      const user = await this.updateUser.execute({
        userId: id,
        ...body,
      });
      return toUserDto(user);
    } catch (error) {
      mapUserError(error);
    }
  }

  @Post(":id/reset-password")
  @UseGuards(JwtAuthGuard)
  async reset(
    @Param("id") id: string,
    @Body() body: ResetManagedUserPasswordRequestDto,
  ) {
    try {
      const result = await this.resetPassword.execute({
        userId: id,
        password: body.password,
      });
      return {
        user: toUserDto(result.user),
        temporaryPassword: result.temporaryPassword,
      };
    } catch (error) {
      mapUserError(error);
    }
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param("id") id: string,
    @Req() req: { user: { userId: string } },
  ) {
    try {
      await this.deleteUser.execute({
        userId: id,
        actorId: req.user.userId,
      });
    } catch (error) {
      mapUserError(error);
    }
  }
}
