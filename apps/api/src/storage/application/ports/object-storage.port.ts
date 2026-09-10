export const OBJECT_STORAGE = Symbol("OBJECT_STORAGE");

export type StoredObject = {
  /** Relative key under storage root, e.g. avatars/{userId}/{file} */
  key: string;
  /** Public API path under global prefix, e.g. files/avatars/... */
  publicPath: string;
  contentType: string;
  size: number;
};

export interface ObjectStorage {
  put(input: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<StoredObject>;
  get(key: string): Promise<{ body: Buffer; contentType: string } | null>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
