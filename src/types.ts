export interface Record<T> {
  headers: object;
  body: T;
}

export interface CacheOptions<TWire = unknown, TStored = TWire> {
  /**
   * A read-only folder of records written by an earlier run, such as one shipped with a package.
   * `get` and `getSync` use its record when it was fetched later than the one in `cachePath`.
   * It is never written and `clear()` never touches it; it is ignored when it is the same folder as `cachePath`.
   */
  seedPath?: string;
  hash?: (string: string) => string;
  // Applied to every body before it is stored, so the cached shape is the same whichever call wrote it
  transform?: (body: TWire, endpoint: string) => TStored;
}

// Internal view: the helpers only need to call transform, not know the caller's types
export interface CacheContext {
  cachePath: string;
  options: CacheOptions<unknown, unknown>;
}

export interface GetOptions {
  force?: boolean;
}
export type GetCallback<T> = (error?: Error | null, result?: T) => void;
export type ClearCallback = (error?: Error | null) => void;
export type UpdateCallback<T> = (error?: Error | null, result?: T) => void;
