import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { TicketsModule } from "./tickets/tickets.module";
import { HealthModule } from "./health/health.module";
import { ReferencesModule } from "./references/references.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TicketsModule,
    HealthModule,
    ReferencesModule,
  ],
})
export class AppModule {}
