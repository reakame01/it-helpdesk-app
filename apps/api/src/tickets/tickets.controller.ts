import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  NotFoundException,
} from "@nestjs/common";
import { TicketsService } from "./tickets.service";
import { CreateTicketRequestDto } from "./dto/create-ticket.dto";
import { UpdateTicketRequestDto } from "./dto/update-ticket.dto";

@Controller("tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  findAll(@Query("status") status?: string) {
    return this.ticketsService.findAll(status);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const ticket = await this.ticketsService.findById(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }
    return ticket;
  }

  @Post()
  create(@Body() dto: CreateTicketRequestDto) {
    return this.ticketsService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateTicketRequestDto) {
    return this.ticketsService.update(id, dto);
  }
}
