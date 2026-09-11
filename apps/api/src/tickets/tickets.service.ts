import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  AssigneeRole,
  ConfirmTokenStage,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketType,
  UserRole,
  type BoardAssigneeDto,
  type BoardTicketDto,
  type ConfirmTokenPeekDto,
  type TicketAttachmentDto,
  type TicketDto,
  type WorklogDto,
} from "@helpdesk/types";
import {
  TicketCategory as PrismaCategory,
  TicketPriority as PrismaPriority,
  TicketStatus as PrismaStatus,
  TicketType as PrismaType,
  Prisma,
} from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTicketRequestDto } from "./dto/create-ticket.dto";
import { CreateQuickLogRequestDto } from "./dto/create-quick-log.dto";
import { UpdateTicketRequestDto } from "./dto/update-ticket.dto";
import { ReportTicketRequestDto } from "./dto/report-ticket.dto";
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from "../storage/application/ports/object-storage.port";
import { MAILER, type Mailer } from "../mail/mailer.port";
import {
  mapTicketToBoardColumn,
  ticketHasLead,
} from "./board-column.mapping";
import {
  decideAddCollaborator,
  decideApproveAndClose,
  decideClaim,
  decideHardDelete,
  decideProgressUpdate,
  decideProgressWorklogDelete,
  decideProgressWorklogEdit,
  decideQuickLog,
  decideRemoveCollaborator,
  decideReportIssue,
  decideReopen,
  decideResend,
  decideSendForUserTest,
  decideWithdraw,
  expiryActionForStage,
  formatProgressWorklogNote,
  formatQuickLogDescription,
  isAssigneeOf,
  isLeadOf,
  isProgressWorklogNote,
  latestProgressPercent,
  nextLeadUserIdAfterWithdraw,
  quickLogRequesterName,
  tokenAllowedActions,
} from "./ticket-lifecycle.rules";
import type { AuthedUser } from "../auth/current-user.decorator";
import {
  buildConfirmDeepLink,
  hashConfirmToken,
  issueConfirmTokenPlain,
  type ConfirmTokenStage as TokenStage,
} from "./user-confirm-token";

const CATEGORY_CODE_TO_ENUM: Record<string, TicketCategory> = {
  hardware: TicketCategory.HARDWARE,
  network: TicketCategory.NETWORK,
  software: TicketCategory.SOFTWARE_BUG,
  feature_request: TicketCategory.FEATURE_REQUEST,
  access: TicketCategory.ACCESS,
  other: TicketCategory.OTHER,
};

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const MAX_ATTACHMENT_COUNT = 10;
const ALLOWED_ATTACHMENT_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};

type TicketWithRelations = {
  id: string;
  ticketNo: string;
  title: string;
  description: string;
  category: PrismaCategory;
  categoryCode: string;
  status: PrismaStatus;
  priority: PrismaPriority;
  type: PrismaType;
  requesterId: string | null;
  requesterName: string;
  requesterEmail: string;
  departmentCode: string;
  extension: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  progress?: number | null;
  reopenBrokenSuccess?: boolean;
  requester?: {
    id: string;
    name: string;
    email: string;
    department: string | null;
  } | null;
  assignees?: Array<{
    id: string;
    ticketId: string;
    userId: string;
    role?: string;
    assignedAt: Date;
    user?: {
      id: string;
      name: string;
      email: string;
      role: string;
      jobTitle?: string | null;
    };
  }>;
  attachments?: Array<{
    id: string;
    ticketId: string;
    publicPath: string;
    contentType: string;
    size: number;
    originalName: string | null;
    createdAt: Date;
  }>;
};

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(MAILER) private readonly mailer: Mailer,
    private readonly config: ConfigService,
  ) {}

  private confirmTokens() {
    const repo = (
      this.prisma as unknown as {
        userConfirmToken?: {
          findUnique: (args: Record<string, unknown>) => Promise<{
            id: string;
            ticketId: string;
            tokenHash: string;
            stage: string;
            expiresAt: Date;
            consumedAt: Date | null;
            invalidatedAt: Date | null;
          } | null>;
          findMany: (args: Record<string, unknown>) => Promise<
            Array<{
              id: string;
              ticketId: string;
              stage: string;
              expiresAt: Date;
              ticket: {
                ticketNo: string;
                status: string;
                resolvedAt: Date | null;
                assignees: Array<{
                  user?: { email?: string | null } | null;
                }>;
              };
            }>
          >;
          create: (args: Record<string, unknown>) => Promise<unknown>;
          update: (args: Record<string, unknown>) => Promise<unknown>;
          updateMany: (args: Record<string, unknown>) => Promise<unknown>;
        };
      }
    ).userConfirmToken;
    if (!repo) {
      throw new BadRequestException(
        "Prisma Client is missing UserConfirmToken. Run prisma migrate deploy and prisma generate.",
      );
    }
    return repo;
  }

  private hasConfirmTokenModel(): boolean {
    return Boolean(
      (this.prisma as unknown as { userConfirmToken?: unknown }).userConfirmToken,
    );
  }

  async findAll(status?: string): Promise<TicketDto[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: status ? { status: status as PrismaStatus } : undefined,
      include: this.defaultInclude(),
      orderBy: { createdAt: "desc" },
    });
    return tickets.map((t) => this.toDto(t));
  }

  async listBoard(): Promise<BoardTicketDto[]> {
    try {
      if (this.hasConfirmTokenModel()) {
        await this.processTokenExpiry();
      }
    } catch (error) {
      console.warn(
        "Skipping token expiry while listing the board",
        error instanceof Error ? error.message : error,
      );
    }
    const tickets = await this.prisma.ticket.findMany({
      include: this.defaultInclude(),
      orderBy: { createdAt: "desc" },
    });
    return tickets.map((ticket) => this.toBoardDto(ticket));
  }

  async claim(ticketId: string, actor: AuthedUser): Promise<BoardTicketDto> {
    const ticket = await this.requireTicket(ticketId);
    const decision = decideClaim({
      actorRole: actor.role,
      hasLead: ticketHasLead(ticket.assignees),
    });
    if (decision === "unauthorized") {
      throw new ForbiddenException("IT session required to Claim a Board Card");
    }
    if (decision === "already_has_lead") {
      throw new ConflictException("This Board Card already has a Lead");
    }
    const existing = ticket.assignees?.find((row) => row.userId === actor.userId);
    if (existing) {
      await this.prisma.ticketAssignee.update({
        where: { id: existing.id },
        data: { role: "LEAD" } as never,
      });
    } else {
      await this.prisma.ticketAssignee.create({
        data: {
          ticketId,
          userId: actor.userId,
          role: "LEAD",
        } as never,
      });
    }
    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "IN_PROGRESS" as PrismaStatus },
      include: this.defaultInclude(),
    });
    return this.toBoardDto(updated);
  }

  async withdraw(
    ticketId: string,
    actor: AuthedUser,
  ): Promise<BoardTicketDto> {
    const ticket = await this.requireTicket(ticketId);
    const decision = decideWithdraw({
      status: ticket.status,
      isAssignee: this.isAssignee(ticket, actor.userId),
    });
    if (decision === "unauthorized") {
      throw new ForbiddenException("Only an Assignee can withdraw from this ticket");
    }
    if (decision === "wrong_status") {
      throw new BadRequestException(
        "Withdraw is only allowed while the ticket is in progress",
      );
    }
    const assignees = ticket.assignees ?? [];
    const actorRow = assignees.find((row) => row.userId === actor.userId);
    if (!actorRow) {
      throw new ForbiddenException("Only an Assignee can withdraw from this ticket");
    }
    const successorUserId = nextLeadUserIdAfterWithdraw(assignees, actor.userId);
    const returningToBacklog = successorUserId === null;
    const promoting = Boolean(successorUserId) && actorRow.role === "LEAD";

    await this.prisma.$transaction(async (tx) => {
      if (promoting && successorUserId) {
        await tx.ticketAssignee.update({
          where: {
            ticketId_userId: { ticketId, userId: successorUserId },
          },
          data: { role: "LEAD" } as never,
        });
      }
      await tx.ticketAssignee.delete({
        where: { ticketId_userId: { ticketId, userId: actor.userId } },
      });
      if (returningToBacklog) {
        await tx.ticket.update({
          where: { id: ticketId },
          data: { status: "OPEN" as PrismaStatus },
        });
      }
    });
    await this.writeAudit({
      actorId: actor.userId,
      action: "WITHDRAW",
      ticketId,
      metadata: {
        successorUserId,
        returnedToBacklog: returningToBacklog,
      },
    });
    return this.toBoardDto(await this.requireTicket(ticketId));
  }

  async addCollaborator(
    ticketId: string,
    actor: AuthedUser,
    userId: string,
  ): Promise<BoardTicketDto> {
    const ticket = await this.requireTicket(ticketId);
    const alreadyAssigned = (ticket.assignees ?? []).some(
      (row) => row.userId === userId,
    );
    const decision = decideAddCollaborator({
      actorRole: actor.role,
      hasLead: ticketHasLead(ticket.assignees),
      alreadyAssigned,
      isLead: isLeadOf(ticket.assignees ?? [], actor.userId),
    });
    if (decision === "unauthorized") {
      throw new ForbiddenException("Only the Lead can add a Collaborator");
    }
    if (decision === "no_lead") {
      throw new BadRequestException("Claim a Lead before adding Collaborators");
    }
    if (decision === "already_assigned") {
      throw new ConflictException("That person is already assigned to this ticket");
    }
    const teammate = await this.prisma.user.findFirst({
      where: {
        id: userId,
        isActive: true,
        deletedAt: null,
        role: { in: ["IT_STAFF", "SUPERVISOR", "IT_MANAGER"] },
      },
      select: { id: true },
    });
    if (!teammate) {
      throw new BadRequestException("Collaborator must be an active IT user");
    }
    await this.prisma.ticketAssignee.create({
      data: {
        ticketId,
        userId,
        role: "COLLABORATOR",
      } as never,
    });
    await this.writeAudit({
      actorId: actor.userId,
      action: "ADD_COLLABORATOR",
      ticketId,
      metadata: { userId },
    });
    const updated = await this.requireTicket(ticketId);
    return this.toBoardDto(updated);
  }

  async removeCollaborator(
    ticketId: string,
    actor: AuthedUser,
    userId: string,
  ): Promise<BoardTicketDto> {
    const ticket = await this.requireTicket(ticketId);
    const target = (ticket.assignees ?? []).find((row) => row.userId === userId);
    if (!target) {
      throw new NotFoundException("That person is not assigned to this ticket");
    }
    const decision = decideRemoveCollaborator({
      isLead: isLeadOf(ticket.assignees ?? [], actor.userId),
      targetIsCollaborator: target.role === "COLLABORATOR",
    });
    if (decision === "unauthorized") {
      throw new ForbiddenException("Only the Lead can remove a Collaborator");
    }
    if (decision === "wrong_kind") {
      throw new BadRequestException("The Lead cannot be removed this way");
    }
    await this.prisma.ticketAssignee.delete({
      where: { ticketId_userId: { ticketId, userId } },
    });
    await this.writeAudit({
      actorId: actor.userId,
      action: "REMOVE_COLLABORATOR",
      ticketId,
      metadata: { userId },
    });
    return this.toBoardDto(await this.requireTicket(ticketId));
  }

  async peekConfirmToken(plain: string): Promise<ConfirmTokenPeekDto> {
    const row = await this.findActiveConfirmToken(plain);
    if (!row) {
      throw new BadRequestException("User Confirm Token is invalid or expired");
    }
    return {
      ticketId: row.ticketId,
      stage: row.stage as ConfirmTokenStage,
      allowedActions: tokenAllowedActions(row.stage as TokenStage),
      expiresAt: row.expiresAt.toISOString(),
    };
  }

  async sendForUserTest(
    ticketId: string,
    actor: AuthedUser,
  ): Promise<BoardTicketDto> {
    const ticket = await this.requireTicket(ticketId);
    const decision = decideSendForUserTest({
      status: ticket.status,
      isAssignee: this.isAssignee(ticket, actor.userId),
    });
    this.assertLifecycle(decision);
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "AWAITING_USER_TEST" as PrismaStatus },
    });
    await this.issueConfirmTokenAndMail(ticketId, "AWAITING_USER_TEST");
    await this.writeAudit({
      actorId: actor.userId,
      action: "SEND_FOR_USER_TEST",
      ticketId,
      metadata: { actorKind: "ASSIGNEE" },
    });
    return this.toBoardDto(await this.requireTicket(ticketId));
  }

  async approveAndClose(
    ticketId: string,
    actor: AuthedUser,
  ): Promise<BoardTicketDto> {
    return this.completeApproveAndClose(ticketId, {
      actorId: actor.userId,
      isAssignee: this.isAssignee(await this.requireTicket(ticketId), actor.userId),
      tokenValidForAwaiting: false,
      consumeTokenId: null,
    });
  }

  async approveAndCloseWithToken(
    ticketId: string,
    plain: string,
  ): Promise<BoardTicketDto> {
    const row = await this.requireActiveToken(plain, ticketId, "AWAITING_USER_TEST");
    return this.completeApproveAndClose(ticketId, {
      actorId: null,
      isAssignee: false,
      tokenValidForAwaiting: true,
      consumeTokenId: row.id,
    });
  }

  async reportIssueWithToken(
    ticketId: string,
    plain: string,
    reason: string,
    files: Express.Multer.File[] = [],
  ): Promise<BoardTicketDto> {
    const ticket = await this.requireTicket(ticketId);
    const row = await this.requireActiveToken(plain, ticketId, "AWAITING_USER_TEST");
    const decision = decideReportIssue({
      status: ticket.status,
      tokenValidForAwaiting: true,
      reason,
    });
    this.assertLifecycle(decision);
    this.assertAttachmentBatch(files);
    await this.confirmTokens().update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    });
    await this.invalidateUnusedTokens(ticketId, "AWAITING_USER_TEST");
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "IN_PROGRESS" as PrismaStatus },
    });
    await this.saveAttachments(ticketId, files);
    await this.writeAudit({
      actorId: null,
      action: "REPORT_ISSUE",
      ticketId,
      metadata: { actorKind: "REQUESTER_TOKEN", reason: reason.trim() },
    });
    return this.toBoardDto(await this.requireTicket(ticketId));
  }

  async reopen(
    ticketId: string,
    actor: AuthedUser,
    reason: string,
    files: Express.Multer.File[] = [],
  ): Promise<BoardTicketDto> {
    const ticket = await this.requireTicket(ticketId);
    return this.completeReopen(ticket, {
      actorId: actor.userId,
      isAssignee: this.isAssignee(ticket, actor.userId),
      tokenValidForResolved: false,
      consumeTokenId: null,
      reason,
      files,
    });
  }

  async reopenWithToken(
    ticketId: string,
    plain: string,
    reason: string,
    files: Express.Multer.File[] = [],
  ): Promise<BoardTicketDto> {
    const ticket = await this.requireTicket(ticketId);
    const row = await this.requireActiveToken(plain, ticketId, "RESOLVED");
    return this.completeReopen(ticket, {
      actorId: null,
      isAssignee: false,
      tokenValidForResolved: true,
      consumeTokenId: row.id,
      reason,
      files,
    });
  }

  async resendConfirm(
    ticketId: string,
    actor: AuthedUser,
  ): Promise<BoardTicketDto> {
    const ticket = await this.requireTicket(ticketId);
    const decision = decideResend({
      status: ticket.status,
      isAssignee: this.isAssignee(ticket, actor.userId),
    });
    this.assertLifecycle(decision);
    const stage =
      ticket.status === "RESOLVED" ? "RESOLVED" : "AWAITING_USER_TEST";
    await this.issueConfirmTokenAndMail(ticketId, stage);
    await this.writeAudit({
      actorId: actor.userId,
      action: "RESEND_CONFIRM",
      ticketId,
      metadata: { actorKind: "ASSIGNEE", stage },
    });
    return this.toBoardDto(await this.requireTicket(ticketId));
  }

  async updateProgress(
    ticketId: string,
    actor: AuthedUser,
    percent: number,
    note: string,
  ): Promise<BoardTicketDto> {
    const ticket = await this.requireTicket(ticketId);
    const decision = decideProgressUpdate({
      category: ticket.category,
      isAssignee: this.isAssignee(ticket, actor.userId),
      percent,
      note,
    });
    this.assertLifecycle(decision);
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { progress: percent } as never,
    });
    await this.prisma.worklog.create({
      data: {
        ticketId,
        authorId: actor.userId,
        note: formatProgressWorklogNote(percent, note),
        minutesSpent: 0,
      },
    });
    await this.writeAudit({
      actorId: actor.userId,
      action: "UPDATE_PROGRESS",
      ticketId,
      metadata: { percent, note: note.trim() },
    });
    return this.toBoardDto(await this.requireTicket(ticketId));
  }

  async processTokenExpiry(): Promise<{ processed: number }> {
    const now = new Date();
    const expired = await this.confirmTokens().findMany({
      where: {
        consumedAt: null,
        invalidatedAt: null,
        expiresAt: { lte: now },
      },
      include: {
        ticket: {
          include: {
            assignees: {
              include: {
                user: { select: { email: true, name: true } },
              },
            },
          },
        },
      },
    });
    for (const row of expired) {
      await this.confirmTokens().update({
        where: { id: row.id },
        data: { invalidatedAt: now },
      });
      const action = expiryActionForStage(row.stage as TokenStage);
      if (action === "close") {
        if (row.ticket.status === "RESOLVED") {
          await this.prisma.ticket.update({
            where: { id: row.ticketId },
            data: {
              status: "CLOSED" as PrismaStatus,
              resolvedAt: row.ticket.resolvedAt ?? now,
            },
          });
          await this.writeAudit({
            actorId: null,
            action: "TOKEN_EXPIRED_CLOSED",
            ticketId: row.ticketId,
            metadata: { stage: row.stage },
          });
        }
        continue;
      }
      if (row.ticket.status === "AWAITING_USER_TEST") {
        const emails = row.ticket.assignees
          .map((assignee) => assignee.user?.email)
          .filter((email): email is string => Boolean(email));
        if (emails.length > 0) {
          await this.mailer.send({
            to: emails,
            subject: `[IT Helpdesk] ลิงก์ยืนยันของ ${row.ticket.ticketNo} หมดอายุ`,
            text: `ลิงก์ User Confirm Token ของงาน ${row.ticket.ticketNo} หมดอายุแล้ว ตั๋วยังอยู่ใน Awaiting User Test กรุณา Resend หรือ Approve and Close`,
          });
        }
        await this.writeAudit({
          actorId: null,
          action: "TOKEN_EXPIRED_NOTIFY",
          ticketId: row.ticketId,
          metadata: { stage: row.stage },
        });
      }
    }
    return { processed: expired.length };
  }

  async findById(id: string): Promise<TicketDto | null> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: this.defaultInclude(),
    });
    return ticket ? this.toDto(ticket) : null;
  }

  async listWorklogs(ticketId: string): Promise<WorklogDto[]> {
    await this.requireTicket(ticketId);
    const rows = await this.prisma.worklog.findMany({
      where: { ticketId },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      ticketId: row.ticketId,
      authorId: row.authorId,
      author: row.author,
      note: row.note,
      minutesSpent: row.minutesSpent,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async editProgressWorklog(
    ticketId: string,
    worklogId: string,
    actor: AuthedUser,
    percent: number,
    note: string,
  ): Promise<BoardTicketDto> {
    const ticket = await this.requireTicket(ticketId);
    const worklog = await this.requireProgressWorklog(ticketId, worklogId);
    const decision = decideProgressWorklogEdit({
      category: ticket.category,
      isAssignee: this.isAssignee(ticket, actor.userId),
      isProgressNote: isProgressWorklogNote(worklog.note),
      percent,
      note,
    });
    this.assertLifecycle(decision);
    await this.prisma.worklog.update({
      where: { id: worklog.id },
      data: { note: formatProgressWorklogNote(percent, note) },
    });
    await this.syncTicketProgressFromWorklogs(ticketId);
    await this.writeAudit({
      actorId: actor.userId,
      action: "EDIT_PROGRESS",
      ticketId,
      metadata: { worklogId, percent, note: note.trim() },
    });
    return this.toBoardDto(await this.requireTicket(ticketId));
  }

  async deleteProgressWorklog(
    ticketId: string,
    worklogId: string,
    actor: AuthedUser,
  ): Promise<BoardTicketDto> {
    const ticket = await this.requireTicket(ticketId);
    const worklog = await this.requireProgressWorklog(ticketId, worklogId);
    const decision = decideProgressWorklogDelete({
      category: ticket.category,
      isAssignee: this.isAssignee(ticket, actor.userId),
      isProgressNote: isProgressWorklogNote(worklog.note),
    });
    this.assertLifecycle(decision);
    await this.prisma.worklog.delete({ where: { id: worklog.id } });
    await this.syncTicketProgressFromWorklogs(ticketId);
    await this.writeAudit({
      actorId: actor.userId,
      action: "DELETE_PROGRESS",
      ticketId,
      metadata: { worklogId },
    });
    return this.toBoardDto(await this.requireTicket(ticketId));
  }

  async create(dto: CreateTicketRequestDto): Promise<TicketDto> {
    const requester = await this.prisma.user.findUnique({
      where: { id: dto.requesterId },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        extension: true,
      },
    });
    if (!requester) {
      throw new BadRequestException("Requester user not found");
    }

    const categoryCode = this.enumToCategoryCode(dto.category);
    const ticketNo = await this.nextTicketNo();

    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNo,
        title: dto.title,
        description: dto.description,
        category: dto.category as unknown as PrismaCategory,
        categoryCode,
        priority: dto.priority as unknown as PrismaPriority,
        type: (dto.type ?? TicketType.STANDARD) as unknown as PrismaType,
        requesterId: requester.id,
        requesterName: requester.name,
        requesterEmail: requester.email,
        departmentCode: requester.department?.trim() || "unknown",
        extension: requester.extension?.trim() || "-",
        assignees: dto.assigneeIds?.length
          ? {
              create: dto.assigneeIds.map((userId, index) => ({
                userId,
                role: index === 0 ? "LEAD" : "COLLABORATOR",
              })),
            }
          : undefined,
      },
      include: this.defaultInclude(),
    });
    return this.toDto(ticket);
  }

  async report(
    dto: ReportTicketRequestDto,
    files: Express.Multer.File[] = [],
  ): Promise<TicketDto> {
    const departmentCode = dto.departmentCode.trim();
    const categoryCode = dto.categoryCode.trim();

    await this.assertActiveReferenceCode("departments", departmentCode);
    await this.assertActiveReferenceCode("categories", categoryCode);

    const category = CATEGORY_CODE_TO_ENUM[categoryCode];
    if (!category) {
      throw new BadRequestException(`Unsupported category code: ${categoryCode}`);
    }

    const priority =
      dto.priority === "urgent" ? TicketPriority.HIGH : TicketPriority.MEDIUM;

    if (files.length > MAX_ATTACHMENT_COUNT) {
      throw new BadRequestException(
        `At most ${MAX_ATTACHMENT_COUNT} images can be attached`,
      );
    }
    for (const file of files) {
      this.assertValidAttachment(file);
    }

    const ticketNo = await this.nextTicketNo();
    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNo,
        title: dto.title.trim(),
        description: dto.description.trim(),
        category: category as unknown as PrismaCategory,
        categoryCode,
        priority: priority as unknown as PrismaPriority,
        type: TicketType.STANDARD as unknown as PrismaType,
        requesterName: dto.requesterName.trim(),
        requesterEmail: dto.requesterEmail.trim().toLowerCase(),
        departmentCode,
        extension: dto.extension.trim(),
      },
      include: this.defaultInclude(),
    });

    for (const file of files) {
      const ext = ALLOWED_ATTACHMENT_MIME[file.mimetype];
      const key = `attachments/${ticket.id}/${randomUUID()}.${ext}`;
      const stored = await this.storage.put({
        key,
        body: file.buffer,
        contentType: file.mimetype,
      });
      await this.prisma.ticketAttachment.create({
        data: {
          ticketId: ticket.id,
          storageKey: stored.key,
          publicPath: stored.publicPath,
          contentType: stored.contentType,
          size: stored.size,
          originalName: file.originalname || null,
        },
      });
    }

    const reloaded = await this.prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: this.defaultInclude(),
    });
    if (!reloaded) {
      throw new NotFoundException(`Ticket ${ticket.id} not found after create`);
    }
    return this.toDto(reloaded);
  }

  async quickLog(
    actor: AuthedUser,
    dto: CreateQuickLogRequestDto,
  ): Promise<BoardTicketDto> {
    const decision = decideQuickLog({
      actorRole: actor.role,
      departmentCode: dto.departmentCode,
      issue: dto.issue,
      resolve: dto.resolve,
    });
    if (decision === "unauthorized") {
      throw new ForbiddenException("IT session required to Quick Log");
    }
    if (decision === "invalid_department") {
      throw new BadRequestException("A department is required");
    }
    if (decision === "invalid_issue") {
      throw new BadRequestException("An issue description is required");
    }
    if (decision === "invalid_resolve") {
      throw new BadRequestException("A resolution is required");
    }

    const departmentCode = dto.departmentCode.trim();
    const issue = dto.issue.trim();
    const resolve = dto.resolve.trim();
    await this.assertActiveReferenceCode("departments", departmentCode);

    const now = new Date();
    const ticketNo = await this.nextTicketNo();
    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNo,
        title: issue,
        description: formatQuickLogDescription(issue, resolve),
        category: TicketCategory.OTHER as unknown as PrismaCategory,
        categoryCode: "other",
        priority: TicketPriority.MEDIUM as unknown as PrismaPriority,
        type: TicketType.QUICK_TICKET as unknown as PrismaType,
        status: TicketStatus.CLOSED as unknown as PrismaStatus,
        resolvedAt: now,
        requesterName: quickLogRequesterName(dto.requesterName),
        requesterEmail: "",
        departmentCode,
        extension: "-",
        assignees: {
          create: {
            userId: actor.userId,
            role: "LEAD",
          } as never,
        },
        worklogs: {
          create: {
            authorId: actor.userId,
            note: resolve,
            minutesSpent: 0,
          },
        },
      },
      include: this.defaultInclude(),
    });

    await this.writeAudit({
      actorId: actor.userId,
      action: "QUICK_LOG",
      ticketId: ticket.id,
      metadata: { ticketNo, departmentCode },
    });

    return this.toBoardDto(ticket);
  }

  async hardDelete(
    ticketId: string,
    actor: AuthedUser,
    confirmation: string,
  ): Promise<{ ok: true; ticketNo: string }> {
    const ticket = await this.requireTicket(ticketId);
    const decision = decideHardDelete({
      actorRole: actor.role,
      confirmation,
      ticketNo: ticket.ticketNo,
    });
    if (decision === "unauthorized") {
      throw new ForbiddenException("IT session required to Hard Delete a ticket");
    }
    if (decision === "invalid_confirmation") {
      throw new BadRequestException("Type the ticket number to confirm Hard Delete");
    }

    const files = await this.prisma.ticketAttachment.findMany({
      where: { ticketId },
      select: { storageKey: true },
    });
    for (const file of files) {
      await this.storage.delete(file.storageKey);
    }

    await this.prisma.$transaction([
      this.prisma.auditLog.deleteMany({
        where: { entityType: "Ticket", entityId: ticketId },
      }),
      this.prisma.ticket.delete({ where: { id: ticketId } }),
    ]);

    await this.writeAudit({
      actorId: actor.userId,
      action: "HARD_DELETE",
      ticketId,
      metadata: { ticketNo: ticket.ticketNo },
    });

    return { ok: true, ticketNo: ticket.ticketNo };
  }

  async update(id: string, dto: UpdateTicketRequestDto): Promise<TicketDto> {
    const existing = await this.prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }

    if (dto.assigneeIds) {
      await this.prisma.ticketAssignee.deleteMany({ where: { ticketId: id } });
    }

    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category as unknown as PrismaCategory | undefined,
        categoryCode: dto.category
          ? this.enumToCategoryCode(dto.category)
          : undefined,
        status: dto.status as unknown as PrismaStatus | undefined,
        priority: dto.priority as unknown as PrismaPriority | undefined,
        resolvedAt:
          dto.status === TicketStatus.RESOLVED ||
          dto.status === TicketStatus.CLOSED
            ? new Date()
            : undefined,
        assignees: dto.assigneeIds
          ? {
              create: dto.assigneeIds.map((userId, index) => ({
                userId,
                role: index === 0 ? "LEAD" : "COLLABORATOR",
              })),
            }
          : undefined,
      },
      include: this.defaultInclude(),
    });

    return this.toDto(ticket);
  }

  private defaultInclude() {
    return {
      requester: {
        select: { id: true, name: true, email: true, department: true },
      },
      assignees: {
        orderBy: { assignedAt: "asc" as const },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              nameTh: true,
              nameEn: true,
              email: true,
              role: true,
              jobTitle: true,
            },
          },
        },
      },
      attachments: {
        orderBy: { createdAt: "asc" as const },
      },
    };
  }

  private async requireTicket(id: string): Promise<TicketWithRelations> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: this.defaultInclude(),
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }
    return ticket;
  }

  private isAssignee(ticket: TicketWithRelations, userId: string): boolean {
    return isAssigneeOf(
      (ticket.assignees ?? []).map((row) => row.userId),
      userId,
    );
  }

  private async requireProgressWorklog(ticketId: string, worklogId: string) {
    const worklog = await this.prisma.worklog.findFirst({
      where: { id: worklogId, ticketId },
    });
    if (!worklog) {
      throw new NotFoundException(`Progress update ${worklogId} not found`);
    }
    return worklog;
  }

  private async syncTicketProgressFromWorklogs(ticketId: string): Promise<void> {
    const rows = await this.prisma.worklog.findMany({
      where: { ticketId },
      orderBy: { createdAt: "desc" },
      select: { note: true },
    });
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { progress: latestProgressPercent(rows.map((row) => row.note)) } as never,
    });
  }

  private assertLifecycle(
    decision:
      | "ok"
      | "unauthorized"
      | "wrong_status"
      | "invalid_reason"
      | "wrong_category"
      | "invalid_percent"
      | "invalid_note"
      | "wrong_kind"
      | { ok: true; actorKind: string }
      | { ok: false; reason: string },
  ): void {
    const code =
      typeof decision === "string"
        ? decision
        : decision.ok
          ? "ok"
          : decision.reason;
    if (code === "ok") return;
    if (code === "unauthorized") {
      throw new ForbiddenException("Not allowed to perform this ticket action");
    }
    if (code === "wrong_status") {
      throw new BadRequestException("Action is not allowed in this ticket stage");
    }
    if (code === "invalid_reason") {
      throw new BadRequestException("A reason is required");
    }
    if (code === "wrong_category") {
      throw new BadRequestException(
        "Development Progress is only for Feature Request tickets",
      );
    }
    if (code === "invalid_percent") {
      throw new BadRequestException("Progress must be an integer from 0 to 100");
    }
    if (code === "invalid_note") {
      throw new BadRequestException("A progress note is required");
    }
    if (code === "wrong_kind") {
      throw new BadRequestException(
        "Only Development Progress updates can be edited or deleted",
      );
    }
    throw new BadRequestException("Action is not allowed");
  }

  private async completeApproveAndClose(
    ticketId: string,
    input: {
      actorId: string | null;
      isAssignee: boolean;
      tokenValidForAwaiting: boolean;
      consumeTokenId: string | null;
    },
  ): Promise<BoardTicketDto> {
    const ticket = await this.requireTicket(ticketId);
    const decision = decideApproveAndClose({
      status: ticket.status,
      isAssignee: input.isAssignee,
      tokenValidForAwaiting: input.tokenValidForAwaiting,
    });
    this.assertLifecycle(decision);
    if (!decision.ok) {
      throw new ForbiddenException("Not allowed to Approve and Close");
    }
    const now = new Date();
    if (input.consumeTokenId) {
      await this.confirmTokens().update({
        where: { id: input.consumeTokenId },
        data: { consumedAt: now },
      });
    }
    await this.invalidateUnusedTokens(ticketId, "AWAITING_USER_TEST");
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "RESOLVED" as PrismaStatus,
        resolvedAt: now,
        reopenBrokenSuccess: false,
      } as never,
    });
    await this.writeAudit({
      actorId: input.actorId,
      action: "APPROVE_AND_CLOSE",
      ticketId,
      metadata: { actorKind: decision.actorKind },
    });
    await this.issueConfirmTokenAndMail(ticketId, "RESOLVED");
    return this.toBoardDto(await this.requireTicket(ticketId));
  }

  private async completeReopen(
    ticket: TicketWithRelations,
    input: {
      actorId: string | null;
      isAssignee: boolean;
      tokenValidForResolved: boolean;
      consumeTokenId: string | null;
      reason: string;
      files: Express.Multer.File[];
    },
  ): Promise<BoardTicketDto> {
    const decision = decideReopen({
      status: ticket.status,
      isAssignee: input.isAssignee,
      tokenValidForResolved: input.tokenValidForResolved,
      reason: input.reason,
    });
    this.assertLifecycle(decision);
    if (!decision.ok) {
      throw new ForbiddenException("Not allowed to Reopen");
    }
    this.assertAttachmentBatch(input.files);
    const now = new Date();
    if (input.consumeTokenId) {
      await this.confirmTokens().update({
        where: { id: input.consumeTokenId },
        data: { consumedAt: now },
      });
    }
    await this.invalidateUnusedTokens(ticket.id, "RESOLVED");
    await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "IN_PROGRESS" as PrismaStatus,
        reopenBrokenSuccess: true,
        resolvedAt: null,
      } as never,
    });
    await this.saveAttachments(ticket.id, input.files);
    if (input.actorId) {
      await this.prisma.worklog.create({
        data: {
          ticketId: ticket.id,
          authorId: input.actorId,
          note: input.reason.trim(),
          minutesSpent: 0,
        },
      });
    }
    await this.writeAudit({
      actorId: input.actorId,
      action: "REOPEN",
      ticketId: ticket.id,
      metadata: {
        actorKind: decision.actorKind,
        reason: input.reason.trim(),
      },
    });
    return this.toBoardDto(await this.requireTicket(ticket.id));
  }

  private async issueConfirmTokenAndMail(
    ticketId: string,
    stage: TokenStage,
  ): Promise<void> {
    const ticket = await this.requireTicket(ticketId);
    await this.invalidateUnusedTokens(ticketId, stage);
    const issued = issueConfirmTokenPlain();
    await this.confirmTokens().create({
      data: {
        ticketId,
        tokenHash: issued.tokenHash,
        stage: stage as never,
        expiresAt: issued.expiresAt,
      },
    });
    const link = buildConfirmDeepLink({
      webBaseUrl: this.config.get<string>("WEB_URL") ?? "http://localhost:3000",
      locale: "th",
      ticketId,
      token: issued.plain,
    });
    const awaiting = stage === "AWAITING_USER_TEST";
    await this.mailer.send({
      to: ticket.requesterEmail,
      subject: awaiting
        ? `[IT Helpdesk] โปรดทดสอบงาน ${ticket.ticketNo}`
        : `[IT Helpdesk] งาน ${ticket.ticketNo} อยู่ใน Resolved`,
      text: awaiting
        ? `กรุณาเปิดลิงก์นี้เพื่อทดสอบและยืนยันงาน ${ticket.ticketNo}:\n${link}\n\nลิงก์มีอายุ 1 ชั่วโมง`
        : `งาน ${ticket.ticketNo} อยู่ใน Resolved หากยังมีปัญหาให้เปิดลิงก์นี้เพื่อ Reopen:\n${link}\n\nลิงก์มีอายุ 1 ชั่วโมง`,
    });
  }

  private async invalidateUnusedTokens(
    ticketId: string,
    stage: TokenStage,
  ): Promise<void> {
    await this.confirmTokens().updateMany({
      where: {
        ticketId,
        stage: stage as never,
        consumedAt: null,
        invalidatedAt: null,
      },
      data: { invalidatedAt: new Date() },
    });
  }

  private async findActiveConfirmToken(plain: string) {
    const tokenHash = hashConfirmToken(plain);
    const row = await this.confirmTokens().findUnique({
      where: { tokenHash },
    });
    if (
      !row ||
      row.consumedAt ||
      row.invalidatedAt ||
      row.expiresAt.getTime() <= Date.now()
    ) {
      return null;
    }
    return row;
  }

  private async requireActiveToken(
    plain: string,
    ticketId: string,
    stage: TokenStage,
  ) {
    const row = await this.findActiveConfirmToken(plain);
    if (!row || row.ticketId !== ticketId || row.stage !== stage) {
      throw new BadRequestException("User Confirm Token is invalid or expired");
    }
    return row;
  }

  private async writeAudit(input: {
    actorId: string | null;
    action: string;
    ticketId: string;
    metadata: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: "Ticket",
        entityId: input.ticketId,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });
  }

  private assertAttachmentBatch(files: Express.Multer.File[]): void {
    if (files.length > MAX_ATTACHMENT_COUNT) {
      throw new BadRequestException(
        `At most ${MAX_ATTACHMENT_COUNT} images can be attached`,
      );
    }
    for (const file of files) {
      this.assertValidAttachment(file);
    }
  }

  private async saveAttachments(
    ticketId: string,
    files: Express.Multer.File[],
  ): Promise<void> {
    for (const file of files) {
      const ext = ALLOWED_ATTACHMENT_MIME[file.mimetype];
      const key = `attachments/${ticketId}/${randomUUID()}.${ext}`;
      const stored = await this.storage.put({
        key,
        body: file.buffer,
        contentType: file.mimetype,
      });
      await this.prisma.ticketAttachment.create({
        data: {
          ticketId,
          storageKey: stored.key,
          publicPath: stored.publicPath,
          contentType: stored.contentType,
          size: stored.size,
          originalName: file.originalname || null,
        },
      });
    }
  }

  private async assertActiveReferenceCode(
    catalogCode: string,
    itemCode: string,
  ): Promise<void> {
    const item = await this.prisma.referenceItem.findFirst({
      where: {
        code: itemCode,
        isActive: true,
        catalog: { code: catalogCode },
      },
      select: { id: true },
    });
    if (!item) {
      throw new BadRequestException(
        `Invalid or inactive ${catalogCode} code: ${itemCode}`,
      );
    }
  }

  private assertValidAttachment(file: Express.Multer.File): void {
    if (!ALLOWED_ATTACHMENT_MIME[file.mimetype]) {
      throw new BadRequestException("Attachment must be JPEG or PNG");
    }
    if (!file.buffer?.length) {
      throw new BadRequestException("Attachment file is empty");
    }
    if (file.size > MAX_ATTACHMENT_BYTES || file.buffer.length > MAX_ATTACHMENT_BYTES) {
      throw new BadRequestException("Attachment must be 2 MB or smaller");
    }
  }

  private async nextTicketNo(): Promise<string> {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const dayKey = `${y}${m}${d}`;
    const prefix = `#IT-${dayKey}-`;

    const start = new Date(y, now.getMonth(), now.getDate());
    const end = new Date(y, now.getMonth(), now.getDate() + 1);

    const count = await this.prisma.ticket.count({
      where: {
        createdAt: { gte: start, lt: end },
      },
    });

    return `${prefix}${String(count + 1).padStart(4, "0")}`;
  }

  private enumToCategoryCode(category: TicketCategory | string): string {
    switch (category) {
      case TicketCategory.HARDWARE:
      case "HARDWARE":
        return "hardware";
      case TicketCategory.NETWORK:
      case "NETWORK":
        return "network";
      case TicketCategory.SOFTWARE_BUG:
      case "SOFTWARE_BUG":
        return "software";
      case TicketCategory.FEATURE_REQUEST:
      case "FEATURE_REQUEST":
        return "feature_request";
      case TicketCategory.ACCESS:
      case "ACCESS":
        return "access";
      default:
        return "other";
    }
  }

  private toDto(ticket: TicketWithRelations): TicketDto {
    return {
      id: ticket.id,
      ticketNo: ticket.ticketNo,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category as unknown as TicketCategory,
      categoryCode: ticket.categoryCode,
      status: ticket.status as unknown as TicketStatus,
      priority: ticket.priority as unknown as TicketPriority,
      type: ticket.type as unknown as TicketType,
      requesterId: ticket.requesterId,
      requesterName: ticket.requesterName,
      requesterEmail: ticket.requesterEmail,
      departmentCode: ticket.departmentCode,
      extension: ticket.extension,
      requester: ticket.requester ?? undefined,
      assignees: ticket.assignees?.map((a) => ({
        id: a.id,
        ticketId: a.ticketId,
        userId: a.userId,
        role: (a.role === "LEAD" ? AssigneeRole.LEAD : AssigneeRole.COLLABORATOR),
        assignedAt: a.assignedAt.toISOString(),
        user: a.user
          ? {
              id: a.user.id,
              name: a.user.name,
              email: a.user.email,
              role: a.user.role as UserRole,
              jobTitle: a.user.jobTitle ?? null,
            }
          : undefined,
      })),
      attachments: ticket.attachments?.map(
        (a): TicketAttachmentDto => ({
          id: a.id,
          ticketId: a.ticketId,
          publicPath: a.publicPath,
          contentType: a.contentType,
          size: a.size,
          originalName: a.originalName,
          createdAt: a.createdAt.toISOString(),
        }),
      ),
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    };
  }

  private toBoardDto(ticket: TicketWithRelations): BoardTicketDto {
    const assignees = [...(ticket.assignees ?? [])]
      .sort((a, b) => {
        const delta = a.assignedAt.getTime() - b.assignedAt.getTime();
        if (delta !== 0) return delta;
        return a.userId.localeCompare(b.userId);
      })
      .map((row) => this.toBoardAssignee(row));
    const lead = assignees.find((row) => row.role === AssigneeRole.LEAD) ?? null;
    const collaborators = assignees.filter(
      (row) => row.role === AssigneeRole.COLLABORATOR,
    );
    return {
      id: ticket.id,
      ticketNo: ticket.ticketNo,
      title: ticket.title,
      description: ticket.description,
      column: mapTicketToBoardColumn({
        status: ticket.status,
        hasLead: ticketHasLead(ticket.assignees),
      }),
      status: ticket.status as unknown as TicketStatus,
      category: ticket.category as unknown as TicketCategory,
      categoryCode: ticket.categoryCode,
      priority: ticket.priority as unknown as TicketPriority,
      departmentCode: ticket.departmentCode,
      requesterName: ticket.requesterName,
      requesterEmail: ticket.requesterEmail,
      extension: ticket.extension,
      lead,
      collaborators,
      attachments: ticket.attachments?.map(
        (a): TicketAttachmentDto => ({
          id: a.id,
          ticketId: a.ticketId,
          publicPath: a.publicPath,
          contentType: a.contentType,
          size: a.size,
          originalName: a.originalName,
          createdAt: a.createdAt.toISOString(),
        }),
      ) ?? [],
      progress: ticket.progress ?? null,
      type: (ticket.type as unknown as TicketType) ?? TicketType.STANDARD,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    };
  }

  private toBoardAssignee(row: NonNullable<TicketWithRelations["assignees"]>[number]): BoardAssigneeDto {
    const role =
      row.role === "LEAD" ? AssigneeRole.LEAD : AssigneeRole.COLLABORATOR;
    return {
      userId: row.userId,
      name: row.user?.name ?? row.userId,
      email: row.user?.email ?? "",
      role,
      jobTitle: row.user?.jobTitle ?? null,
    };
  }
}
