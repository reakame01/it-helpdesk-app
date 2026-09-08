import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class UpdateReferenceItemRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  labelTh?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  labelEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
