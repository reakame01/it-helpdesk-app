import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdir, readFile, unlink, writeFile, access } from "node:fs/promises";
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import type {
  ObjectStorage,
  StoredObject,
} from "../application/ports/object-storage.port";

@Injectable()
export class LocalDiskObjectStorage implements ObjectStorage, OnModuleInit {
  private rootDir = "";

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    this.rootDir = this.resolveRoot();
    await mkdir(join(this.rootDir, "avatars"), { recursive: true });
    await mkdir(join(this.rootDir, "attachments"), { recursive: true });
  }

  private resolveRoot(): string {
    const configured = this.config.get<string>("FILE_STORAGE_ROOT")?.trim();
    if (!configured) {
      throw new Error(
        "FILE_STORAGE_ROOT is not set. Configure it in apps/api/.env",
      );
    }
    return resolve(configured);
  }

  private resolveSafePath(key: string): string {
    const normalizedKey = key.replace(/\\/g, "/").replace(/^\/+/, "");
    const segments = normalizedKey.split("/").filter(Boolean);
    if (!segments.length || segments.some((part) => part === "..")) {
      throw new Error(`Invalid storage key: ${key}`);
    }
    const absolute = resolve(this.rootDir, ...segments);
    const rel = relative(this.rootDir, absolute);
    if (!rel || rel.startsWith("..") || isAbsolute(rel)) {
      throw new Error(`Path escapes storage root: ${key}`);
    }
    return absolute;
  }

  async put(input: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<StoredObject> {
    const absolute = this.resolveSafePath(input.key);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, input.body);
    const key = input.key.replace(/\\/g, "/").replace(/^\/+/, "");
    return {
      key,
      publicPath: `files/${key}`,
      contentType: input.contentType,
      size: input.body.length,
    };
  }

  async get(
    key: string,
  ): Promise<{ body: Buffer; contentType: string } | null> {
    try {
      const absolute = this.resolveSafePath(key);
      const body = await readFile(absolute);
      const lower = key.toLowerCase();
      const contentType = lower.endsWith(".png")
        ? "image/png"
        : lower.endsWith(".webp")
          ? "image/webp"
          : lower.endsWith(".gif")
            ? "image/gif"
            : "image/jpeg";
      return { body, contentType };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const absolute = this.resolveSafePath(key);
      await unlink(absolute);
    } catch {
      // ignore missing files
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(this.resolveSafePath(key));
      return true;
    } catch {
      return false;
    }
  }
}
