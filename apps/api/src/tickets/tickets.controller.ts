import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { TicketsService } from "./tickets.service";
import { CreateTicketRequestDto } from "./dto/create-ticket.dto";
import { UpdateTicketRequestDto } from "./dto/update-ticket.dto";
import { ReportTicketRequestDto } from "./dto/report-ticket.dto";

@Controller("tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  findAll(@Query("status") status?: string) {
    return this.ticketsService.findAll(status);
  }

  @Post("report")
  @UseInterceptors(
    FilesInterceptor("attachments", 10, {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  report(
    @Body() dto: ReportTicketRequestDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.ticketsService.report(dto, files ?? []);
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
