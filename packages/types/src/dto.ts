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
  nameTh?: string | null;
  nameEn?: string | null;
  role: UserRole;
  employeeId?: string | null;
  jobTitle?: string | null;
  extension?: string | null;
  mobile?: string | null;
  avatarUrl?: string | null;
  department?: string | null;
  isActive: boolean;
  lastSignInAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateManagedUserDto {
  email: string;
  password: string;
  nameTh: string;
  nameEn: string;
  role: "IT_STAFF" | "SUPERVISOR" | "GM";
  employeeId: string;
  jobTitle?: string | null;
  extension?: string | null;
  mobile?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
}

export interface UpdateManagedUserDto {
  email?: string;
  nameTh?: string;
  nameEn?: string;
  role?: "IT_STAFF" | "SUPERVISOR" | "GM";
  employeeId?: string;
  jobTitle?: string | null;
  extension?: string | null;
  mobile?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
}

export interface ResetManagedUserPasswordDto {
  password?: string;
}

export interface ResetManagedUserPasswordResultDto {
  user: UserDto;
  temporaryPassword: string;
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

export type ReferenceCatalogCode = "departments" | "categories" | "skills";

export interface ReferenceCatalogDto {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceItemDto {
  id: string;
  catalogId: string;
  catalogCode: string;
  code: string;
  labelTh: string;
  labelEn: string;
  icon?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReferenceItemDto {
  code: string;
  labelTh: string;
  labelEn: string;
  icon?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateReferenceItemDto {
  code?: string;
  labelTh?: string;
  labelEn?: string;
  icon?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}
