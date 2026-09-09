import {
  IsEmail,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class ReportTicketRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  requesterName!: string;

  @IsEmail()
  @MaxLength(200)
  requesterEmail!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  departmentCode!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  extension!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  categoryCode!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;

  @IsIn(["normal", "urgent"])
  priority!: "normal" | "urgent";
}
