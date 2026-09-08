import { mockStaff } from "@/lib/mock/portal";

export type ManagedUserRole = "IT_STAFF" | "IT_LEAD" | "GM";

export type ManagedUser = {
  id: string;
  employeeId: string;
  nameTh: string;
  nameEn: string;
  email: string;
  role: ManagedUserRole;
  department: string;
  extension: string;
  mobile: string;
  jobTitle: string;
  isActive: boolean;
  avatarUrl: string;
  lastSignInKey: string;
};

export const managedUserRoles: ManagedUserRole[] = [
  "IT_STAFF",
  "IT_LEAD",
  "GM",
];

export function createEmptyManagedUser(): Omit<ManagedUser, "id"> {
  return {
    employeeId: "",
    nameTh: "",
    nameEn: "",
    email: "",
    role: "IT_STAFF",
    department: "operations",
    extension: "",
    mobile: "",
    jobTitle: "",
    isActive: true,
    avatarUrl: mockStaff[0]?.avatarUrl ?? "",
    lastSignInKey: "never",
  };
}

export const initialManagedUsers: ManagedUser[] = [
  {
    id: "u1",
    employeeId: "EMP-0012",
    nameTh: "อนุชา ปัญญาไว",
    nameEn: "Anucha Panyawai",
    email: "it@company.com",
    role: "IT_STAFF",
    department: "operations",
    extension: "101",
    mobile: "089-123-4567",
    jobTitle: "System & Network Specialist",
    isActive: true,
    avatarUrl: mockStaff[0].avatarUrl,
    lastSignInKey: "minutes12",
  },
  {
    id: "u2",
    employeeId: "EMP-0008",
    nameTh: "วิชัย เครือข่ายดี",
    nameEn: "Wichai Kreuakhaidii",
    email: "wichai.it@company.com",
    role: "IT_STAFF",
    department: "operations",
    extension: "102",
    mobile: "081-222-3344",
    jobTitle: "Hardware Specialist",
    isActive: true,
    avatarUrl: mockStaff[1].avatarUrl,
    lastSignInKey: "hour1",
  },
  {
    id: "u3",
    employeeId: "EMP-0003",
    nameTh: "สมชาย ใจดี",
    nameEn: "Somchai Jaidee",
    email: "somchai.lead@company.com",
    role: "IT_LEAD",
    department: "operations",
    extension: "100",
    mobile: "086-555-7788",
    jobTitle: "IT Team Lead",
    isActive: true,
    avatarUrl: mockStaff[2].avatarUrl,
    lastSignInKey: "hours3",
  },
  {
    id: "u4",
    employeeId: "EMP-0041",
    nameTh: "กานต์สุดา มั่นคง",
    nameEn: "Kansuda Mankong",
    email: "kansuda.gm@company.com",
    role: "GM",
    department: "operations",
    extension: "200",
    mobile: "082-111-9000",
    jobTitle: "General Manager",
    isActive: true,
    avatarUrl: mockStaff[0].avatarUrl,
    lastSignInKey: "yesterday",
  },
  {
    id: "u5",
    employeeId: "EMP-0019",
    nameTh: "ธนา เก่าย้ายแผนก",
    nameEn: "Thana FormerIt",
    email: "thana.old@company.com",
    role: "IT_STAFF",
    department: "operations",
    extension: "103",
    mobile: "089-000-1122",
    jobTitle: "Former IT Support",
    isActive: false,
    avatarUrl: mockStaff[1].avatarUrl,
    lastSignInKey: "days7",
  },
];
