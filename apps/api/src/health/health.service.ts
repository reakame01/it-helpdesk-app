import { Injectable } from "@nestjs/common";
import type { HealthCheckDto } from "@helpdesk/types";

@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();

  check(): HealthCheckDto {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }
}
