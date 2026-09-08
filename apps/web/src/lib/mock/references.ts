export type ReferenceCatalogId =
  | "departments"
  | "categories"
  | "skills";

export type ReferenceItem = {
  id: string;
  code: string;
  labelTh: string;
  labelEn: string;
  isActive: boolean;
  sortOrder: number;
  /** Material icon name — used for categories / skills */
  icon?: string;
};

export type ReferenceCatalogMeta = {
  id: ReferenceCatalogId;
  icon: string;
};

export const referenceCatalogs: ReferenceCatalogMeta[] = [
  { id: "departments", icon: "corporate_fare" },
  { id: "categories", icon: "category" },
  { id: "skills", icon: "psychology" },
];

export const initialReferenceItems: Record<
  ReferenceCatalogId,
  ReferenceItem[]
> = {
  departments: [
    {
      id: "d-account",
      code: "account",
      labelTh: "ฝ่ายบัญชีและการเงิน",
      labelEn: "Accounting & Finance",
      isActive: true,
      sortOrder: 1,
    },
    {
      id: "d-marketing",
      code: "marketing",
      labelTh: "ฝ่ายการตลาดและขาย",
      labelEn: "Marketing & Sales",
      isActive: true,
      sortOrder: 2,
    },
    {
      id: "d-purchasing",
      code: "purchasing",
      labelTh: "ฝ่ายจัดซื้อและคลังสินค้า",
      labelEn: "Purchasing & Warehouse",
      isActive: true,
      sortOrder: 3,
    },
    {
      id: "d-hr",
      code: "hr",
      labelTh: "ฝ่ายทรัพยากรบุคคล",
      labelEn: "Human Resources (HR)",
      isActive: true,
      sortOrder: 4,
    },
    {
      id: "d-operations",
      code: "operations",
      labelTh: "ฝ่ายปฏิบัติการและงานบริหาร",
      labelEn: "Operations & Admin",
      isActive: true,
      sortOrder: 5,
    },
  ],
  categories: [
    {
      id: "c-software",
      code: "software",
      labelTh: "โปรแกรม / บั๊กระบบ",
      labelEn: "Software bug or system issue",
      isActive: true,
      sortOrder: 1,
      icon: "bug_report",
    },
    {
      id: "c-hardware",
      code: "hardware",
      labelTh: "คอมพิวเตอร์และอุปกรณ์",
      labelEn: "Computer and devices",
      isActive: true,
      sortOrder: 2,
      icon: "computer",
    },
    {
      id: "c-network",
      code: "network",
      labelTh: "อินเทอร์เน็ตและเครือข่าย",
      labelEn: "Internet and network",
      isActive: true,
      sortOrder: 3,
      icon: "wifi_off",
    },
    {
      id: "c-access",
      code: "access",
      labelTh: "สิทธิ์ใช้งานและรหัสผ่าน",
      labelEn: "Access rights and passwords",
      isActive: true,
      sortOrder: 4,
      icon: "key",
    },
    {
      id: "c-feature",
      code: "feature_request",
      labelTh: "ขอฟีเจอร์ / พัฒนาใหม่",
      labelEn: "New feature / development request",
      isActive: true,
      sortOrder: 5,
      icon: "rocket_launch",
    },
  ],
  skills: [
    {
      id: "s-network",
      code: "network",
      labelTh: "Network & WiFi",
      labelEn: "Network & WiFi",
      isActive: true,
      sortOrder: 1,
      icon: "wifi",
    },
    {
      id: "s-os",
      code: "os",
      labelTh: "Windows / macOS",
      labelEn: "Windows / macOS",
      isActive: true,
      sortOrder: 2,
      icon: "desktop_windows",
    },
    {
      id: "s-erp",
      code: "erp",
      labelTh: "ERP Support",
      labelEn: "ERP Support",
      isActive: true,
      sortOrder: 3,
      icon: "database",
    },
    {
      id: "s-hardware",
      code: "hardware",
      labelTh: "Hardware & Printer",
      labelEn: "Hardware & Printer",
      isActive: true,
      sortOrder: 4,
      icon: "print",
    },
    {
      id: "s-cctv",
      code: "cctv",
      labelTh: "CCTV",
      labelEn: "CCTV",
      isActive: true,
      sortOrder: 5,
      icon: "videocam",
    },
  ],
};

export function createEmptyReferenceItem(
  catalogId: ReferenceCatalogId,
  nextOrder: number,
): Omit<ReferenceItem, "id"> {
  return {
    code: "",
    labelTh: "",
    labelEn: "",
    isActive: true,
    sortOrder: nextOrder,
    icon:
      catalogId === "categories"
        ? "category"
        : catalogId === "skills"
          ? "psychology"
          : undefined,
  };
}
