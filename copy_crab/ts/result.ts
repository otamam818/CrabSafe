import { panic } from "./core_functions.ts";

// The Result Type, modeled after rust's error type
interface ResultMethods<T, K extends string = string> {
  unwrap(): T | never;
  unwrapOr(callback: () => T): T;

  toString(): string;

  // Maps the Ok variant into something else if it exists
  map<U>(callback: (someValue: T) => U): Result<U>;

  letOk<U>(callback: (okValue: T) => U): U | void;
  letErr<U>(callback: (errValue: K) => U): U | void;
}
export type Err<T, K> = ResultMethods<T> & {
  variant: "Err";
  errKind: K;
  dbgMessage?: unknown;
};
export type Ok<T> = ResultMethods<T> & { variant: "Ok"; value: T };
export type Result<T, K extends string = string> = Ok<T> | Err<T, K>;
// Shorthand for Promise<Result<>>
export type PResult<T, K extends string = string> = Promise<Result<T, K>>;

export type ErrRaw<T, K extends string = string> = Omit<
  Err<T, K>,
  keyof ResultMethods<T, K>
>;
export type OkRaw<T> = Omit<Ok<T>, keyof ResultMethods<T>>;
export type ResultRaw<T, K extends string = string> = ErrRaw<T, K> | OkRaw<T>;

// Shorthand for Promise<ResultRaw<>>
export type PResultRaw<T, K extends string = string> = Promise<ResultRaw<T, K>>;

export const ResultBuilder = {
  err: function giveErr<T, U extends string, V = undefined | unknown>(
    message: U,
    dbgMessage?: V
  ): Err<T, U> {
    const finValue: Err<T, U> = {
      variant: "Err",
      errKind: message,

      unwrap: () => panic(message),
      unwrapOr: (callback) => callback(),

      map: (_callback) => ResultBuilder.err(message),

      letErr: (callback) => callback(message),
      letOk(_callback) {},

      toString: () =>
        "".concat(
          `ErrorState: ${message}`,
          dbgMessage ? `\nDebugMessage: ${JSON.stringify(dbgMessage)}` : ""
        ),
    };

    if (dbgMessage) {
      finValue.dbgMessage = dbgMessage;
    }
    return finValue;
  },

  ok: function makeOk<T>(value: T): Ok<T> {
    return {
      variant: "Ok",
      value,

      unwrap: () => value,
      unwrapOr: (_callback) => value,

      map: (callback) => ResultBuilder.ok(callback(value)),

      letOk: (callback) => callback(value),
      letErr() {},
    };
  },
};
