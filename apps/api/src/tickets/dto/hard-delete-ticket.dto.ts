import { IsString, MinLength } from "class-validator";

export class HardDeleteTicketRequestDto {
  @IsString()
  @MinLength(1)
  confirmation!: string;
}
