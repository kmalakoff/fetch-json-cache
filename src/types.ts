export interface CacheOptions {
  hash?: (string: string) => string;
}

export interface GetOptions {
  force?: boolean;
}
export type GetCallback = (error?: Error, json?: JSON) => undefined;
export type ClearCallback = (error?: Error) => undefined;
