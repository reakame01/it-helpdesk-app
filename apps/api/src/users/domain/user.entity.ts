import type { ManagedUserRole } from "./errors";

export type UserProps = {
  id: string;
  email: string;
  name: string;
  nameTh: string | null;
  nameEn: string | null;
  role: string;
  employeeId: string | null;
  jobTitle: string | null;
  extension: string | null;
  mobile: string | null;
  avatarUrl: string | null;
  department: string | null;
  isActive: boolean;
  lastSignInAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserAuthRecord = {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
};

export class User {
  readonly id: string;
  email: string;
  name: string;
  nameTh: string | null;
  nameEn: string | null;
  role: string;
  employeeId: string | null;
  jobTitle: string | null;
  extension: string | null;
  mobile: string | null;
  avatarUrl: string | null;
  department: string | null;
  isActive: boolean;
  lastSignInAt: Date | null;
  deletedAt: Date | null;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.name = props.name;
    this.nameTh = props.nameTh;
    this.nameEn = props.nameEn;
    this.role = props.role;
    this.employeeId = props.employeeId;
    this.jobTitle = props.jobTitle;
    this.extension = props.extension;
    this.mobile = props.mobile;
    this.avatarUrl = props.avatarUrl;
    this.department = props.department;
    this.isActive = props.isActive;
    this.lastSignInAt = props.lastSignInAt;
    this.deletedAt = props.deletedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  get managedRole(): ManagedUserRole | null {
    if (
      this.role === "IT_STAFF" ||
      this.role === "SUPERVISOR" ||
      this.role === "GM"
    ) {
      return this.role;
    }
    return null;
  }
}
