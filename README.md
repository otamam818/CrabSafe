<p align=center>
    <img src='./images/Crabbie.png' style="width: 150px; height: 150px;">
</p>

<h1 align=center> 🦀 Safe </h1>

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

It also has a code coverage of 100% 🔥.

# Common Questions
<details>
<summary> Why not use `Effect` or `fp-ts`? </summary>

If you are willing to learn the extra concepts, [Effect](https://effect.website/) or [fp-ts](https://gcanti.github.io/fp-ts/) _should_ be the choice of use while this library is still young.

However, if you are okay with a 100% code coverage library even though it's still young, crabSafe has its set of advantages:
- **Safe by default:** Making sure that the written code is safe is the first priority. The library empowers programmers to write safe code by providing `Result` types for core JavaScript functions, signaling when error handling is necessary, in contrast to the compiler’s assumption of pervasive try-catch blocks without explicit notifications.
- **Easier to learn:** One of the goals of crabSafe is to make it _easy_ to write safe code. While this may especially apply for people that code in Rust, the documentation aims to make it easy even for people without a Rust-based background.
- **Easier to shift gears between FP-oriented projects:** If you had a Functional Programming (FP) project and had to shift to TypeScript to continue your project, or even if you had to switch from your Rust project to your `Effect`-integrated TypeScript project, chances are you might have a bit of lag and discomfort getting out of your programming flow to re-enter another one. This library aims to make the flow-shifting a lot more seamless.

</details>

<details>
<summary> By replacing null with an Option type, TypeScript no longer does its implicit null-checks. Aren't you undermining TypeScript's safety features to push your own? </summary>

What if you could get all the benefits of null-checks and _also_ methods that help you account for different situations and _also_ the ability to use `match` statements on it?

Besides null-safety, this library also leverages TypeScript to provide `Result` types that helps the programmer handle different kinds of errors based on the different _states_ that the error originates from.

What `crabSafe` is trying to do is to provide interfaces that help programmers _maximize_ TypeScript's safety features, not undermine them.

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

My motivation isn't centered around getting others to use it. **It's something that personally works for me**: This API was born as an internal API in one of my private projects before it got generalized enough to be a library. I have been coding with it and have benefitted from it quite well. As a result, I'm more than happy to keep it growing. What this means is that this library will inevitably grow into a large library irrespective of its adoption.

PRs are still welcome! I still value everyone's opinion and will always be more than happy in making this work for whoever also wants to make it work.

</details>

<details>
<summary> It's great that you will keep growing this, okay sure, but what does this offer differently? </summary>

One thing I noticed other similar APIs do is that they provide an API for people to use but never _adapted it to be compatible with the core library_. This causes several issues:
- People using both _otherSolution_ and the core-js library will have to spare more mental energy juggling through both concepts just to get code working. If one of them have to go, and if it can't be core-js...
- There is no point in learning and shifting a codebase to an API that will take time to learn and doesn't even account for the most basic of situations
- If a team wants to bring along the correctness of functional programming, they may as well just use something as fleshed-out as `Effect`, _even if it has an extra learning curve_.

Thus what `crabSafe` aims to do differently is to **provide API that works _as if it's integrated into the core-api_** within the client-side (and if it grows, then maybe on the server-side too).

</details>
<br />

# Setup
An installer is being made for this, but for now, feel free to use `rustInterfaces`,
the previous version:
1. Copy the `rustInterfaces.ts` file into your environment wherever you want to use it.
2. Remove the `import { DOMParser, Document }` statement if you are using it in client-side code or non-deno code

**Optional:** Rename it to have the `tsx` extension if you want to include JSX.

# Quick Demonstration
In TypeScript, this perfectly compiles:
```ts
interface Elephant {
    name: string
    trunkLength: number
}
const url = 'http://nocodepanda.com/neofetch'

function logRes() {
    try {
        const elephantRes = await fetch(url);
        const {name, trunkLength: len} = await elephantRes.json() as Elephant;
        console.log(`elephant: ${name}, trunk length: ${len}cm`);
    } catch (error) {
        // Elaborate string explaining itself only when the program crashes
        throw new Error(`Failed: ${error}`)
    }
}
```
The programmer is expected to know what is going on here and supposedly handle
every error case with only the error's description as context. If you put try-catch blocks everywhere, you
sacrifice the readability of the program. It's either too complicated to read or error-prone.

It's as if this implementation is waiting for you to write an erroneous
program so that you can crash it and deal with it. Why not start by writing safer code instead and handle potential issues from there?



## What does crabSafe do?
crabSafe provides interfaces (inspired from Rust, which was inspired from other languages) that make it easier to write error-proof code (testing is still encouraged!)
while still being easy to read and understand. In crabSafe, the previous example would be done this way:
```ts
import { match, net } from "./crabSafe";

interface Elephant {
    name: string
    trunkLength: number
}
const url = 'http://nocodepanda.com/neofetch'

function logRes() {
    const elephantRes = await net.fetch<Elephant>(url);

    // This returns a `Result` type that contains the fetch value only if successful
    if (elephantRes.variant === 'Ok') {
        const {name, trunkLength} = elephantRes.unwrap();
        console.log(`Found elephant named ${name} with trunkLength: ${trunkLength}cm`);
        return;
    }

    // - Early returns maximize typescript inference, narrowing down to Result.Err 
    // - `match()` can cater to all relevant `errKind` states for the problem
    // - Unlike `switch`, `match()` returns a value
    const msg = match( elephantRes.errKind, {
        // Instead of returning a string like in this case, you can now
        // handle each and every potential error
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
Now you have multiple states that are understandable and easy to handle based on
your program's use case.

Where previously none of the errors would be assigned their own state, crabSafe allow you to handle each and every potential error state

## But I want Rust's pattern matching too
crabSafe has pattern matching via `vmatch`. It's usage can be seen in various places in the documentation:
- [Using `vmatch` on the Result type](./docs/README.md#usage--vmatch-on-result)
- [Using `vmatch` on the Option type](./docs/README.md#usage--vmatch-on-option)
- [Using `vmatch` on your own types](./docs/README.md#vmatch)


## Documentation
See [the documentation file](./docs/README.md) for all the things that crabSafe offers.