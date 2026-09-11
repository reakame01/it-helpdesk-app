import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { TicketsService } from "./tickets.service";
import { CreateTicketRequestDto } from "./dto/create-ticket.dto";
import { CreateQuickLogRequestDto } from "./dto/create-quick-log.dto";
import { HardDeleteTicketRequestDto } from "./dto/hard-delete-ticket.dto";
import { UpdateTicketRequestDto } from "./dto/update-ticket.dto";
import { ReportTicketRequestDto } from "./dto/report-ticket.dto";
import { AddTicketCollaboratorRequestDto } from "./dto/add-collaborator.dto";
import {
  ApproveAndCloseTokenRequestDto,
  ReportIssueTokenRequestDto,
  ReopenTicketRequestDto,
  ReopenTicketTokenRequestDto,
  UpdateTicketProgressRequestDto,
} from "./dto/token-actions.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser, type AuthedUser } from "../auth/current-user.decorator";

const evidenceUpload = FilesInterceptor("attachments", 10, {
  storage: memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

@Controller("tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  findAll(@Query("status") status?: string) {
    return this.ticketsService.findAll(status);
  }

  @Get("board")
  listBoard() {
    return this.ticketsService.listBoard();
  }

  @Get("confirm-token")
  peekConfirmToken(@Query("token") token?: string) {
    return this.ticketsService.peekConfirmToken(token ?? "");
  }

  @Post("process-token-expiry")
  processTokenExpiry() {
    return this.ticketsService.processTokenExpiry();
  }

  @UseGuards(JwtAuthGuard)
  @Post("quick-log")
  quickLog(
    @CurrentUser() actor: AuthedUser,
    @Body() dto: CreateQuickLogRequestDto,
  ) {
    if (!actor?.userId) {
      throw new UnauthorizedException();
    }
    return this.ticketsService.quickLog(actor, dto);
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

  @Get(":id/worklogs")
  listWorklogs(@Param("id") id: string) {
    return this.ticketsService.listWorklogs(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id/worklogs/:worklogId")
  editProgressWorklog(
    @Param("id") id: string,
    @Param("worklogId") worklogId: string,
    @CurrentUser() actor: AuthedUser,
    @Body() dto: UpdateTicketProgressRequestDto,
  ) {
    if (!actor?.userId) {
      throw new UnauthorizedException();
    }
    return this.ticketsService.editProgressWorklog(
      id,
      worklogId,
      actor,
      dto.percent,
      dto.note,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id/worklogs/:worklogId")
  deleteProgressWorklog(
    @Param("id") id: string,
    @Param("worklogId") worklogId: string,
    @CurrentUser() actor: AuthedUser,
  ) {
    if (!actor?.userId) {
      throw new UnauthorizedException();
    }
    return this.ticketsService.deleteProgressWorklog(id, worklogId, actor);
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

  @UseGuards(JwtAuthGuard)
  @Post(":id/claim")
  claim(@Param("id") id: string, @CurrentUser() actor: AuthedUser) {
    if (!actor?.userId) {
      throw new UnauthorizedException();
    }
    return this.ticketsService.claim(id, actor);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/withdraw")
  withdraw(@Param("id") id: string, @CurrentUser() actor: AuthedUser) {
    if (!actor?.userId) {
      throw new UnauthorizedException();
    }
    return this.ticketsService.withdraw(id, actor);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/collaborators")
  addCollaborator(
    @Param("id") id: string,
    @CurrentUser() actor: AuthedUser,
    @Body() dto: AddTicketCollaboratorRequestDto,
  ) {
    if (!actor?.userId) {
      throw new UnauthorizedException();
    }
    return this.ticketsService.addCollaborator(id, actor, dto.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id/collaborators/:userId")
  removeCollaborator(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @CurrentUser() actor: AuthedUser,
  ) {
    if (!actor?.userId) {
      throw new UnauthorizedException();
    }
    return this.ticketsService.removeCollaborator(id, actor, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/send-for-user-test")
  sendForUserTest(@Param("id") id: string, @CurrentUser() actor: AuthedUser) {
    if (!actor?.userId) {
      throw new UnauthorizedException();
    }
    return this.ticketsService.sendForUserTest(id, actor);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/approve-and-close")
  approveAndClose(@Param("id") id: string, @CurrentUser() actor: AuthedUser) {
    if (!actor?.userId) {
      throw new UnauthorizedException();
    }
    return this.ticketsService.approveAndClose(id, actor);
  }

  @Post(":id/approve-and-close-token")
  approveAndCloseToken(
    @Param("id") id: string,
    @Body() dto: ApproveAndCloseTokenRequestDto,
  ) {
    return this.ticketsService.approveAndCloseWithToken(id, dto.token);
  }

  @Post(":id/report-issue-token")
  @UseInterceptors(evidenceUpload)
  reportIssueToken(
    @Param("id") id: string,
    @Body() dto: ReportIssueTokenRequestDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.ticketsService.reportIssueWithToken(
      id,
      dto.token,
      dto.reason,
      files ?? [],
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/reopen")
  @UseInterceptors(evidenceUpload)
  reopen(
    @Param("id") id: string,
    @CurrentUser() actor: AuthedUser,
    @Body() dto: ReopenTicketRequestDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    if (!actor?.userId) {
      throw new UnauthorizedException();
    }
    return this.ticketsService.reopen(id, actor, dto.reason, files ?? []);
  }

  @Post(":id/reopen-token")
  @UseInterceptors(evidenceUpload)
  reopenToken(
    @Param("id") id: string,
    @Body() dto: ReopenTicketTokenRequestDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.ticketsService.reopenWithToken(
      id,
      dto.token,
      dto.reason,
      files ?? [],
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/resend-confirm")
  resendConfirm(@Param("id") id: string, @CurrentUser() actor: AuthedUser) {
    if (!actor?.userId) {
      throw new UnauthorizedException();
    }
    return this.ticketsService.resendConfirm(id, actor);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id/progress")
  updateProgress(
    @Param("id") id: string,
    @CurrentUser() actor: AuthedUser,
    @Body() dto: UpdateTicketProgressRequestDto,
  ) {
    if (!actor?.userId) {
      throw new UnauthorizedException();
    }
    return this.ticketsService.updateProgress(id, actor, dto.percent, dto.note);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateTicketRequestDto) {
    return this.ticketsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  hardDelete(
    @Param("id") id: string,
    @CurrentUser() actor: AuthedUser,
    @Body() dto: HardDeleteTicketRequestDto,
  ) {
    if (!actor?.userId) {
      throw new UnauthorizedException();
    }
    return this.ticketsService.hardDelete(id, actor, dto.confirmation);
  }
}
