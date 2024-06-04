# Embracing Advancements
This chapter talks about why this library was made by exploring
the history of progress in programming. If the title gave it away,
or if you just want to dive in, feel free to skip this chapter.

## The birth of a century-defining idea
The programming world of today is very different to what we had 100 years ago.
Back then, the norm was to use mechanical devices and punch cards to create
a primitive version of "programs". But it was cumbersome, had many
repetitive tasks and required very specialized knowledge just to get it
working.  It was too costly and impractical for most people and small organizations.
The norm needed to change.

Slowly but surely, the norm did change, and it started with the birth of
programming languages. With programming languages, we no longer needed to
manually set switches and patch cords and instead could type out instructions
for the computer to abide by.

What was once less accessible could now be embraced by typing out instructions
in place of manual labor. Although the cost of hardware and expertise remained
a barrier at the time, this marked a significant turning point in making technology more
accessible to a wider range of people. With programming languages, the era of
computers became less about privilege and more about possibility, paving the
way for a future where technology would become an integral part of everyday life.

## The popular problem-children
One of the earliest high-level programming languages was **COBOL**. In comparison to
binary language and assembly, it felt like a god-send, and in many cases was the
starting point of a chain of programming languages to come.

But why did new programming languages need to come if they all provided the same
benefit of letting you type out your programs?

To many, the **language design** of COBOL started to feel meaninglessly complicated.
You found yourself having to keep a strong mental model for how the registers in the machine
was working just to carry out simple tasks. A simple division program would look like this:
```COBOL
PROGRAM-ID. AVERAGE.

DATA DIVISION.
WORKING-STORAGE SECTION.
01  NUM1      PIC 9(5).
01  NUM2      PIC 9(5).
01  AVG       PIC 9(5)V99.

PROCEDURE DIVISION.
    MOVE 10 TO NUM1.
    MOVE 20 TO NUM2.
    ADD NUM1 TO NUM2 GIVING AVG.
    DIVIDE 2 INTO AVG.
    DISPLAY "AVERAGE IS: ", AVG.
    STOP RUN.
```
Not everyone was happy about how language felt so cryptic and distant from the focus
of the problem they had to solve.

## Why fame was lost as a favor
As programming evolved and COBOL as a language roughly stayed the same, two
schools of thought started to arise:
1. "Why must we keep programming in the cryptic way of COBOL? Can we do better at abstracting unneeded things away?"
2. "Why do people complain about COBOL? It works, has conventions, and gets the job done. If you can't code in it, you're just not skilled enough"

Which side was right? It's easy to say in retrospect that the first side was correct,
but it's not like the second side was wrong either - truly COBOL programs could
_still_ do many things that modern programming langugages can do today too.

But had the **only** school of thought been that of the latter, we wouldn't see
progress nearly as much as we have today:
- People would be _repeating tasks_ that could have been otherwise abstracted
- The lack of intuitiveness would often have _pushed away programmers_ of the coming age
- Repeating tasks endlessly could have compounded into technical debt, pushing back
technological progress
- Less programmers would have resulted in less technological progress

Then came the **C family of languages** and suddenly things started feeling a lot more
intuitive. Soon after, you no longer needed to think too strongly about registers and could
focus more on programming using _intuitively designed languages_:
- **C language** gave us intuitive symbols and a good _imperative, procedural programming_ system
- **C++ and Java** popularized _Object Oriented Programming_ and gave us a way to structure
commonly used variables together and create functions (called methods) tied
to these variables.
- **Python** provided a way for Data Scientists to _iterate their data-analytics with
agility_ and revolutionize the Machine Learning industry.
- **JavaScript** provided a way for web developers to _iterate their web ideas with agility_
and revolutionize the world of the internet. Alongside Python, C and Java, it was a
great starting point for many new programmers

Everything was much **easier to understand** by a magnitude and programs were much
easier to write than ever before. COBOL became a relic of the past for most companies
and programming became more available to a larger population. Thousands of
meaningful programs have since been made and we have reached an era full of useful programs.

That was decades ago. _Surely we learned from it_, right? Surely we all now know
that _celebrated ideas must grow to remain celebrated_, right?

Not entirely. Not all of us at least, but that is to be expected - after all,

> "_We Learn From History That We Do Not Learn From History_"  
> **\- Georg Hegel, 1837**

## What did we not learn?
Many of us didn't learn that _**conventions** are a mean to an end, not the final solution._
As software development grew and teams became larger, code readability had become of
essence. You wanted ideomatic conventions to read and write code in a way
clearly understood among teams. It allowed teams to redirect their time from trying
to understand the written code to actually writing useful code.

Having conventions that are universally followed is a great thing. But turning a
convention into an unchangeable norm is where the problem starts. By sticking to
a convention forever, you automatically resign yourself to forever having all the problems
that come along with said convention.

This is true _even for modern software_. Despite following coding conventions, lots
of modern software still come with a series of bugs. Even repos with the strictest
commit-merging policies aren't safe from issues. If coding conventions were the
final solution, these problems shouldn't have existed to begin with.

Taking a page off the COBOL-supporter train of thought, isn't that just a
skill-issue? I definitely agree that it is, whether it's lack of foresight or
lack of intention to write a good program. Hopefully, someone with several
years of experience will know enough conventions to avoid all pitfalls less frequently.
That said, by labeling it a "skill-issue" and only blaming the programmer for not
following conventions, aren't we effectively choosing to let this problem remain
rather than solving it?

## The modern-day push for the future
**The Rust language** is to C language what C language was to COBOL - a better-designed language
that provides quality-of-life improvements in developer experience and code correctness.
It serves as a great example that code doesn't have to be written erroneously
by default. Instead, the Rust compiler refuses to compile the code in many
cases when erroneous code is written, catching a wide range of errors at compile-time.
By being a very young language in comparison to many of its alternatives, it doesn't
come built-in with the problems that other programming-languages needed to create
conventions to work around. But because it's so new, it also comes with a host of _temporary_ problems:
1. It doesn't have a production-tier ecosystem in certain sectors like many older languages do
2. Its worldwide adoption hasn't sprouted yet and thus can't be solely used in
many impactful projects today

On the other end, _JavaScript_ - despite being roughly **20 years older** than Rust -
is still an ever-growing language with a framework/library being written for it
almost every day. Yet, no matter how many frameworks are written for it, one truth
remains:

**The only part of JS that everyone unanimously uses is the standard library,
which doesn't have everything that's available in modern programming languages**

But while the standard library is still on its way to having the same benefits that languages
like Rust does - or when Rust grows enough to meaningfully replace JavaScript - frameworks
and libraries are the best way we can mitigate the lack of standard library features.

## How is crabSafe relevant in this context?
This library attempts to bring the benefits of languages like Rust into the
ecosystem-rich world of JavaScript through the type system of TypeScript,
a super-set of JavaScript that works as a replacement for it.
Despite a few conventions already being set in place prior to its release,
the aim is to create a quality of life improvement where the linter could
automatically find potential mistakes for you.

You shouldn't have to search every nook and cranny of your codebase to check
if a convention has been maintained, its better to design the program to find
issues for you.

## Conclusion
Taking a step in this direction is in hopes that we can learn more from what we know
and eventually grow away from this library too in favor of a better solution. If we
programmed in COBOL from its inception up until now, the world most likely
wouldn't have progressed as much as it has today.
