/**
 * @fileoverview Make interfaces with the rust side of things that are
 *               statically checked in compiletime
 */
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
      variant: 'Some' as 'Some',
      value,
      unwrap: () => value
    };
  }
}

// The Result Type, modeled after rust's error type
export type Err<T> = { variant: 'Err', kind: string, unwrap: () => T | never }
export type Ok<T> = { variant: 'Ok', value: T, unwrap: () => T }
export type Result<T, K /* K = kind */> = Ok<T> | Err<K>;
// A result that shows the message
export type IOResult<T> = Result<T, string>;

export const IOResultBuilder = {
  err: function giveErr<T>(message: string): IOResult<T> {
    return {
      variant: 'Err',
      kind: message,
      unwrap: () => { throw new Error(message) }
    }
  },
  ok: function makeSome<T>(value: T): IOResult<T> {
    return {
      variant: 'Ok',
      value,
      unwrap: () => value
    };
  }
}

export const parsers = {
  parseHtml: function parseHTMLString_rs(htmlString: string): IOResult<string> {
    const parser = new DOMParser();
    const foundDoc = parser.parseFromString(htmlString, "text/html");
    const errorNode = foundDoc.querySelector("parsererror");

    if (errorNode) {
      return IOResultBuilder.err("InvalidHTML")
    }
    return IOResultBuilder.ok(htmlString);
  }
}

export function panic(errorMessage: string): never {
  throw new Error (errorMessage);
}

export function match<T extends string, R = void>(key: T, cases: Record<T, () => R>): R {
  return cases[key]();
}

export function capitalizeFirstLetter(str: string): IOResult<string> {
  // Check if the input is a valid string
  if (typeof str !== 'string') {
    return IOResultBuilder.err('Invalid input');
  }
  // Check if the input is an empty string
  if (str.length === 0) {
    return IOResultBuilder.ok('');
  }

  // Get the first character of the input and convert it to uppercase
  let firstChar = str[0].toUpperCase();
  // Get the rest of the input and keep it as it is
  let rest = str.slice(1);
  // Return the concatenation of the first character and the rest
  return IOResultBuilder.ok(firstChar + rest);
}
