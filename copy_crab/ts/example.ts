import { Result, ResultBuilder } from "./result.ts";

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
