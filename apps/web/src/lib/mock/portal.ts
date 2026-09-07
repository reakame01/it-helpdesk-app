export type DepartmentOption = {
  value: string;
};

export type TicketCategoryOption = {
  value: string;
  icon: string;
  fullWidth?: boolean;
};

export type ItStaffMember = {
  id: string;
  avatarUrl: string;
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

export const mockStaff: ItStaffMember[] = [
  {
    id: "1",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBeklKKETjPyc0PyX9WaACR1Lt-t-4FWx2a8CIGh7mREWZcWHZzJc5lCOMLQfL-eZcqyV2WY6g-hmRaGISCdcB6HF-PKCAL7rW5GwJ5QidLELV7Nrxu9mYCaWAvpO1chbVEeW2I_muAN3N9AwH6hvA8sEANz94ooq6TupnDJrKvvDPStQQJrB5ZQYm_A73XALNrFp1zJ7fUlXoPH13uqDhj3xZRmz-Uv9XFC8Zv1Pa2EwmaeBG6jRZV",
  },
  {
    id: "2",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBitPhsXMJAd48tLYnoWcr0N8fMdBGTE299kjnWOAbzPW1zKKwhUxTG_NiLh7NcwWJqHUAm6VAeqejYzXAQpfraKDwtYW3qinmDplOgP_Bqgq2CrdIhZUcrynj8j8qbpFCPrfrKdn2yhZfLiR7cteYQvUrNhZtP1_sjUxAScZOHA9ZhWP5EuBfjJfbEAVbApyQaLAjh98_SulcFd6k7742R3D17WBNEcr8bOjhrhd0Y3AAbGZMpxGIg",
  },
  {
    id: "3",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCpSXRbZmgccHf7UZ32LFs-cuxtGhtcg1oIBb1qdtrvbrLmbF9zpqS-a0ZF0w2nuEXKhoMyO_T2nhIvzwjpLo4yeqIbasWpPS8k0-0a_xkvR8rUvuIxe4fEcfEjvVdeoWFwmWqt9gGOfZRBU9PXLlXYodaTMF8tWV-8vykRE9Y6nuZdqlKw5sbc3tG-oro6Rc7E9bL1N-B7r-09TXMJZv_ft7UVCfIsgzDOgfEmAln003NlQfsmChnB",
  },
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
