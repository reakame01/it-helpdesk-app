import { IsInt, IsString, Max, Min, MinLength } from "class-validator";

export class ApproveAndCloseTokenRequestDto {
  @IsString()
  @MinLength(1)
  token!: string;
}

export class ReportIssueTokenRequestDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(1)
  reason!: string;
}

export class ReopenTicketRequestDto {
  @IsString()
  @MinLength(1)
  reason!: string;
}

export class ReopenTicketTokenRequestDto {
  @IsString()
  @MinLength(1)
  token!: string;

  @IsString()
  @MinLength(1)
  reason!: string;
}

export class UpdateTicketProgressRequestDto {
  @IsInt()
  @Min(0)
  @Max(100)
  percent!: number;

  @IsString()
  @MinLength(1)
  note!: string;
}
