import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import {
  TicketCategory,
  TicketPriority,
  TicketType,
} from "@helpdesk/types";

export class CreateTicketRequestDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsEnum(TicketCategory)
  category!: TicketCategory;

  @IsEnum(TicketPriority)
  priority!: TicketPriority;

  @IsOptional()
  @IsEnum(TicketType)
  type?: TicketType;

  @IsString()
  requesterId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];
}
