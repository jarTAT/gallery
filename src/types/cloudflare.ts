export interface CloudflareEnv {
  KV: KVNamespace;
  R2: R2Bucket;
  JWT_SECRET: string;
  ADMIN_PASSWORD: string;
  ADMIN_CONTACT: string;
}

export interface KVNamespace {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<unknown>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: KVNamespacePutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult>;
}

export interface KVNamespacePutOptions {
  expiration?: number;
  expirationTtl?: number;
  metadata?: Record<string, unknown>;
}

export interface KVNamespaceListOptions {
  prefix?: string;
  delimiter?: string;
  cursor?: string;
  limit?: number;
}

export interface KVNamespaceListResult<Metadata = unknown> {
  keys: KVNamespaceKey<Metadata>[];
  list_complete: boolean;
  cache_status: string | null;
  cursor: string;
}

export interface KVNamespaceKey<Metadata = unknown> {
  name: string;
  expiration?: number;
  metadata?: Metadata;
}

export interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string, options?: R2PutOptions): Promise<R2Object>;
  delete(key: string | string[]): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
  head(key: string): Promise<R2ObjectHead | null>;
}

export interface R2ObjectBody {
  body: ReadableStream;
  bodyUsed: boolean;
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  httpMetadata: R2HTTPMetadata;
  customMetadata: Record<string, string>;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T>(): Promise<T>;
  blob(): Promise<Blob>;
}

export interface R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  httpMetadata: R2HTTPMetadata;
  customMetadata: Record<string, string>;
  range?: R2ObjectRange;
}

export interface R2ObjectHead {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  httpMetadata: R2HTTPMetadata;
  customMetadata: Record<string, string>;
}

export interface R2PutOptions {
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
  md5?: ArrayBuffer | string;
}

export interface R2HTTPMetadata {
  contentType?: string;
  contentLanguage?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  cacheControl?: string;
  expires?: string;
}

export interface R2ListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
  delimiter?: string;
  startAfter?: string;
}

export interface R2Objects {
  objects: R2Object[];
  delimitedPrefixes: string[];
  truncated: boolean;
  cursor?: string;
}

export interface R2ObjectRange {
  offset: number;
  length: number;
}
