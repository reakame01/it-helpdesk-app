import { AppShell } from "@/components/shared/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UserDashboardPage() {
  return (
    <AppShell title="User dashboard" active="user">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My tickets</CardTitle>
            <CardDescription>
              Track open requests and follow up on resolutions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ticket list will load from `/api/tickets` once authenticated.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New request</CardTitle>
            <CardDescription>
              Submit a standard or quick ticket for IT support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Form wired with React Hook Form + Zod in a later iteration.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
