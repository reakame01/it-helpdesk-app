import { IsString } from "class-validator";

export class AddTicketCollaboratorRequestDto {
  @IsString()
  userId!: string;
}
