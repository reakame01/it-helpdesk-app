import type { UserDto } from "@helpdesk/types";
import { UserRole } from "@helpdesk/types";
import type { User } from "../../domain/user.entity";

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    nameTh: user.nameTh,
    nameEn: user.nameEn,
    role: user.role as UserRole,
    employeeId: user.employeeId,
    jobTitle: user.jobTitle,
    extension: user.extension,
    mobile: user.mobile,
    avatarUrl: user.avatarUrl,
    department: user.department,
    isActive: user.isActive,
    lastSignInAt: user.lastSignInAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
