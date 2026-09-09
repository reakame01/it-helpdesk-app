import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

type SeedItem = {
  code: string;
  labelTh: string;
  labelEn: string;
  sortOrder: number;
  icon?: string;
};

const catalogs: Array<{
  code: string;
  nameTh: string;
  nameEn: string;
  items: SeedItem[];
}> = [
  {
    code: "departments",
    nameTh: "แผนก",
    nameEn: "Departments",
    items: [
      {
        code: "account",
        labelTh: "ฝ่ายบัญชีและการเงิน",
        labelEn: "Accounting & Finance",
        sortOrder: 1,
      },
      {
        code: "marketing",
        labelTh: "ฝ่ายการตลาดและขาย",
        labelEn: "Marketing & Sales",
        sortOrder: 2,
      },
      {
        code: "purchasing",
        labelTh: "ฝ่ายจัดซื้อและคลังสินค้า",
        labelEn: "Purchasing & Warehouse",
        sortOrder: 3,
      },
      {
        code: "hr",
        labelTh: "ฝ่ายทรัพยากรบุคคล",
        labelEn: "Human Resources (HR)",
        sortOrder: 4,
      },
      {
        code: "operations",
        labelTh: "ฝ่ายปฏิบัติการและงานบริหาร",
        labelEn: "Operations & Admin",
        sortOrder: 5,
      },
    ],
  },
  {
    code: "categories",
    nameTh: "ประเภทปัญหา",
    nameEn: "Issue categories",
    items: [
      {
        code: "software",
        labelTh: "โปรแกรม / บั๊กระบบ",
        labelEn: "Software bug or system issue",
        sortOrder: 1,
        icon: "bug_report",
      },
      {
        code: "hardware",
        labelTh: "คอมพิวเตอร์และอุปกรณ์",
        labelEn: "Computer and devices",
        sortOrder: 2,
        icon: "computer",
      },
      {
        code: "network",
        labelTh: "อินเทอร์เน็ตและเครือข่าย",
        labelEn: "Internet and network",
        sortOrder: 3,
        icon: "wifi_off",
      },
      {
        code: "access",
        labelTh: "สิทธิ์ใช้งานและรหัสผ่าน",
        labelEn: "Access rights and passwords",
        sortOrder: 4,
        icon: "key",
      },
      {
        code: "feature_request",
        labelTh: "ขอฟีเจอร์ / พัฒนาใหม่",
        labelEn: "New feature / development request",
        sortOrder: 5,
        icon: "rocket_launch",
      },
    ],
  },
  {
    code: "skills",
    nameTh: "ทักษะ IT",
    nameEn: "IT skills",
    items: [
      {
        code: "network",
        labelTh: "Network & WiFi",
        labelEn: "Network & WiFi",
        sortOrder: 1,
        icon: "wifi",
      },
      {
        code: "os",
        labelTh: "Windows / macOS",
        labelEn: "Windows / macOS",
        sortOrder: 2,
        icon: "desktop_windows",
      },
      {
        code: "erp",
        labelTh: "ERP Support",
        labelEn: "ERP Support",
        sortOrder: 3,
        icon: "database",
      },
      {
        code: "hardware",
        labelTh: "Hardware & Printer",
        labelEn: "Hardware & Printer",
        sortOrder: 4,
        icon: "print",
      },
      {
        code: "cctv",
        labelTh: "CCTV",
        labelEn: "CCTV",
        sortOrder: 5,
        icon: "videocam",
      },
    ],
  },
];

async function main() {
  const defaultAvatar =
    "https://www.kindpng.com/picc/m/24-248253_user-profile-default-image-png-clipart-png-download.png";
  const passwordHash = await bcrypt.hash("it1234", 10);

  const staffUsers: Array<{
    email: string;
    name: string;
    nameTh: string;
    nameEn: string;
    role: UserRole;
    employeeId: string;
    jobTitle: string;
    extension: string;
    mobile: string;
    isActive: boolean;
  }> = [
    {
      email: "it@company.com",
      name: "อนุชา ปัญญาไว",
      nameTh: "อนุชา ปัญญาไว",
      nameEn: "Anucha Panyawai",
      role: UserRole.IT_STAFF,
      employeeId: "EMP-0012",
      jobTitle: "System & Network Specialist",
      extension: "101",
      mobile: "089-123-4567",
      isActive: true,
    },
    {
      email: "wichai.it@company.com",
      name: "วิชัย เครือข่ายดี",
      nameTh: "วิชัย เครือข่ายดี",
      nameEn: "Wichai Kreuakhaidii",
      role: UserRole.IT_STAFF,
      employeeId: "EMP-0008",
      jobTitle: "Hardware Specialist",
      extension: "102",
      mobile: "081-222-3344",
      isActive: true,
    },
    {
      email: "somchai.lead@company.com",
      name: "สมชาย ใจดี",
      nameTh: "สมชาย ใจดี",
      nameEn: "Somchai Jaidee",
      role: UserRole.SUPERVISOR,
      employeeId: "EMP-0003",
      jobTitle: "IT Team Lead",
      extension: "100",
      mobile: "086-555-7788",
      isActive: true,
    },
    {
      email: "kansuda.gm@company.com",
      name: "กานต์สุดา มั่นคง",
      nameTh: "กานต์สุดา มั่นคง",
      nameEn: "Kansuda Mankong",
      role: UserRole.IT_MANAGER,
      employeeId: "EMP-0041",
      jobTitle: "IT Manager",
      extension: "200",
      mobile: "082-111-9000",
      isActive: true,
    },
    {
      email: "thana.old@company.com",
      name: "ธนา เก่าย้ายแผนก",
      nameTh: "ธนา เก่าย้ายแผนก",
      nameEn: "Thana FormerIt",
      role: UserRole.IT_STAFF,
      employeeId: "EMP-0019",
      jobTitle: "Former IT Support",
      extension: "103",
      mobile: "089-000-1122",
      isActive: false,
    },
  ];

  for (const staff of staffUsers) {
    await prisma.user.upsert({
      where: { email: staff.email },
      create: {
        email: staff.email,
        name: staff.name,
        nameTh: staff.nameTh,
        nameEn: staff.nameEn,
        role: staff.role,
        employeeId: staff.employeeId,
        jobTitle: staff.jobTitle,
        extension: staff.extension,
        mobile: staff.mobile,
        isActive: staff.isActive,
        passwordHash,
        avatarUrl: defaultAvatar,
      },
      update: {
        name: staff.name,
        nameTh: staff.nameTh,
        nameEn: staff.nameEn,
        role: staff.role,
        employeeId: staff.employeeId,
        jobTitle: staff.jobTitle,
        extension: staff.extension,
        mobile: staff.mobile,
        isActive: staff.isActive,
        passwordHash,
        avatarUrl: defaultAvatar,
      },
    });
  }

  for (const catalog of catalogs) {
    const saved = await prisma.referenceCatalog.upsert({
      where: { code: catalog.code },
      create: {
        code: catalog.code,
        nameTh: catalog.nameTh,
        nameEn: catalog.nameEn,
      },
      update: {
        nameTh: catalog.nameTh,
        nameEn: catalog.nameEn,
      },
    });

    for (const item of catalog.items) {
      await prisma.referenceItem.upsert({
        where: {
          catalogId_code: {
            catalogId: saved.id,
            code: item.code,
          },
        },
        create: {
          catalogId: saved.id,
          code: item.code,
          labelTh: item.labelTh,
          labelEn: item.labelEn,
          icon: item.icon,
          sortOrder: item.sortOrder,
          isActive: true,
        },
        update: {
          labelTh: item.labelTh,
          labelEn: item.labelEn,
          icon: item.icon,
          sortOrder: item.sortOrder,
          isActive: true,
        },
      });
    }
  }

  console.log("Seeded IT users and reference catalogs/items");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
