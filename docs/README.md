# Documentation
## `match`
Enables you to evaluate a value with multiple patterns and then run code depending on which pattern corresponds.

**Parameters:**

| name | data type                          | explanation                                                           |
|------|------------------------------------|-----------------------------------------------------------------------|
| key  | string literal                     | the string literal that the data is to be matched against             |
| mode | Record<string literals, fn() => R> | A map of all possible string literals as keys, and closures as values |

**NOTE:** The return type of the closure of the first key-value pair will be enforced as the
return type for the remaining key-value pairs, allowing users to always get a
type-safe `match` statement.

### Usage

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
        if (pet.name === 'Alex the cat') {
            console.log('Legendary animal found!');
        }
        return `Put ${pet.name} on the ground`;
    }

    // If all values are not matched, the linter will detect it
});

console.log(`What you should do: ${instruction}`);
// Prints "What you should do: Put Alex the cat on the ground"
```
> **Important:** It is strongly recommended to use string literals
> (like `'Land' | 'Water`) instead of variable strings when using `match()`, else the linter will
> not detect it and thus may result in erroneous code being written.

## `vmatch`
`v` for variant. Allows you to use match statements with pattern matching.
Works with any object containing a `variant` field containing string literals.
Works with `Option` and `Result` types.

**Parameters:**

| name | data type                          | explanation                                                           |
|------|------------------------------------|-----------------------------------------------------------------------|
| key  | Object { variant: string literal } | An object containing a variant to match possible options against      |
| mode | Record<string literals, fn() => R> | A map of all possible string literals as keys, and closures as values |

### Usage
```ts
import { vmatch } from "./rustInterfaces";

type Shape =
    { variant: 'Circle', radius: number }
    | { variant: 'Rectangle', width: number };

// To force inference on the super-set, the variable is casted to the super-set type `Shape`
// Not needed for `Option` and `Result` types
const chosenShape = { variant: 'Rectangle', width: 20 } as Shape;
const msg = vmatch(chosenShape, {
    Circle: ({radius}) => `circle with radius of ${radius}`,
    Rectangle: ({width}) => `rectangle with width of ${width}`
});

console.log(msg); // Prints 'rectangle with width of 20'
```

## `OptionT<T>`
A replacement of `null`. Allows the user to safely handle variables that may initially have no value.

This type is best instantiated using the `OptionBuilder` type.

### Usage (+ vmatch on `Option`):
```ts
import { vmatch, OptionBuilder } from "./rustInterfaces";

type CatFoods = 'Tuna' | 'Chicken' | 'Packeted Food'
let plate = OptionBuilder.none<CatFoods>(); // Provides OptionT.None instance

function handleFood() {
    const msg = vmatch( plate, {
        // Values with 'Some' will return the `value` of generic type
        Some: ({ value: foodName }) => `Here eat your food: ${foodName}`,

        // No `value` field exists over here
        None: () => 'No food here yet'
    })

    console.log(msg);
}

handleFood() // Prints 'No food here yet'

// To update the option value you can use
plate = OptionBuilder.some<CatFoods>('Tuna');

handleFood(); // Prints 'Here eat your food: Tuna'

// If you don't want to exhaustively check, you can still make safe `if`
// statements
let msg = 'Should not be printed';
if (plate.variant === 'Some' && plate.unwrap() === 'Tuna') {
    msg = "That sounds fishy!"
}

console.log(msg); // Prints 'That sounds fishy!'
```

## `Result<T, K>`
Not all errors necessitate the complete halt of a program. There are instances where a function’s failure is due to an issue that can be readily understood and addressed.

The `Result<T, K>` construct is designed to manage scenarios where a program encounters a failure that is not critical.

Suppose you have a `Result` variable returned to you called `resVar`. You can use `match()` on `resVar.variant` to get either:
- `Ok`: the function call successfully worked. This will contain a `value` field with `T` in it
- `Err`: the function call failed. Unlike `Ok` this won't contain a `value` field, but will contain an `errKind` field in it instead. `errKind` will tell you what the _state_ of the error `K` is so that you can match on them and cater to each scenario based on your use case

allowing your code to decide what to do in each scenario exhaustively (therefore safely).

While both variants can use `resVar.unwrap()`, it is recommended to not use it knowingly before `resVar.variant` has been confirmed to be a `'Some'` value. If it's used on an `Result.Err` value, it will panic and the program/website will crash.

Examples for `Result` types will be shown below in `parsers` and `net`.

## `parsers`
Provides functions that safely execute and return the `Result<T, K>` variants of in-built parsing.

### `parsers.parseHtml`
Parses a HTML string. Returns either:
#### Success-case: `Result.Ok<Doc>`
```ts
{
    variant: 'Ok',
    unwrap: fn() => Doc
}
```
Where `Doc` is a [HTML document](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDocument) element

#### Failure-case: `Result.Err<'StringParseFailed' | 'QueryParseFailed'>`
If the html string could not be parsed
```ts
{
    variant: 'Err',
    errKind: 'StringParseFailed',
    unwrap: fn() => never // Panics in this case
}
```

If the html string could be parsed but could not be queried on
```ts
{
    variant: 'Err',
    errKind: 'QueryParseFailed',
    unwrap: fn() => never // Panics in this case
}
```

#### Usage:
```ts
import { vmatch, parsers } from "./rustInterfaces";

const exampleHtmlString = '<h1> You are safe </h1>';
const htmlRes = parsers.parseHtml(exampleHtmlString);
const msg = vmatch( htmlRes, {
    Ok: ({value: doc}) => {
        const message = doc.documentElement
            ? doc.documentElement.textContent.trim()
            : 'Nothing';
        return `Found message: ${message}`;
    },
    Err: ({errKind}) => `Parsing failed. Reason: ${errKind}`
})

console.log(msg); // Prints 'Found message: You are safe'
```

### `parsers.parseJSON<T>`
Parses a JSON string. Returns either:
#### Success-case: `Result.Ok<T>`
```ts
{
    variant: 'Ok',
    unwrap: fn() => T
}
```
Where `T` is a user-defined object

#### Failure-case: `Result.Err`
```ts
{
    variant: 'Err',
    unwrap: fn() => never // Panics in this case
}
```

#### Usage (+ vmatch on `Result`):
```ts
import { vmatch, parsers } from "./rustInterfaces";

const jsonStr = `
{
    "name": "Jungle",
    "population": 3000
}`

interface Habitat {
    name: string,
    population: number
}
const jsonRes = parsers.parseJSON<Habitat>(jsonStr)
const msg = vmatch( jsonRes, {
    Ok: ({ value: { name, population } }) => `${name} found with ${population} animals`,
    Err: ({errKind}) => `Habitat parsing failed due to ${errKind}`
})

console.log(msg); // Prints 'Jungle found with 3000 animals'
```

## `net`
Provides functions that safely execute in-built net-based operations.

### `net.fetch<T>`
Executes a fetch operation to get data from a back-end server as a `Result`

**Parameters:**

| name | data type            | explanation                                                                             |
|------|----------------------|-----------------------------------------------------------------------------------------|
| url  | string               | the URL location of the data                                                            |
| mode | 'String' _or_ 'JSON' | Whether the data return value is expected to be a string or json type. Defaults to JSON |

#### Success-case: `Result.Ok<T>`
```ts
{
    variant: 'Ok',
    unwrap: fn() => T
}
```
Where `T` is a user-defined object

#### Failure-case: `Result.Err<'FetchError' | 'ResponseError'>`
If the response can't be received, it returns:
```ts
{
    variant: 'Err',
    errKind: 'FetchError',
    unwrap: fn() => never // Panics in this case
}
```

If the response is received but the response status is not `.ok`, it returns:
```ts
{
    variant: 'Err',
    errKind: 'ResponseError',
    unwrap: fn() => never // Panics in this case
}
```

If the response is received but can't be parsed into a JSON object
```ts
{
    variant: 'Err',
    errKind: 'JsonParseError',
    unwrap: fn() => never // Panics in this case
}
```

If the response is received but can't be parsed into a text object
```ts
{
    variant: 'Err',
    errKind: 'TextParseError',
    unwrap: fn() => never // Panics in this case
}
```

#### Usage:
```ts
import { match, net } from "./rustInterfaces";

interface Elephant {
    name: string
    trunkLength: number
}
const url = 'http://nocodepanda.com/neofetch'

function logRes() {
    const elephantRes = await net.fetch<Elephant>(url);
    if (elephantRes.variant === 'Ok') {
        const {name, trunkLength} = elephantRes.unwrap();
        console.log(`Found elephant named ${name} with trunkLength: ${trunkLength}cm`);
        return;
    }

    // Early returns allows Result types to be inferred more precisely.
    // In this case, it's inferred to be of type Result.Err with all relevant
    // `errKind` states
    const msg = match( elephantRes.errKind, {
        FetchError: () => 'could not be received',
        ResponseError: () => 'was received but did not give `.ok`',
        TextParseError: () => 'could not be parsed as text',
        JsonParseError: () => 'could not be parsed as JSON'
    });

    const dbgMessage = `Could not fetch because the response ${msg}`
    console.log(dbgMessage);
}

logRes(); // Prints 'Could not fetch because the response could not be received'
```
