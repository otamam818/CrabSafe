/**
 * @fileoverview Make interfaces with the rust side of things that are
 *               statically checked as you code
 */

// NOTE: Remove this if it's running in client-side/non-deno code
import { DOMParser, Document } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

// Base types, derived from JavaScript
export type DataType =
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "undefined"
  | "function"
  | "symbol"
  | "bigint"
  | "array";

// Potential Errors that can occur when casting an object into a type
type ObjectValidationError =
  | "ParseError"
  | "KeyMismatchError"
  | "TypeError"
  | "DataTypeSpecificationError";

// Potential errors that can occur when fetching an object into either text or JSON
type FetchErrors =
  | "ResponseError"
  | "FetchError"
  | "TextParseError"
  | "JsonParseError";

// Potential errors that can occur when converting an HTML string into a Document
export type HTMLParseError = "StringParseFailed" | "QueryParseFailed";

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

export const parsers = {
  parseHtml: function parseHTMLString_rs(
    htmlString: string
  ): Result<Document, HTMLParseError> {
    const parser = new DOMParser();
    const foundDoc = parser.parseFromString(htmlString, "text/html");
    if (!foundDoc) {
      return ResultBuilder.err("StringParseFailed");
    }
    const errorNode = foundDoc.querySelector("parsererror");

    if (errorNode) {
      return ResultBuilder.err("QueryParseFailed");
    }

    return ResultBuilder.ok(foundDoc);
  },

  parseJSON: function parseJSONString_rs<T>(jsonString: string): Result<T> {
    try {
      const parsedData = JSON.parse(jsonString) as T;

      return ResultBuilder.ok(parsedData);
    } catch (error) {
      // Handle parsing errors
      const message = typeof error === "string" ? error : JSON.stringify(error);
      return ResultBuilder.err(message);
    }
  },

  /**
   * Parses an object which enforces type-validation before casting it
   * @param obj: An object with keys and values, the equivalent of TypeScript's `Record` type
   * @param fields: An array of fieldNames and their datatypes, allows nesting
   * @returns A runtime-safe type-casted version of T
   */
  parseObject: function validateFields<T>(
    obj: object,
    fields: [keyof T, DataType | [string, DataType][]][]
  ): Result<T, ObjectValidationError> {
    for (const [field, dataType] of fields) {
      // Check for correct structure of 'fields' parameter
      if (Array.isArray(dataType) && dataType.length === 0) {
        return ResultBuilder.err(
          "DataTypeSpecificationError",
          `DataType for key: ${String(
            field
          )} is an empty array, which is not allowed.`
        );
      }

      // Check if the field is present in the object
      if (!(field in obj)) {
        return ResultBuilder.err(
          "KeyMismatchError",
          `Missing key: ${String(field)}`
        );
      }

      // Check if the field is of the correct type
      // @ts-ignore TS Type inference cannot catch that it's fine
      const currValue = obj[field];

      const result: Result<T, ObjectValidationError> = vmatch(
        isOfType(currValue, dataType),
        {
          Ok: ({ value: allTypesMatch }) => {
            if (!allTypesMatch) {
              return ResultBuilder.err(
                "TypeError",
                `Incorrect type for key: ${String(
                  field
                )}. Expected ${dataType}, got ${typeof currValue}`
              );
            }
            return ResultBuilder.ok(obj as T);
          },

          // T isn't inserted over here, so casting it from
          // `Err<boolean, ObjectValidationError>` is fine
          Err: (errorValue) => errorValue as Err<T, ObjectValidationError>,
        }
      );

      if (result.variant === "Err") {
        return result;
      }
    }

    try {
      // If all checks pass, attempt to cast the object to type T
      const typedObject = obj as T;
      return ResultBuilder.ok(typedObject);
    } catch (error) {
      return ResultBuilder.err("ParseError", error);
    }
  },
};

/**
 * Checks if the `value` is of the specified type
 * @param value an object to check the datatype against
 * @param dataType the datatype to refer to
 * @returns A result, success indicates that type-parsing has been successful and vice versa
 *          the boolean indicates whether the types match or not
 */
function isOfType(
  value: object,
  dataType: DataType | [string, DataType][]
): Result<boolean, ObjectValidationError> {
  if (Array.isArray(dataType)) {
    // If dataType is an array of [string, DataType], treat it as a specification for a nested object
    if (dataType.length === 0) {
      return ResultBuilder.ok(false); // Empty array for dataType is not allowed
    }
    if (typeof value !== "object" || value === null) {
      return ResultBuilder.ok(false); // If the value is not an object, it does not match the specification
    }
    // Recursively validate the nested object
    const result = parsers.parseObject(value, dataType);
    return vmatch(result, {
      // The types are matching, inform this to the parent function
      Ok: () => ResultBuilder.ok(true),

      // Propagate the error to the parent function
      Err: ({ errKind, dbgMessage }) => ResultBuilder.err(errKind, dbgMessage),
    });
  } else {
    // deno-lint-ignore valid-typeof
    return ResultBuilder.ok(typeof value === dataType);
  }
}

export const net = {
  fetch: async function fetchData<T>(
    url: string,
    mode: "String" | "JSON" = "JSON"
  ): PResult<T, FetchErrors> {
    try {
      // Attempt to fetch data from the provided URL
      const response = await fetch(url);
      // Check if the response status is OK (status code 200-299)
      if (!response.ok) {
        return ResultBuilder.err("ResponseError");
      }

      // Attempt to parse the response body
      type ParseErrors = "JsonParseError" | "TextParseError";
      return await match(mode, {
        JSON: async () => {
          try {
            return ResultBuilder.ok<T>((await response.json()) as T);
          } catch {
            return ResultBuilder.err("JsonParseError" as ParseErrors);
          }
        },
        String: async () => {
          try {
            return ResultBuilder.ok<T>((await response.text()) as T);
          } catch {
            return ResultBuilder.err("TextParseError" as ParseErrors);
          }
        },
      });
    } catch (error) {
      const State = "FetchError" as const;
      const finErr = ResultBuilder.err<T, typeof State>(
        State,
        JSON.stringify(error)
      );
      return finErr;
    }
  },
};

export function panic(errorMessage: string): never {
  throw new Error(errorMessage);
}

export function match<T extends string, R = void>(
  key: T,
  cases: Record<T, () => R>
): R {
  return cases[key]();
}

export function vmatch<T extends { variant: V }, V extends string, R>(
  v: T,
  cases: { [K in T["variant"]]: (arg: Extract<T, { variant: K }>) => R }
): R {
  const fn = cases[v.variant];
  if (!fn) {
    panic(`Unmatched variant: ${v.variant}`);
  }
  return fn(v as Extract<T, { variant: typeof v.variant }>);
}

export function capitalizeFirstLetter(str: string): Result<string> {
  // Check if the input is a valid string
  if (typeof str !== "string") {
    return ResultBuilder.err("Invalid input");
  }
  // Check if the input is an empty string
  if (str.length === 0) {
    return ResultBuilder.ok("");
  }

  // Get the first character of the input and convert it to uppercase
  const firstChar = str[0].toUpperCase();
  // Get the rest of the input and keep it as it is
  const rest = str.slice(1);
  // Return the concatenation of the first character and the rest
  return ResultBuilder.ok(firstChar + rest);
}
