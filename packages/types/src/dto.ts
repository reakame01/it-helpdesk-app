import type {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketType,
  UserRole,
} from "./enums";

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketAssigneeDto {
  id: string;
  ticketId: string;
  userId: string;
  user?: Pick<UserDto, "id" | "name" | "email" | "role">;
  assignedAt: string;
}

export interface TicketDto {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  requesterId: string;
  requester?: Pick<UserDto, "id" | "name" | "email" | "department">;
  assignees?: TicketAssigneeDto[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

export interface WorklogDto {
  id: string;
  ticketId: string;
  authorId: string;
  author?: Pick<UserDto, "id" | "name" | "email">;
  note: string;
  minutesSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuickTicketApprovalDto {
  id: string;
  ticketId: string;
  requestedById: string;
  approvedById?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason?: string | null;
  decidedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogDto {
  id: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreateTicketDto {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  type?: TicketType;
  assigneeIds?: string[];
}

export interface UpdateTicketDto {
  title?: string;
  description?: string;
  category?: TicketCategory;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeIds?: string[];
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokensDto {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
}

export interface AuthUserDto {
  user: UserDto;
  tokens: AuthTokensDto;
}

export interface ApiErrorDto {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface HealthCheckDto {
  status: "ok" | "error";
  timestamp: string;
  uptime: number;
}
