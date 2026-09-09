import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateOwnProfileRequestDto {
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
}
