/**
 * @fileoverview Make interfaces with the rust side of things that are
 *               statically checked in compiletime
 */

// NOTE: Remove this if it's running in client-side/non-deno code
import { DOMParser, Document } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

// Base types, derived from JavaScript
type DataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'undefined'
  | 'function'
  | 'symbol'
  | 'bigint'
  | 'array';

// Potential Errors that can occur when casting an object into a type
type ObjectValidationError =
  | 'ParseError'
  | 'KeyMismatchError'
  | 'TypeError'
  | 'DataTypeSpecificationError'

type FetchErrors =
  | 'ResponseError'
  | 'FetchError'
  | 'TextParseError'
  | 'JsonParseError'

// Types that allow null-free type-safety
export type NoneT<T> = { variant: 'None', unwrap: () => T | never }
export type SomeT<T> = { variant: 'Some', value: T, unwrap: () => T }
export type OptionT<T> = NoneT<T> | SomeT<T>;

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
      variant: 'None',
      unwrap: () => { throw new Error("Value doesn't exist") }
    } as NoneT<T>
  },
  some: function makeSome<T>(value: T): OptionT<T> {
    return {
      variant: 'Some' as const,
      value,
      unwrap: () => value
    } as SomeT<T>;
  },

  /**
   * Converts a nullable/undefinable value into an Option-typed value
   * @param value a value that can be either of type T, null or undefined
   * @returns A non-null, non-undefined version of T, which is either of variant `Some` or `None`
   */
  from: function convertNullable<T>(value: T | null | undefined): OptionT<T> {
    if (value === null || value === undefined) {
      return OptionBuilder.none();
    }

    // If it's a non-object, it couldn't have been an `Option` type before this
    if (typeof value !== 'object') {
        return OptionBuilder.some(value);
    }

    // Check if it's already an `Option` type
    if (['variant', 'unwrap'].every(key => key in value)) {
        const candidate = value as object as {
            unwrap: () => unknown,
            variant: 'Some' | 'None',
            value?: unknown
        };

        if (typeof candidate.unwrap === 'function') {
            if (candidate.variant === 'Some' && 'value' in candidate) {
                return OptionBuilder.some(candidate.value as T);
            }

            if (candidate.variant === 'None') {
                return OptionBuilder.none();
            }
        }
    }

    // If it's not an option type, then it must be another type of value
    return OptionBuilder.some(value);
  }
}

// The Result Type, modeled after rust's error type
export type Err<T, K> = { variant: 'Err', errKind: K, unwrap: () => T | never, dbgMessage?: unknown, toString: () => string }
export type Ok<T> = { variant: 'Ok', value: T, unwrap: () => T }
export type Result<T, K extends string = string> = Ok<T> | Err<T, K>;

// Shorthand for Promise<Result<>>
export type PResult<T, K extends string = string> = Promise<Result<T, K>>;

export const ResultBuilder = {
  err: function giveErr<T, U extends string, V = undefined | unknown>(message: U, dbgMessage?: V): Err<T, U> {
    const finValue: Err<T, U> = {
      variant: 'Err',
      errKind: message,
      unwrap: () => { throw new Error(message) },
      toString: () => ''.concat(
        `ErrorState: ${message}`,
        dbgMessage ? `\nDebugMessage: ${JSON.stringify(dbgMessage)}` : ''
      ),
    }

    if (dbgMessage) {
        finValue.dbgMessage = dbgMessage;
    }
    return finValue;
  },

  ok: function makeSome<T>(value: T): Ok<T> {
    return {
      variant: 'Ok',
      value,
      unwrap: () => value,
    };
  }
}

export const parsers = {
  parseHtml: function parseHTMLString_rs(htmlString: string): Result<Document, "StringParseFailed" | "QueryParseFailed"> {
    const parser = new DOMParser();
    const foundDoc = parser.parseFromString(htmlString, "text/html");
    if (!foundDoc) {
        return ResultBuilder.err("StringParseFailed");
    }
    const errorNode = foundDoc.querySelector("parsererror");

    if (errorNode) {
      return ResultBuilder.err("QueryParseFailed")
    }

    return ResultBuilder.ok(foundDoc);
  },

  parseJSON: function parseJSONString_rs<T>(jsonString: string): Result<T> {
    try {
      const parsedData = JSON.parse(jsonString) as T;

      return ResultBuilder.ok(parsedData);
    } catch (error) {
      // Handle parsing errors
      const message = typeof error === 'string' ? error : JSON.stringify(error);
      return ResultBuilder.err(message);
    }
  },

  /**
   * Parses an object which enforces type-validation before casting it
   * @param obj: An object with keys and values, the equivalent of TypeScript's `Record` type
   * @param fields: An array of fieldNames and their datatypes, allows nesting
   * @returns A runtime-safe type-casted version of T
   */
  parseObject: function validateFields<T>(obj: object, fields: [keyof T, DataType | [string, DataType][]][]): Result<T, ObjectValidationError> {
    for (const [field, dataType] of fields) {
      // Check for correct structure of 'fields' parameter
      if (Array.isArray(dataType) && dataType.length === 0) {
        return ResultBuilder.err('DataTypeSpecificationError', `DataType for key: ${String(field)} is an empty array, which is not allowed.`);
      }

      // Check if the field is present in the object
      if (!(field in obj)) {
        return ResultBuilder.err('KeyMismatchError', `Missing key: ${String(field)}`);
      }

      // Check if the field is of the correct type
      // @ts-ignore TS Type inference cannot catch that it's fine
      const currValue = obj[field];

      const result: Result<T, ObjectValidationError> = vmatch(isOfType(currValue, dataType), {
        Ok: ({ value: allTypesMatch }) => {
            if (!allTypesMatch) {
                return ResultBuilder.err('TypeError', `Incorrect type for key: ${String(field)}. Expected ${dataType}, got ${typeof currValue}`);
            }
            return ResultBuilder.ok(obj as T)
        },

        // T isn't inserted over here, so casting it from
        // `Err<boolean, ObjectValidationError>` is fine
        Err: (errorValue) => errorValue as Err<T, ObjectValidationError>
      });

      if (result.variant === 'Err') {
        return result;
      }
    }

    try {
      // If all checks pass, attempt to cast the object to type T
      const typedObject = obj as T;
      return ResultBuilder.ok(typedObject);
    } catch (error) {
      return ResultBuilder.err('ParseError', error);
    }
  }
}

/**
 * Checks if the `value` is of the specified type
 * @param value an object to check the datatype against
 * @param dataType the datatype to refer to
 * @returns A result, success indicates that type-parsing has been successful and vice versa
 *          the boolean indicates whether the types match or not
 */
function isOfType(value: object, dataType: DataType | [string, DataType][]): Result<boolean, ObjectValidationError> {
  if (Array.isArray(dataType)) {
    // If dataType is an array of [string, DataType], treat it as a specification for a nested object
    if (dataType.length === 0) {
      return ResultBuilder.ok(false); // Empty array for dataType is not allowed
    }
    if (typeof value !== 'object' || value === null) {
      return ResultBuilder.ok(false); // If the value is not an object, it does not match the specification
    }
    // Recursively validate the nested object
    const result = parsers.parseObject(value, dataType);
    return vmatch(result, {
        // The types are matching, inform this to the parent function
        Ok: () => ResultBuilder.ok(true),

        // Propagate the error to the parent function
        Err: ({ errKind, dbgMessage }) => ResultBuilder.err(errKind, dbgMessage)
    })
  } else {
    // deno-lint-ignore valid-typeof
    return ResultBuilder.ok(typeof value === dataType);
  }
}

export const net = {
    fetch: async function fetchData<T>(url: string, mode: 'String' | 'JSON' = 'JSON'): PResult<T, FetchErrors> {
        try {
          // Attempt to fetch data from the provided URL
          const response = await fetch(url);
          // Check if the response status is OK (status code 200-299)
          if (!response.ok) {
            return ResultBuilder.err('ResponseError');
          }

          // Attempt to parse the response body
          type ParseErrors = 'JsonParseError' | 'TextParseError';
          return await match( mode, {
            JSON: async () => {
                try {
                    return ResultBuilder.ok<T>(await response.json() as T);
                } catch {
                    return ResultBuilder.err("JsonParseError" as ParseErrors);
                }
            },
            String: async () => {
                try {
                    return ResultBuilder.ok<T>(await response.text() as T);
                } catch {
                    return ResultBuilder.err('TextParseError' as ParseErrors);
                }
            }
          });
        } catch (error) {
          const State = 'FetchError' as const;
          const finErr = ResultBuilder.err<T, typeof State>(State, error);
          return finErr;
        }
    }
}

export function panic(errorMessage: string): never {
  throw new Error (errorMessage);
}

export function match<T extends string, R = void>(key: T, cases: Record<T, () => R>): R {
  return cases[key]();
}

export function vmatch<T extends { variant: V }, V extends string, R>(
  v: T,
  cases: { [K in T['variant']]: (arg: Extract<T, { variant: K }>) => R }
): R {
  const fn = cases[v.variant];
  if (!fn) {
    throw new Error(`Unmatched variant: ${v.variant}`);
  }
  return fn(v as Extract<T, { variant: typeof v.variant }>);
}

export function capitalizeFirstLetter(str: string): Result<string> {
  // Check if the input is a valid string
  if (typeof str !== 'string') {
    return ResultBuilder.err('Invalid input');
  }
  // Check if the input is an empty string
  if (str.length === 0) {
    return ResultBuilder.ok('');
  }

  // Get the first character of the input and convert it to uppercase
  const firstChar = str[0].toUpperCase();
  // Get the rest of the input and keep it as it is
  const rest = str.slice(1);
  // Return the concatenation of the first character and the rest
  return ResultBuilder.ok(firstChar + rest);
}
