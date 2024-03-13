<p align=center>
    <img src='./images/Crabbie.png' style="width: 150px; height: 150px;">
</p>

<h1 align=center> Rust Interfaces </h1>

Are you a Rustacean who also codes in TypeScript? And do you feel like 
TypeScript doesn't provide the same feeling of safety that Rust does?

You aren't alone. This is a common feeling that TypeScript-coding Rustaceans feel. 
We miss the feeling of coding in Rust wherever we go, and we're right to miss them 
the way we do.

That's why this repo aims to implement a kind of _interface_ that attempts to bridge 
the advantages that Rust brings to the table into the world of TypeScript.

<img src='./images/Snippet.png' style="display: block; margin: auto; margin-bottom: 20px; max-height: 400px; border-radius: 15px; border: 3px solid #000;">

Inspired by [this shorts video](https://www.youtube.com/shorts/3iWoNJbGO2U), I feel like it would be
a quality of life advantage to have this feature addressed.

# Common Questions
<details>
<summary> Why not use `Effect` or `fp-ts`? </summary>

If you are willing to learn the extra concepts, [Effect](https://effect.website/) or [fp-ts](https://gcanti.github.io/fp-ts/) _should_ be the choice of use while this library is still young.

However, if you are okay with a 100% code coverage library even though it's still young, rustInterfaces has its set of advantages:
- **Safe by default:** Making sure that the written code is safe is the first priority. The library empowers programmers to write safe code by producing `Result` types for core JavaScript functions, signaling when error handling is necessary, in contrast to the compiler’s assumption of pervasive try-catch blocks without explicit notifications.
- **Easier to learn:** One of the goals of rustInterfaces is to make it _easy_ to write safe code. While this may especially apply for people that code in Rust, the documentation aims to make it easy even for people without a Rust-based background.
- **Easier to shift gears between FP-oriented projects:** If you had a Functional Programming (FP) project and had to shift to TypeScript to continue your project, or even if you had to switch from your Rust project to your `Effect`-integrated TypeScript project, chances are you might have a bit of lag and discomfort getting out of your programming flow to re-enter another one. This library aims to make the flow-shifting a lot more seamless.

</details>

<details>
<summary> By replacing null with an Option type, TypeScript no longer does its implicit null-checks. Aren't you undermining TypeScript's safety features to push your own? </summary>

What if you could get all the benefits of null-checks and _also_ methods that help you account for different situations and _also_ the ability to use `match` statements on it?

Besides null-safety, this library also leverages TypeScript to provide `Result` types that helps the programmer handle different kinds of errors based on the different _states_ that the error originates from.

What `rustInterfaces` is trying to do is to provide interfaces that help programmers _maximize_ TypeScript's safety features, not undermine them.

</details>

<details>
<summary> Rust's language and syntax doesn't belong in JavaScript/TypeScript. Why bring it here? </summary>

One of the most common complaints in JavaScript and TypeScript is how it implicitly expects the programmer to handle errors without even telling them where potential errors will occur.

The way Rust solves this issue also happens to be one of the most-appreciated aspects of the language.

**Does that mean TypeScript has to solve it *the Rust way*?**

Not necessarily. As with many problems, this problem has multiple solutions. The best solution is the one that brings the most familiarity to the individual/team while still getting the job done. If you are familiar with using Rust-like syntax to write safe code, this might be the solution for you.

</details>

<details>
<summary> Others have tried this and it didn't grow well. Why try it again? </summary>

The truth is others _keep trying this_ even if it doesn't grow, and that this library is one of the many that decided to try making it work.

My motivation isn't centered around getting others to use it. It's something that personally works for me: This API was born as an internal API in one of my private projects before it got generalized enough to be a library. I have been coding with it and have benefitted from it quite well. As a result, I'm more than happy to keep it growing.

PRs are still welcome! I still value everyone's opinion and will always be more than happy in making this work for whoever also wants to make it work.

</details>

<details>
<summary> It's great that you will keep growing this, okay sure, but what does this offer differently? </summary>

One thing I noticed other APIs like this to do is that they provide an API for people to use but never _adapted it to be compatible with the core library_. This causes several issues:
- People using both _otherSolution_ and the core-js library will have to spare more mental energy juggling through both concepts just to get code working. If one of them have to go, and if it can't be core-js...
- There is no point in learning and shifting a codebase to an API that will take time to learn and doesn't even account for the most basic of situations
- If a team wants to bring along the correctness of functional programming, they may as well just use something as fleshed-out as `Effect`, _even if it has an extra learning curve_.

Thus what `rustInterfaces` aims to do differently is to provide API that works _as if it's integrated into the core-api_ within the client-side (and if it grows, then maybe on the server-side too).

</details>
<br />

# Setup
1. Copy the `rustInterfaces.ts` file into your environment wherever you want to use it.
2. Remove the `import { DOMParser, Document }` statement if you are using it in client-side code or non-deno code

**Optional:** Rename it to have the `tsx` extension if you want to include JSX.

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

## `OptionT<T>`
A replacement of `null`. Allows the user to safely handle variables that may initially have no value.

This type is best instantiated using the `OptionBuilder` type.

### Usage
```ts
import { match, OptionBuilder } from "./rustInterfaces";

type CatFoods = 'Tuna' | 'Chicken' | 'Packeted Food'
let plate = OptionBuilder.none<CatFoods>(); // Provides OptionT.None instance

function handleFood() {
    const msg = match( plate.variant, {
        // Values with 'Some' will return the internal value when unwrapped
        'Some': () => `Here eat your food: ${plate.unwrap()}`,
        'None': () => 'No food here yet'
    });

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

You can use `match` on `resultVariable.variant` to get either:
- `Ok`: the function call successfully worked, or
- `Err`: the function call failed

allowing your code to decide what to do in each scenario.

While both variants can use `resultVariable.unwrap()`, it is recommended to not use it knowingly before `resultVariable.variant` has been confirmed to be a `'Some'` value

Examples will be shown below in `parsers`.

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

#### Failure-case: `Result.Err`
Representing that the html string could not be parsed
```ts
{
    variant: 'Err',
    unwrap: fn() => never // Panics in this case
}
```

#### Usage:
```ts
import { match, parsers } from "./rustInterfaces";

const exampleHtmlString = '<h1> You are safe </h1>';
const htmlRes = parsers.parseHtml(exampleHtmlString);
const msg = match( htmlRes.variant, {
    'Ok': () => {
        // Safe to unwrap over here due to being `Ok` checked
        const doc = htmlRes.unwrap() as Document
        const message = doc.documentElement
            ? doc.documentElement.textContent.trim()
            : 'Nothing';
        return `Found message: ${message}`;
    },
    'Err': () => 'No message found'
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

#### Usage:
```ts
import { match, parsers } from "./rustInterfaces";

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
const msg = match( jsonRes.variant, {
    'Ok': () => {
        const {name, population} = jsonRes.unwrap();
        return `${name} found with ${population} animals`;
    },
    'Err': () => 'Habitat parsing failed'
})

console.log(msg); // Prints 'Jungle found with 3000 animals'
```

## `net`
Provides functions that safely execute in-built net-based operations.

### `net.fetch<T>`
Executes a fetch operation to get data from a back-end server as a `Result`

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
        const elephantVals = JSON.stringify(elephantRes.unwrap());
        console.log('Found elephant data with values:\n'.concat(elephantVals));
        return;
    }

    // Early returns allows Result types to be inferred more precisely.
    // In this case, it's inferred to be of type Result.Err<'FetchError' | `ResponseError`>
    const msg = match( elephantRes.errKind, {
        'FetchError': () => 'could not be received',
        'ResponseError': () => 'was received but did not give `.ok`',
    })

    const dbgMessage = `Could not fetch because the response ${msg}`
    console.log(dbgMessage);
}

logRes(); // Prints 'Could not fetch because the response could not be received'
```
