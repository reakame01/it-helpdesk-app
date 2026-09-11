import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateQuickLogRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  departmentCode!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  issue!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  resolve!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  requesterName?: string;
}
