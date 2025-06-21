export interface Record<T> {
  headers: object;
  body: T;
}

export interface CacheOptions {
  hash?: (string: string) => string;
}

export interface GetOptions {
  force?: boolean;
}
export type GetCallback<T> = (error?: Error, result?: T) => undefined;
export type ClearCallback = (error?: Error) => undefined;
export type UpdateCallback<T> = (error?: Error, result?: T) => undefined;
