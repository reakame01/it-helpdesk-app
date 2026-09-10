import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { REFERENCE_REPOSITORY } from "./application/ports/reference.repository";
import { CreateItemUseCase } from "./application/use-cases/create-item.use-case";
import { DeleteItemUseCase } from "./application/use-cases/delete-item.use-case";
import { ListCatalogsUseCase } from "./application/use-cases/list-catalogs.use-case";
import { ListItemsUseCase } from "./application/use-cases/list-items.use-case";
import { UpdateItemUseCase } from "./application/use-cases/update-item.use-case";
import { ReferencesController } from "./infrastructure/http/references.controller";
import { PrismaReferenceRepository } from "./infrastructure/persistence/prisma-reference.repository";
import type { ReferenceRepository } from "./application/ports/reference.repository";

@Module({
  imports: [AuthModule],
  controllers: [ReferencesController],
  providers: [
    {
      provide: REFERENCE_REPOSITORY,
      useClass: PrismaReferenceRepository,
    },
    {
      provide: ListCatalogsUseCase,
      useFactory: (repo: ReferenceRepository) => new ListCatalogsUseCase(repo),
      inject: [REFERENCE_REPOSITORY],
    },
    {
      provide: ListItemsUseCase,
      useFactory: (repo: ReferenceRepository) => new ListItemsUseCase(repo),
      inject: [REFERENCE_REPOSITORY],
    },
    {
      provide: CreateItemUseCase,
      useFactory: (repo: ReferenceRepository) => new CreateItemUseCase(repo),
      inject: [REFERENCE_REPOSITORY],
    },
    {
      provide: UpdateItemUseCase,
      useFactory: (repo: ReferenceRepository) => new UpdateItemUseCase(repo),
      inject: [REFERENCE_REPOSITORY],
    },
    {
      provide: DeleteItemUseCase,
      useFactory: (repo: ReferenceRepository) => new DeleteItemUseCase(repo),
      inject: [REFERENCE_REPOSITORY],
    },
  ],
  exports: [REFERENCE_REPOSITORY],
})
export class ReferencesModule {}
