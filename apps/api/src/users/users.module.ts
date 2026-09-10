import { Module } from "@nestjs/common";
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from "./application/ports/password-hasher";
import {
  USER_REPOSITORY,
  type UserRepository,
} from "./application/ports/user.repository";
import { CreateManagedUserUseCase } from "./application/use-cases/create-managed-user.use-case";
import { DeleteManagedUserUseCase } from "./application/use-cases/delete-managed-user.use-case";
import { ListManagedUsersUseCase } from "./application/use-cases/list-managed-users.use-case";
import { ListOnDutyStaffUseCase } from "./application/use-cases/list-on-duty-staff.use-case";
import { ResetManagedUserPasswordUseCase } from "./application/use-cases/reset-managed-user-password.use-case";
import { UpdateManagedUserUseCase } from "./application/use-cases/update-managed-user.use-case";
import { BcryptPasswordHasher } from "./infrastructure/crypto/bcrypt-password-hasher";
import { UsersController } from "./infrastructure/http/users.controller";
import { PrismaUserRepository } from "./infrastructure/persistence/prisma-user.repository";

@Module({
  controllers: [UsersController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: ListManagedUsersUseCase,
      useFactory: (repo: UserRepository) => new ListManagedUsersUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: ListOnDutyStaffUseCase,
      useFactory: (repo: UserRepository) => new ListOnDutyStaffUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: CreateManagedUserUseCase,
      useFactory: (repo: UserRepository, hasher: PasswordHasher) =>
        new CreateManagedUserUseCase(repo, hasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: UpdateManagedUserUseCase,
      useFactory: (repo: UserRepository) => new UpdateManagedUserUseCase(repo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: ResetManagedUserPasswordUseCase,
      useFactory: (repo: UserRepository, hasher: PasswordHasher) =>
        new ResetManagedUserPasswordUseCase(repo, hasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: DeleteManagedUserUseCase,
      useFactory: (repo: UserRepository) => new DeleteManagedUserUseCase(repo),
      inject: [USER_REPOSITORY],
    },
  ],
  exports: [USER_REPOSITORY, PASSWORD_HASHER],
})
export class UsersModule {}
