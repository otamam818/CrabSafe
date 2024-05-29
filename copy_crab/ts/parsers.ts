// NOTE: Remove this if it's running in client-side/non-deno code
import { DOMParser, Document } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

import { ResultBuilder, Result, Err } from "./result.ts";
import { vmatch } from "./core_functions.ts";

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


// Potential errors that can occur when converting an HTML string into a Document
export type HTMLParseError = "StringParseFailed" | "QueryParseFailed";

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
