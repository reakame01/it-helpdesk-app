import { AppShell } from "@/components/shared/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ItDashboardPage() {
  return (
    <AppShell title="IT workspace" active="it">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Queue</CardTitle>
            <CardDescription>
              Assigned and unassigned tickets for IT staff.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Drag-and-drop board via `@hello-pangea/dnd` can be added here.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Workload</CardTitle>
            <CardDescription>
              Hours and ticket volume charts with Recharts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Analytics placeholders ready for worklog aggregation.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
