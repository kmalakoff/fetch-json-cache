export interface Record<T> {
  headers: object;
  body: T;
}

export interface CacheOptions {
  hash?: (string: string) => string;
}

export interface CacheContext {
  cachePath: string;
  options: CacheOptions;
}

export interface GetOptions {
  force?: boolean;
}
export type GetCallback<T> = (error?: Error | null, result?: T) => void;
export type ClearCallback = (error?: Error | null) => void;
export type UpdateCallback<T> = (error?: Error | null, result?: T) => void;
