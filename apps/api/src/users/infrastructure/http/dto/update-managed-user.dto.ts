import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

const MANAGED_ROLES = ["IT_STAFF", "SUPERVISOR", "IT_MANAGER"] as const;

export class UpdateManagedUserRequestDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nameTh?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nameEn?: string;

  @IsOptional()
  @IsIn(MANAGED_ROLES)
  role?: (typeof MANAGED_ROLES)[number];

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  employeeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  jobTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  extension?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  mobile?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
