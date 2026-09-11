import type {
  AssigneeRole,
  BoardColumnId,
  ConfirmTokenAction,
  ConfirmTokenStage,
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

/** Public roster card for the portal "on-duty IT staff" panel (no PII beyond contact extension). */
export interface OnDutyStaffDto {
  id: string;
  name: string;
  nameTh: string | null;
  nameEn: string | null;
  role: "IT_STAFF" | "SUPERVISOR" | "IT_MANAGER";
  jobTitle: string | null;
  extension: string | null;
  avatarUrl: string | null;
}

export interface CreateManagedUserDto {
  email: string;
  password: string;
  nameTh: string;
  nameEn: string;
  role: "IT_STAFF" | "SUPERVISOR" | "IT_MANAGER";
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
  role?: "IT_STAFF" | "SUPERVISOR" | "IT_MANAGER";
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
  role: AssigneeRole;
  user?: Pick<UserDto, "id" | "name" | "email" | "role" | "jobTitle">;
  assignedAt: string;
}

export interface BoardAssigneeDto {
  userId: string;
  name: string;
  email: string;
  role: AssigneeRole;
  jobTitle?: string | null;
  assignedAt?: string;
}

export interface BoardTicketDto {
  id: string;
  ticketNo: string;
  title: string;
  description: string;
  column: BoardColumnId;
  status: TicketStatus;
  category: TicketCategory;
  categoryCode: string;
  priority: TicketPriority;
  departmentCode: string;
  requesterName: string;
  requesterEmail: string;
  extension: string;
  lead: BoardAssigneeDto | null;
  collaborators: BoardAssigneeDto[];
  attachments: TicketAttachmentDto[];
  progress?: number | null;
  type: TicketType;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

export interface ConfirmTokenPeekDto {
  ticketId: string;
  stage: ConfirmTokenStage;
  allowedActions: ConfirmTokenAction[];
  expiresAt: string;
}

export interface UpdateTicketProgressDto {
  percent: number;
  note: string;
}

export interface TicketReasonActionDto {
  reason: string;
}

export interface TicketTokenActionDto {
  token: string;
  reason?: string;
}

export interface AddTicketCollaboratorDto {
  userId: string;
}

export interface TicketAttachmentDto {
  id: string;
  ticketId: string;
  publicPath: string;
  contentType: string;
  size: number;
  originalName?: string | null;
  createdAt: string;
}

export interface TicketDto {
  id: string;
  ticketNo: string;
  title: string;
  description: string;
  category: TicketCategory;
  categoryCode: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  requesterId?: string | null;
  requesterName: string;
  requesterEmail: string;
  departmentCode: string;
  extension: string;
  requester?: Pick<UserDto, "id" | "name" | "email" | "department">;
  assignees?: TicketAssigneeDto[];
  attachments?: TicketAttachmentDto[];
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
  requesterId?: string;
  assigneeIds?: string[];
}

export interface ReportTicketDto {
  requesterName: string;
  requesterEmail: string;
  departmentCode: string;
  extension: string;
  categoryCode: string;
  title: string;
  description: string;
  /** UI values: normal | urgent */
  priority: "normal" | "urgent";
}

export interface CreateQuickLogDto {
  departmentCode: string;
  issue: string;
  resolve: string;
  requesterName?: string;
}

export interface HardDeleteTicketDto {
  confirmation: string;
}

export interface HardDeleteTicketResultDto {
  ok: true;
  ticketNo: string;
}

export interface ReportTicketResultDto {
  ticket: TicketDto;
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

export interface UpdateOwnProfileDto {
  email?: string;
  nameTh?: string;
  nameEn?: string;
  jobTitle?: string | null;
  extension?: string | null;
  mobile?: string | null;
}

export interface ChangeOwnPasswordDto {
  currentPassword: string;
  newPassword: string;
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
