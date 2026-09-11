import type {
  AddTicketCollaboratorDto,
  BoardTicketDto,
  ConfirmTokenPeekDto,
  CreateQuickLogDto,
  HardDeleteTicketDto,
  HardDeleteTicketResultDto,
  ReportTicketDto,
  TicketDto,
  TicketReasonActionDto,
  TicketTokenActionDto,
  UpdateTicketProgressDto,
  WorklogDto,
} from "@helpdesk/types";
import { apiClient } from "./client";

export type ReportTicketInput = ReportTicketDto & {
  attachments?: File[];
};

async function postMultipart<T>(
  url: string,
  fields: Record<string, string>,
  files: File[] = [],
): Promise<T> {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  for (const file of files) {
    form.append("attachments", file);
  }
  const { data } = await apiClient.post<T>(url, form, {
    headers: { "Content-Type": "multipart/form-data" },
    transformRequest: [
      (body, headers) => {
        if (body instanceof FormData && headers) {
          delete headers["Content-Type"];
        }
        return body;
      },
    ],
  });
  return data;
}

export async function fetchBoardTickets(): Promise<BoardTicketDto[]> {
  const { data } = await apiClient.get<BoardTicketDto[]>("/tickets/board");
  return data;
}

export async function peekConfirmToken(
  token: string,
): Promise<ConfirmTokenPeekDto> {
  const { data } = await apiClient.get<ConfirmTokenPeekDto>(
    "/tickets/confirm-token",
    { params: { token } },
  );
  return data;
}

export async function claimBoardTicket(ticketId: string): Promise<BoardTicketDto> {
  const { data } = await apiClient.post<BoardTicketDto>(
    `/tickets/${ticketId}/claim`,
  );
  return data;
}

export async function withdrawBoardTicket(ticketId: string): Promise<BoardTicketDto> {
  const { data } = await apiClient.post<BoardTicketDto>(
    `/tickets/${ticketId}/withdraw`,
  );
  return data;
}

export async function addTicketCollaborator(
  ticketId: string,
  body: AddTicketCollaboratorDto,
): Promise<BoardTicketDto> {
  const { data } = await apiClient.post<BoardTicketDto>(
    `/tickets/${ticketId}/collaborators`,
    body,
  );
  return data;
}

export async function removeTicketCollaborator(
  ticketId: string,
  userId: string,
): Promise<BoardTicketDto> {
  const { data } = await apiClient.delete<BoardTicketDto>(
    `/tickets/${ticketId}/collaborators/${userId}`,
  );
  return data;
}

export async function sendForUserTest(
  ticketId: string,
): Promise<BoardTicketDto> {
  const { data } = await apiClient.post<BoardTicketDto>(
    `/tickets/${ticketId}/send-for-user-test`,
  );
  return data;
}

export async function approveAndClose(
  ticketId: string,
): Promise<BoardTicketDto> {
  const { data } = await apiClient.post<BoardTicketDto>(
    `/tickets/${ticketId}/approve-and-close`,
  );
  return data;
}

export async function approveAndCloseWithToken(
  ticketId: string,
  body: TicketTokenActionDto,
): Promise<BoardTicketDto> {
  const { data } = await apiClient.post<BoardTicketDto>(
    `/tickets/${ticketId}/approve-and-close-token`,
    { token: body.token },
  );
  return data;
}

export async function reportIssueWithToken(
  ticketId: string,
  body: TicketTokenActionDto & { reason: string; attachments?: File[] },
): Promise<BoardTicketDto> {
  return postMultipart<BoardTicketDto>(
    `/tickets/${ticketId}/report-issue-token`,
    { token: body.token, reason: body.reason },
    body.attachments ?? [],
  );
}

export async function reopenTicket(
  ticketId: string,
  body: TicketReasonActionDto & { attachments?: File[] },
): Promise<BoardTicketDto> {
  if (body.attachments?.length) {
    return postMultipart<BoardTicketDto>(
      `/tickets/${ticketId}/reopen`,
      { reason: body.reason },
      body.attachments,
    );
  }
  const { data } = await apiClient.post<BoardTicketDto>(
    `/tickets/${ticketId}/reopen`,
    { reason: body.reason },
  );
  return data;
}

export async function reopenTicketWithToken(
  ticketId: string,
  body: TicketTokenActionDto & { reason: string; attachments?: File[] },
): Promise<BoardTicketDto> {
  return postMultipart<BoardTicketDto>(
    `/tickets/${ticketId}/reopen-token`,
    { token: body.token, reason: body.reason },
    body.attachments ?? [],
  );
}

export async function resendConfirm(ticketId: string): Promise<BoardTicketDto> {
  const { data } = await apiClient.post<BoardTicketDto>(
    `/tickets/${ticketId}/resend-confirm`,
  );
  return data;
}

export async function fetchTicketWorklogs(
  ticketId: string,
): Promise<WorklogDto[]> {
  const { data } = await apiClient.get<WorklogDto[]>(
    `/tickets/${ticketId}/worklogs`,
  );
  return data;
}

export async function updateTicketProgress(
  ticketId: string,
  body: UpdateTicketProgressDto,
): Promise<BoardTicketDto> {
  const { data } = await apiClient.patch<BoardTicketDto>(
    `/tickets/${ticketId}/progress`,
    body,
  );
  return data;
}

export async function editTicketProgressWorklog(
  ticketId: string,
  worklogId: string,
  body: UpdateTicketProgressDto,
): Promise<BoardTicketDto> {
  const { data } = await apiClient.patch<BoardTicketDto>(
    `/tickets/${ticketId}/worklogs/${worklogId}`,
    body,
  );
  return data;
}

export async function deleteTicketProgressWorklog(
  ticketId: string,
  worklogId: string,
): Promise<BoardTicketDto> {
  const { data } = await apiClient.delete<BoardTicketDto>(
    `/tickets/${ticketId}/worklogs/${worklogId}`,
  );
  return data;
}

export async function createQuickLog(body: CreateQuickLogDto): Promise<BoardTicketDto> {
  const { data } = await apiClient.post<BoardTicketDto>("/tickets/quick-log", body);
  return data;
}

export async function hardDeleteTicket(
  ticketId: string,
  body: HardDeleteTicketDto,
): Promise<HardDeleteTicketResultDto> {
  const { data } = await apiClient.delete<HardDeleteTicketResultDto>(
    `/tickets/${ticketId}`,
    { data: body },
  );
  return data;
}

export async function reportTicket(input: ReportTicketInput): Promise<TicketDto> {
  return postMultipart<TicketDto>(
    "/tickets/report",
    {
      requesterName: input.requesterName,
      requesterEmail: input.requesterEmail,
      departmentCode: input.departmentCode,
      extension: input.extension,
      categoryCode: input.categoryCode,
      title: input.title,
      description: input.description,
      priority: input.priority,
    },
    input.attachments ?? [],
  );
}
