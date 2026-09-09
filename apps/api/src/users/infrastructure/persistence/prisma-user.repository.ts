import { Injectable } from "@nestjs/common";
import { UserRole as PrismaUserRole, type User as PrismaUser } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { MANAGED_USER_ROLES } from "../../domain/errors";
import { User, type UserAuthRecord } from "../../domain/user.entity";
import type {
  CreateUserPersistInput,
  UpdateUserPersistInput,
  UserRepository,
} from "../../application/ports/user.repository";

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listManagedUsers(): Promise<User[]> {
    const rows = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        role: {
          in: [...MANAGED_USER_ROLES] as PrismaUserRole[],
        },
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findAuthByEmail(email: string): Promise<UserAuthRecord | null> {
    const row = await this.prisma.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role,
      isActive: row.isActive,
    };
  }

  async findAuthById(id: string): Promise<UserAuthRecord | null> {
    const row = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role,
      isActive: row.isActive,
    };
  }

  async existsEmail(email: string, excludeId?: string): Promise<boolean> {
    const row = await this.prisma.user.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async existsEmployeeId(
    employeeId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const row = await this.prisma.user.findFirst({
      where: {
        employeeId,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async create(input: CreateUserPersistInput): Promise<User> {
    const row = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        nameTh: input.nameTh,
        nameEn: input.nameEn,
        role: input.role as PrismaUserRole,
        employeeId: input.employeeId,
        jobTitle: input.jobTitle ?? null,
        extension: input.extension ?? null,
        mobile: input.mobile ?? null,
        avatarUrl: input.avatarUrl ?? null,
        isActive: input.isActive ?? true,
      },
    });
    return this.toDomain(row);
  }

  async update(id: string, input: UpdateUserPersistInput): Promise<User> {
    const row = await this.prisma.user.update({
      where: { id },
      data: {
        email: input.email,
        name: input.name,
        nameTh: input.nameTh,
        nameEn: input.nameEn,
        role: input.role as PrismaUserRole | undefined,
        employeeId: input.employeeId,
        jobTitle: input.jobTitle,
        extension: input.extension,
        mobile: input.mobile,
        avatarUrl: input.avatarUrl,
        isActive: input.isActive,
      },
    });
    return this.toDomain(row);
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async touchLastSignIn(id: string, at = new Date()): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastSignInAt: at },
    });
  }

  async softDelete(id: string, deletedAt = new Date()): Promise<void> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) return;

    // Free unique email / employeeId so a new account can reuse them later.
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt,
        isActive: false,
        email: `deleted.${id}@deleted.invalid`,
        employeeId: null,
      },
    });
  }

  private toDomain(row: PrismaUser): User {
    return new User({
      id: row.id,
      email: row.email,
      name: row.name,
      nameTh: row.nameTh,
      nameEn: row.nameEn,
      role: row.role,
      employeeId: row.employeeId,
      jobTitle: row.jobTitle,
      extension: row.extension,
      mobile: row.mobile,
      avatarUrl: row.avatarUrl,
      department: row.department,
      isActive: row.isActive,
      lastSignInAt: row.lastSignInAt,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
