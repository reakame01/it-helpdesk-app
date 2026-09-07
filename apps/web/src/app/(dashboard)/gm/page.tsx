import { AppShell } from "@/components/shared/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function GmDashboardPage() {
  return (
    <AppShell title="GM overview" active="gm">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Approvals & SLA</CardTitle>
          <CardDescription>
            Review quick-ticket approvals and organizational support health.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Pending approvals and audit summaries will appear here.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
