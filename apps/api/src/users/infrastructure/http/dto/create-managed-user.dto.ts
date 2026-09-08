import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

const MANAGED_ROLES = ["IT_STAFF", "SUPERVISOR", "GM"] as const;

export class CreateManagedUserRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nameTh!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nameEn!: string;

  @IsIn(MANAGED_ROLES)
  role!: (typeof MANAGED_ROLES)[number];

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  employeeId!: string;

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
