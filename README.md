# Rust Interfaces
Are you a Rustacean that codes in TypeScript too? And do you feel like 
TypeScript doesn't provide the same intuitive feel that Rust does?

You aren't alone. This is a common feeling that TypeScript-coding Rustaceans feel. 
We miss the feeling of coding in Rust wherever we go, and we're right to miss them 
the way we do.

That's why this repo aims to implement a kind of _interface_ that attempts to bridge 
the advantages that Rust brings to the table into the world of TypeScript.

Inspired by [this shorts video](https://www.youtube.com/shorts/3iWoNJbGO2U), I feel like it would be
a quality of life advantage to have this feature addressed.

# Setup
Copy the `rustInterfaces.ts` file into your environment wherever you want to use it. Rename it to
have the `tsx` extension if you want to include JSX.

# Features
## `match`
Enables you to evaluate a value with multiple patterns and then run code depending on which pattern corresponds.

```ts
import { match } from "./rustInterfaces";

type Animal = {
    // String-based discriminated unions can always use `match`
    kind: 'Land' | 'Water',
    name: string
}

const pet: Animal = {
    kind: 'Land',
    name: 'Alex the cat'
}

// This is where the match statement happens, notice how you can get a return value unlike `switch` statements
const instruction = match( pet.kind, {
    // You can either put a directly-addressed value
    'Water': () => `Place ${pet.name} in the tank`,

    // Or you can write program logic to compute special cases
    'Land': () => {
        if (pet.kind === 'Alex the cat') {
            console.log('Legendary animal found!');
        }
        return `Put ${pet.name} on the ground`;
    }

    // If all values are not matched, the linter will detect it
});

console.log(`What you should do: ${instruction}`);
// Prints "What you should do: Put Alex the cat on the ground"
```
