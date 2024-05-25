# rustInterfaces Guide Book
Welcome to the _rustInterfaces book_, a book that teaches you how to use the rustInterfaces
library. This library helps you write reliable software by leveraging TypeScript's
type system and using it in a way reminiscent of code written in
[the Rust programming language](https://www.rust-lang.org/).

## Who is this for
This library is ideal to a variety of people for all kinds of reasons. Here are a few
groups that could benefit from this book:

### People who value writing safe-code
By leveraging the concepts used in Rust (which in turn was influenced [from other languages too](https://doc.rust-lang.org/reference/influences.html)), this library helps you write code that the TypeScript
linter can easily catch and warn you about before you even commit your code,
let alone pushing it to production.

### People that value safe interoperability between the server and client-side
Many functional libraries (like [fp-ts](https://gcanti.github.io/fp-ts/)) and libraries made for robust
error-handling (like [effect-ts](https://effect.website/)) implement their
features by leveraging JavaScript's `class` syntax for creating safe code.

On the other hand, rustInterfaces embraces JavaScript's `object` syntax for
achieving a simple and customizable codebase that focuses on safety.
This comes with the advantage of letting the developer create full-stack applications with _the
same TypeScript interfaces_ on both the back-end and the front-end, which brings several advantages:
- reduced mantainance
- easy and customizable state memoization
- enhanced front-end insight through detailed back-end responses

These will be covered in project chapters that will be implemented as the book
grows.

### Teams that benefit from incremental changes
This library is written to embrace JavaScript and TypeScript features while
subtly adding to them. This way, developers **don't** have to learn everything
from scratch just to commit to a library they may not even prefer at some point.

If you've decided that for your codebase, you want to "rewrite it in rust", but
are unsure about how well the migration would fit, this library can be used as
a middleground of sorts.

### Rustaceans
People that code in Rust (also known as "rustaceans") often find
themselves in a project that also uses TypeScript. As the most-loved language for over
8 years in a row, rustaceans often find themselves missing Rust concepts when
they code in TypeScript.

This library allows you to write code resembling Rust code within your TypeScript project.
It is by far the easiest to learn for rustaceans.

## How to read this book
This book aims to teach these concepts primarily through code snippets, but will
elaborate on concepts that aren't broadly taught in programming (like null-safety
and algebraic data types).

This implies that the I (the author) will try my best to write it so that you can
open any chapter, learn its concepts and apply it into your projects with precision
and agility, leveraging all the advantages you get with this library.
