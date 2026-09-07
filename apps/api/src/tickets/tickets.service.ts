import { Injectable, NotFoundException } from "@nestjs/common";
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketType,
  UserRole,
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

type TicketWithRelations = {
  id: string;
  title: string;
  description: string;
  category: PrismaCategory;
  status: PrismaStatus;
  priority: PrismaPriority;
  type: PrismaType;
  requesterId: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  requester?: {
    id: string;
    name: string;
    email: string;
    department: string | null;
  };
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
};

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: string): Promise<TicketDto[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: status ? { status: status as PrismaStatus } : undefined,
      include: {
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
      },
      orderBy: { createdAt: "desc" },
    });
    return tickets.map((t) => this.toDto(t));
  }

  async findById(id: string): Promise<TicketDto | null> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
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
      },
    });
    return ticket ? this.toDto(ticket) : null;
  }

  async create(dto: CreateTicketRequestDto): Promise<TicketDto> {
    const ticket = await this.prisma.ticket.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category as unknown as PrismaCategory,
        priority: dto.priority as unknown as PrismaPriority,
        type: (dto.type ?? TicketType.STANDARD) as unknown as PrismaType,
        requesterId: dto.requesterId,
        assignees: dto.assigneeIds?.length
          ? {
              create: dto.assigneeIds.map((userId) => ({ userId })),
            }
          : undefined,
      },
      include: {
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
      },
    });
    return this.toDto(ticket);
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
      include: {
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
      },
    });

    return this.toDto(ticket);
  }

  private toDto(ticket: TicketWithRelations): TicketDto {
    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category as unknown as TicketCategory,
      status: ticket.status as unknown as TicketStatus,
      priority: ticket.priority as unknown as TicketPriority,
      type: ticket.type as unknown as TicketType,
      requesterId: ticket.requesterId,
      requester: ticket.requester,
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
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    };
  }
}
