import type { ReportTicketDto, TicketDto } from "@helpdesk/types";
import { apiClient } from "./client";

export type ReportTicketInput = ReportTicketDto & {
  attachments?: File[];
};

export async function reportTicket(input: ReportTicketInput): Promise<TicketDto> {
  const form = new FormData();
  form.append("requesterName", input.requesterName);
  form.append("requesterEmail", input.requesterEmail);
  form.append("departmentCode", input.departmentCode);
  form.append("extension", input.extension);
  form.append("categoryCode", input.categoryCode);
  form.append("title", input.title);
  form.append("description", input.description);
  form.append("priority", input.priority);
  for (const file of input.attachments ?? []) {
    form.append("attachments", file);
  }

  const { data } = await apiClient.post<TicketDto>("/tickets/report", form, {
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
