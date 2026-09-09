import type { User } from "../../domain/user.entity";
import type { ManagedUserRole } from "../../domain/errors";
import type { UserRepository } from "../ports/user.repository";

/** Seed / shared IT login account — hide from the public on-duty roster. */
export const ON_DUTY_EXCLUDED_EMAIL = "it@company.com";

const ROLE_SORT_ORDER: Record<ManagedUserRole, number> = {
  IT_MANAGER: 0,
  SUPERVISOR: 1,
  IT_STAFF: 2,
};

function compareByRoleThenName(a: User, b: User): number {
  const roleA = a.managedRole;
  const roleB = b.managedRole;
  const orderA = roleA != null ? ROLE_SORT_ORDER[roleA] : 99;
  const orderB = roleB != null ? ROLE_SORT_ORDER[roleB] : 99;
  if (orderA !== orderB) return orderA - orderB;

  const nameA = (a.nameTh || a.name || "").trim();
  const nameB = (b.nameTh || b.name || "").trim();
  return nameA.localeCompare(nameB, "th", { sensitivity: "base" });
}

export class ListOnDutyStaffUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(): Promise<User[]> {
    const users = await this.users.listManagedUsers();
    return users
      .filter((user) => {
        if (user.deletedAt) return false;
        if (!user.isActive) return false;
        if (!user.managedRole) return false;
        if (user.email.trim().toLowerCase() === ON_DUTY_EXCLUDED_EMAIL) {
          return false;
        }
        return true;
      })
      .sort(compareByRoleThenName);
  }
}
