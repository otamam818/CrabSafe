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
    }
  },
  some: function makeSome<T>(value: T): OptionT<T> {
    return {
      variant: 'Some' as const,
      value,
      unwrap: () => value
    };
  }
}

// The Result Type, modeled after rust's error type
export type Err<T, K> = { variant: 'Err', errKind: K, unwrap: () => T | never }
export type Ok<T> = { variant: 'Ok', value: T, unwrap: () => T }
export type Result<T, K extends string = string> = Ok<T> | Err<T, K>;

export const ResultBuilder = {
  err: function giveErr<T, U>(message: string, dbgMessage?: U): Result<T> {
    return {
      variant: 'Err',
      errKind: message,
      unwrap: () => { throw new Error(message) },
      ...(dbgMessage ? dbgMessage: dbgMessage)
    }
  },

  ok: function makeSome<T, U>(value: T, dbgMessage?: U): Result<T> {
    return {
      variant: 'Ok',
      value,
      unwrap: () => value,
      ...(dbgMessage ? dbgMessage: dbgMessage)
    };
  }
}

export const parsers = {
  parseHtml: function parseHTMLString_rs(htmlString: string): Result<Document> {
    const parser = new DOMParser();
    const foundDoc = parser.parseFromString(htmlString, "text/html");
    if (!foundDoc) {
        return ResultBuilder.err("InvalidHTML");
    }
    const errorNode = foundDoc.querySelector("parsererror");

    if (errorNode) {
      return ResultBuilder.err("InvalidHTML")
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

type FetchRes<T> = Result<T, 'ResponseError' | 'FetchError'>;
export const net = {
    fetch: async function fetchData<T>(url: string, mode: 'String' | 'JSON' = 'JSON'): Promise<FetchRes<T>> {
        try {
          // Attempt to fetch data from the provided URL
          const response = await fetch(url);
          // Check if the response status is OK (status code 200-299)
          if (!response.ok) {
            return ResultBuilder.err('ResponseError') as FetchRes<T>;
          }

          // Attempt to parse the response body
          const data = match( mode, {
            'JSON': async () => await response.json(),
            'String': async () => await response.text()
          })
          
          return ResultBuilder.ok(data) as FetchRes<T>;
        } catch (error) {
          const finErr = ResultBuilder.err('FetchError', error);
          return finErr as FetchRes<T>;
        }
    }
}

export function panic(errorMessage: string): never {
  throw new Error (errorMessage);
}

export function match<T extends string, R = void>(key: T, cases: Record<T, () => R>): R {
  return cases[key]();
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
