import { Global, Module } from "@nestjs/common";
import { OBJECT_STORAGE } from "./application/ports/object-storage.port";
import { FilesController } from "./infrastructure/http/files.controller";
import { LocalDiskObjectStorage } from "./infrastructure/local-disk.object-storage";

@Global()
@Module({
  controllers: [FilesController],
  providers: [
    {
      provide: OBJECT_STORAGE,
      useClass: LocalDiskObjectStorage,
    },
  ],
  exports: [OBJECT_STORAGE],
})
export class StorageModule {}
