# Chapter 1: Algebraic Data Types (ADTs)
We live in a world governed by _state_. When we leave our home to go somewhere outside,
we are in our `Outdoors` state, and when we return home to enjoy our time
within our house, we are in our `Indoors` state. It seems fairly obvious that
what we do when we are outside is a different set of things from what we do when we
are indoors, but how do we design a program for that?

**Algebraic Data Types** allow us to model our data to represent states with different values.
Having different attributes assigned for each state comes with a great advantage: 
_invalid states become unrepresentable_.

But why should we model for state? Consider the non-Algebraic Data Type of a
class that represents our Outdoor/Indoor system in TypeScript:
```ts
class Person {
  isOutdoor: boolean;
  treesSpotted: string;
  sleepingRoom: string;

  // other methods...
}
```

This representation of `Person` begs the question: How can someone have
a `treesSpotted` and a `sleepingRoom` field at the same time? The only way
to mitigate any upcoming erroneous implementations while keeping these fields in
the same class is to use a `null` or default value and constantly check for it. But by
designing the class like that, you:
- start meaninglessly introducing the need for non-obvious boolean checks
- make implementations that are highly dependent on documentation that
explains why your code was written the way it was

All of which starts to compoundingly increase the chances you have to make
human errors.

The worst part is that - since this isn't a syntax issue and a logical
issue - the compiler will never tell you that there is an error waiting to happen
when it does.

## Is the `class` syntax a mistake?
Classes are **not** a mistake if state-modelling is the issue at hand; they can still
be used to model state.

Consider the following code, modelled to follow an Algebraic Data Type:
```ts
abstract class PersonActivity {}

class IndoorActivity extends PersonActivity {
  sleepingRoom: number;

  constructor(sleepingRooms: number) {
    super();
    this.sleepingRoom = sleepingRoom;
  }
}

class OutdoorActivity extends PersonActivity {
  treesSpotted: number;

  constructor(treesSpotted: number) {
    super();
    this.treesSpotted = treesSpotted;
  }
}

class Person {
    activity: PersonActivity;

    constructor(activity: PersonActivity) {
        this.activity = activity;
    }
}
```
You can combine **abstract classes** (to prevent creating a non-representable class)
with **inheritance** (to allow creating valid states) to break down `PersonActivity`
into its two valid states of `IndoorActivity` and `OutdoorActivity`.

As shown in the example, this could also be combined with **composition** by
making a Person _composed_ of an `activity` rather than be identified by it.

By combining composition with abstract classes and inheritance, you are
effectively saying that a person's activity _must_ be either that of
`OutdoorActivity` or `IndoorActivity` (not both), and that way you solve the
modelling issue.

## Caveats of classes
Classes are not perfect. They don't necessarily cause mistakes, but they do
introduce a developer experience issue: they require learning **conventions**
(like using abstraction and inheritance to model complex states) to implement
them safely.

Due to the way it's designed the `PersonActivity` class itself doesn't state
which classes implement it, making it hard to maintain once the codebase starts
growing larger.

Furthermore, there is nothing stopping developers from writing a
class like the one in the first snippet of this chapter, which can lead to
the problems mentioned previously.

While not an issue, it does also come with another inconvenience: classes aren't 
exported in a universally defined way. While it's completely fine to define your
own exports, having no default does make it an inconvenience.

## How Rust does it:
Rust takes away the issues that comes with classes by modelling state using
`enum` values, which also make it a lot easier to read:
```rust
enum PersonActivity {
    Outdoor { trees_spotted: u32 }, // u32 is a number
    Indoor { sleeping_rooms: u32 }
}
```
By modelling it like this, you now know exactly which states you can expect
from `PersonActivity`, which allows you to benefit from **exhaustive pattern
matching**. When we use this enum as a data-type, we can exhaustively check
every variant of `PersonActivity` and match it against the different
implementations required for each variant.


Suppose we want to make a program that comments on a person's state.
Rust is designed for us to write robust software by forcing us to
handle every variant of `PersonActivity` before we can compile it:
```rust
// Rust code
enum PersonActivity {
    // Add different variants of PersonActivity
    Outdoor { trees_spotted: u32 }, // u32 is a number
    Indoor { sleeping_rooms: u32 }
}

// Make a comment on the person's activity
fn log_activity(activity: PersonActivity) {
    // Exhaustively cater to every possible activity
    let message = match activity {
        PersonActivity::Indoor { sleeping_rooms } =>
            format!("In a house with {sleeping_rooms} sleeping rooms"),

        PersonActivity::Outdoor { trees_spotted } =>
            format!("Outside, scouted {trees_spotted} trees"),
    };

    println!("{}", message);
}

// Demonstration of usage
fn main() {
    let mut person_activity = PersonActivity::Indoor{ sleeping_rooms: 3 };
    log_activity(person_activity); // "In a house with 3 sleeping rooms"

    person_activity = PersonActivity::Outdoor { trees_spotted: 5 };
    log_activity(person_activity); // "Outside, scouted 5 trees"
}
```
This exhaustive matching with a returned value is unavailable in TypeScript
natively, but with `crabSafe`, it can be done.

## How crabSafe does it:
Heavily inspired from Rust's way of handling it, crabSafe allows you to implement
it in the same way that Rust does it, but in a way that TypeScript would understand:

```ts
// TypeScript code
import { vmatch } from "./crabSafe";
type PersonActivity =
  // Add different variants of PersonActivity
  | { variant: 'Outdoor', treesSpotted: number }
  | { variant: 'Indoor',  sleepingRooms: number }

function logActivity(activity: PersonActivity) {
    // Exhaustively cater to every possible activity
    const message = vmatch(activity, {
        Outdoor: ({ treesSpotted }) => `Outside, scouted ${treesSpotted} trees`,
        Indoor: ({ sleepingRooms }) => `In a house with ${sleepingRooms} sleeping rooms`,
    });

    console.log(message);
}

// Demonstration
function main() {
    let personActivity: PersonActivity = {
        variant: 'Indoor',
        sleepingRooms: 3
    };
    logActivity(personActivity); // "In a house with 3 sleeping rooms"
    
    personActivity = {
        variant: 'Outdoor',
        treesSpotted: 5
    };
    logActivity(personActivity); // "Outside, scouted 5 trees"
}
```
Now there is a lot going on here. Let's look at every segment.

The first segment is an import statement. This allows you to import the
`vmatch` function from crabSafe, which acts like Rust's `match` statement,
but focused on TypeScript's version of of discriminated unions (shown in the next
paragraph).

The next segment is the aforementioned **discriminated union** type. The
common field `variant` is called a "discriminant" or "tag", and represents the
unique states each type can have. Notice how they are not assigned as a `string`
but rather as a **literal**? This is how the linter determines the difference
between each and every variant.

<div class="warning">
<strong> Warning: </strong> Do <strong> not </strong> use a
<code> string </code> type for the variant, else the linter will never catch
it and erroneous code will be inevitably written.

Use string <em> literals </em> like "Indoor", "Outdoor" (or any string literal)
for type annotation and not the <code> string </code> data-type.
</div>

The next segment is a function `logActivity` which takes a parameter of `activity`
of type `PersonActivity`. Notice how it doesn't take any individual state but
rather the whole `PersonActivity` type itself. This is to encourage matching
each and every variant of the discriminated union.

Since the `activity` parameter has a `variant` attribute for every state, we
can match it against all its variants using `vmatch`, as shown in the `logActivity`
function. The first parameter of the `vmatch` function is the value that contains
the `variant` attribute, and the second parameter is a special dictionary.

The dictionary consists of keys of the string literals defined in the
`PersonActivity` (in this case it would be the `Outdoor` and `Indoor`
variants) and it maps to special callback values that contain all the
unique fields of that variant.

Following that is a little demonstration of how to assign values accordingly and
get a value from it.

## Advantages over classes
- `vmatch` doesn't work if there is no _variant_ field in the discriminated union.
  Thus, by default, the developer is warned by the linter every time they try
  to use `vmatch` on invalid data types. The only rule the developer must know
  is to never assign the _variant_ field to a string, as stated previously.
  Every other time, the linter will warn the developer of potentially erroneous
  code being written
- The discriminated union always states which variants it has, allowing the
  developer to quickly see what variants are assigned cater to each of them
  accordingly
- The discriminated union can be exported to JSON by default by using `JSON.parse`
  on it (separate chapter coming for this soon). This allows you to communicate
  with the back-end and other sources in a universally structured way
