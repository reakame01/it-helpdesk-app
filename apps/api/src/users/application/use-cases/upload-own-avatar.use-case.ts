import { randomUUID } from "node:crypto";
import {
  InvalidAvatarFileError,
  UserNotFoundError,
} from "../../domain/errors";
import type { User } from "../../domain/user.entity";
import type { ObjectStorage } from "../../../storage/application/ports/object-storage.port";
import type { UserRepository } from "../ports/user.repository";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};

export type UploadOwnAvatarInput = {
  userId: string;
  buffer: Buffer;
  mimeType: string;
  originalName?: string;
};

function publicPathToKey(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  const marker = "files/";
  const idx = avatarUrl.indexOf(marker);
  if (idx === -1) return null;
  return avatarUrl.slice(idx + marker.length);
}

export class UploadOwnAvatarUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: UploadOwnAvatarInput): Promise<User> {
    const existing = await this.users.findById(input.userId);
    if (!existing || !existing.managedRole || existing.deletedAt) {
      throw new UserNotFoundError(input.userId);
    }

    const ext = ALLOWED_MIME[input.mimeType];
    if (!ext) {
      throw new InvalidAvatarFileError("Avatar must be JPEG or PNG");
    }
    if (!input.buffer.length) {
      throw new InvalidAvatarFileError("Avatar file is empty");
    }
    if (input.buffer.length > MAX_AVATAR_BYTES) {
      throw new InvalidAvatarFileError("Avatar must be 2 MB or smaller");
    }

    const key = `avatars/${existing.id}/${randomUUID()}.${ext}`;
    const stored = await this.storage.put({
      key,
      body: input.buffer,
      contentType: input.mimeType,
    });

    const previousKey = publicPathToKey(existing.avatarUrl);
    const updated = await this.users.update(existing.id, {
      avatarUrl: stored.publicPath,
    });

    if (previousKey && previousKey !== stored.key) {
      await this.storage.delete(previousKey);
    }

    return updated;
  }
}

export class DeleteOwnAvatarUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(userId: string): Promise<User> {
    const existing = await this.users.findById(userId);
    if (!existing || !existing.managedRole || existing.deletedAt) {
      throw new UserNotFoundError(userId);
    }

    const previousKey = publicPathToKey(existing.avatarUrl);
    const updated = await this.users.update(existing.id, {
      avatarUrl: null,
    });

    if (previousKey) {
      await this.storage.delete(previousKey);
    }

    return updated;
  }
}
