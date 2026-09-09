export type DepartmentOption = {
  value: string;
};

export type TicketCategoryOption = {
  value: string;
  icon: string;
  fullWidth?: boolean;
};

export const mockCurrentUser = {
  department: "account",
  avatarUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuChke8goPEv1786bjh0iKX8xCdHencN8hCK9Xm346M9dp2xk8UKZsVQxwmkFxdfTW5VEaCpXrWmKF_0TiYlZgkuGJEOcmMCpyeDYEzUloTqElguKYttTDyv2MhkemMgxsBVnBApTT-tMuNNt1NV3YW0v8kr3DcqiVs8yhCfhondsejp1gY9mbNmQf0Necx-_2LpfCNe2RavBAXM0blHmEvTE0oxGq5YP-e_RzRk7oWLzRT3AVjbp-z0",
};

export const mockDepartments: DepartmentOption[] = [
  { value: "account" },
  { value: "marketing" },
  { value: "purchasing" },
  { value: "hr" },
  { value: "operations" },
];

export const mockCategories: TicketCategoryOption[] = [
  { value: "software", icon: "bug_report" },
  { value: "hardware", icon: "computer" },
  { value: "network", icon: "wifi_off" },
  { value: "access", icon: "key" },
  { value: "feature_request", icon: "rocket_launch", fullWidth: true },
];

export const mockAttachmentPreview = {
  fileName: "error_screen_capture_erp_0920.png",
  imageUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAaEtcbvczEzGtmRu6FctgMum2QBxGeWW5lyXj2ZgKgR7bE3nR4ILdLmhfYvkQXBUWjHcdt-erydhtrxw6zxlpV23wOZxUibC5TPv_MkDNFxhHcrFce8ZU-xp_fxz4T2xCGfUq50bURG04S7Xu4EijcQhGaiNdIqmr2mUwbYRX66bmXnTjWdnehp_h8dwFyTKo-zxPaLzD2BEt2uEM6NHf87aRPO47OdYXuYQtzPadbL96Iqziqk3R_",
};

export function createMockTicketId(): string {
  const n = Math.floor(80 + Math.random() * 20);
  return `#IT-2024-0${n}`;
}
