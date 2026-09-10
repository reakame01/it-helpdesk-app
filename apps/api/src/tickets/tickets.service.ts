import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketType,
  UserRole,
  type TicketAttachmentDto,
  type TicketDto,
} from "@helpdesk/types";
import {
  TicketCategory as PrismaCategory,
  TicketPriority as PrismaPriority,
  TicketStatus as PrismaStatus,
  TicketType as PrismaType,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTicketRequestDto } from "./dto/create-ticket.dto";
import { UpdateTicketRequestDto } from "./dto/update-ticket.dto";
import { ReportTicketRequestDto } from "./dto/report-ticket.dto";
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from "../storage/application/ports/object-storage.port";
import { Inject } from "@nestjs/common";

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
    assignedAt: Date;
    user?: {
      id: string;
      name: string;
      email: string;
      role: string;
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
  ) {}

  async findAll(status?: string): Promise<TicketDto[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: status ? { status: status as PrismaStatus } : undefined,
      include: this.defaultInclude(),
      orderBy: { createdAt: "desc" },
    });
    return tickets.map((t) => this.toDto(t));
  }

  async findById(id: string): Promise<TicketDto | null> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: this.defaultInclude(),
    });
    return ticket ? this.toDto(ticket) : null;
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
              create: dto.assigneeIds.map((userId) => ({ userId })),
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
              create: dto.assigneeIds.map((userId) => ({ userId })),
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
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      attachments: {
        orderBy: { createdAt: "asc" as const },
      },
    };
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
        assignedAt: a.assignedAt.toISOString(),
        user: a.user
          ? {
              id: a.user.id,
              name: a.user.name,
              email: a.user.email,
              role: a.user.role as UserRole,
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
}
