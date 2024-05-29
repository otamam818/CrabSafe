import { panic } from "./core_functions.ts";

interface OptionMethods<T> {
  unwrap(): T | never;
  unwrapOr(callback: () => T): T;
  map<U>(callback: (someValue: T) => U): OptionT<U>;
  letSome<U>(callback: (someValue: T) => U): U | void;
  letNone<U>(callback: () => U): U | void;
}
// Types that allow null-free type-safety
export type NoneT<T> = { variant: "None" } & OptionMethods<T>;
export type SomeT<T> = { variant: "Some"; value: T } & OptionMethods<T>;
export type OptionT<T> = NoneT<T> | SomeT<T>;
export type OptionRaw<T> = Omit<OptionT<T>, keyof OptionMethods<T>>;

/**
 * Builder method that creates OptionT types
 */
export const OptionBuilder = {
  /**
   * Creates an instance of `OptionT<T>.None`. A replacement for `null`
   * @returns A variant of `OptionT<T>` that signals that nothing has been set yet
   */
  none: function makeNone<T>(): OptionT<T> {
    return {
      variant: "None",
      unwrap: () => panic("Value doesn't exist"),
      unwrapOr: (callback) => callback(),
      map: (_callback) => OptionBuilder.none(),
      letSome() {},
      letNone: (callback) => callback(),
    } as NoneT<T>;
  },
  some: function makeSome<T>(value: T): OptionT<T> {
    return {
      variant: "Some" as const,
      value,
      unwrap: () => value,
      unwrapOr: () => value,
      map: (callback) => OptionBuilder.some(callback(value)),
      letSome: (callback) => callback(value),
      letNone() {},
    } as SomeT<T>;
  },

  /**
   * Converts a nullable/undefinable value into an Option-typed value
   * @param value a value that can be either of type T, null or undefined
   * @returns A non-null, non-undefined version of T, which is either of variant `Some` or `None`
   */
  from: function convertNullable<T>(
    value: T | null | undefined | OptionRaw<T>
  ): OptionT<T> {
    if (value === null || value === undefined) {
      return OptionBuilder.none();
    }

    // If it's a non-object, it couldn't have been an `Option` type before this
    if (typeof value !== "object") {
      return OptionBuilder.some(value as T);
    }

    // Check if it's an `OptionRaw` type
    if ("variant" in value) {
      const candidate = value as OptionRaw<T>;

      if (candidate.variant === "None") {
        return OptionBuilder.none();
      } else if (candidate.variant === "Some" && "value" in candidate) {
        return OptionBuilder.some(candidate.value as T);
      } else {
        /* In this case, we were wrong to think it was an OptionRaw type,
               so we treat it as its own object type */
        return OptionBuilder.some(value as T);
      }
    }

    // If it's not an option type, then it must be another type of value
    return OptionBuilder.some(value as T);
  },
};
