/**
 * @fileoverview Make interfaces with the rust side of things that are
 *               statically checked in compiletime
 */

// NOTE: Remove this if it's running in client-side/non-deno code
import { DOMParser, Document } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

// A new type of option, better suited for the match function in this file
export type NoneT<T> = { variant: 'None', unwrap: () => T | never }
export type SomeT<T> = { variant: 'Some', value: T, unwrap: () => T }
export type OptionT<T> = NoneT<T> | SomeT<T>;

export const OptionBuilder = {
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
  }
}

// The Result Type, modeled after rust's error type
export type Err<T, K> = { variant: 'Err', errKind: K, unwrap: () => T | never }
export type Ok<T> = { variant: 'Ok', value: T, unwrap: () => T }
export type Result<T, K extends string = string> = Ok<T> | Err<T, K>;

export const ResultBuilder = {
  err: function giveErr<T, U extends string, V = void>(message: U, dbgMessage?: V): Err<T, U> {
    return {
      variant: 'Err',
      errKind: message,
      unwrap: () => { throw new Error(message) },
      ...(dbgMessage ? dbgMessage: dbgMessage)
    }
  },

  ok: function makeSome<T, U = void>(value: T, dbgMessage?: U): Ok<T> {
    return {
      variant: 'Ok',
      value,
      unwrap: () => value,
      ...(dbgMessage ? dbgMessage: dbgMessage)
    };
  }
}

export const parsers = {
  parseHtml: function parseHTMLString_rs(htmlString: string): Result<Document, "ParseError" | "QueryError"> {
    const parser = new DOMParser();
    const foundDoc = parser.parseFromString(htmlString, "text/html");
    if (!foundDoc) {
        return ResultBuilder.err("ParseError");
    }
    const errorNode = foundDoc.querySelector("parsererror");

    if (errorNode) {
      return ResultBuilder.err("QueryError")
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
      return ResultBuilder.err(message); // or you can return an error, throw an exception, etc.
    }
  }
}

type FetchRes<T> = Result<T, 'ResponseError' | 'FetchError' | 'TextParseError' | 'JsonParseError'>;
export const net = {
    fetch: async function fetchData<T>(url: string, mode: 'String' | 'JSON' = 'JSON'): Promise<FetchRes<T>> {
        try {
          // Attempt to fetch data from the provided URL
          const response = await fetch(url);
          // Check if the response status is OK (status code 200-299)
          if (!response.ok) {
            return ResultBuilder.err('ResponseError');
          }

          // Attempt to parse the response body
          type RemChecks = 'JsonParseError' | 'TextParseError';
          return await match( mode, {
            'JSON': async () => {
                try {
                    return ResultBuilder.ok<T>(await response.json() as T);
                } catch {
                    return ResultBuilder.err("JsonParseError" as RemChecks);
                }
            },
            'String': async () => {
                try {
                    return ResultBuilder.ok<T>(await response.text() as T);
                } catch {
                    return ResultBuilder.err('TextParseError' as RemChecks);
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

export function matchVariant<T extends { variant: V }, V extends string, R = void>(
  vart: T,
  cases: { [P in T['variant']]: (arg: Omit<T, 'variant'> & Extract<T, { variant: P }>) => R }
): R {
  const { variant, ...remValues } = vart;
  const fn = cases[variant];
  return fn(remValues as Omit<T, 'variant'> & Extract<T, { variant: typeof variant }>);
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
