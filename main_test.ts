import { assertEquals } from "https://deno.land/std@0.219.0/assert/mod.ts";
import { OptionBuilder, vmatch, match, parsers, net } from "./rustInterfaces.ts";

Deno.test(function optionTest() {
    type CatFoods = 'Tuna' | 'Chicken' | 'Packeted Food'
    let plate = OptionBuilder.none<CatFoods>(); // Provides OptionT.None instance

    function handleFood() {
        const msg = vmatch( plate, {
            // Values with 'Some' will return the internal value when unwrapped
            Some: ({ value: foodName }) => `Here eat your food: ${foodName}`,
            None: () => 'No food here yet'
        })

        return msg
    }

    assertEquals(handleFood(), 'No food here yet');

    // To update the option value you can use
    plate = OptionBuilder.some<CatFoods>('Tuna');

    assertEquals(handleFood(), 'Here eat your food: Tuna');

    let msg = 'Should not be printed';
    if (plate.variant === 'Some' && plate.unwrap() === 'Tuna') {
        msg = "That sounds fishy!"
    }

    assertEquals(msg, "That sounds fishy!");
});


Deno.test(function matchTest() {
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
        Water: () => `Place ${pet.name} in the tank`,

        // Or you can write program logic to compute special cases
        Land: () => {
            if (pet.name === 'Alex the cat') {
                console.log('Legendary animal found!');
            }
            return `Put ${pet.name} on the ground`;
        }

        // If all values are not matched, the linter will detect it
    });

    assertEquals(instruction, 'Put Alex the cat on the ground');
});

Deno.test(function parsersTestHTML() {
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

    assertEquals(msg, 'Found message: You are safe')
});

Deno.test(function parsersTestJSON() {
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

    assertEquals(msg, 'Jungle found with 3000 animals')
});

Deno.test(async function parsersTestFetchFail() {
    interface Elephant {
        name: string
        trunkLength: number
    }
    const url = 'http://nocodepanda.com/neofetch'

    const elephantRes = await net.fetch<Elephant>(url);
    if (elephantRes.variant === 'Ok') {
        const {name, trunkLength: len} = elephantRes.unwrap();
        console.log(`Elephant: ${name}, trunk length: ${len}cm`);
        return;
    }

    const msg = match( elephantRes.errKind, {
        FetchError: () => 'could not be received',
        ResponseError: () => 'was received but did not give `.ok`',
        TextParseError: () => 'could not be parsed as text',
        JsonParseError: () => 'could not be parsed as JSON'
    });

    const dbgMessage = `Could not fetch because the response ${msg}`;
    assertEquals(dbgMessage, "Could not fetch because the response could not be received")
});

Deno.test(async function parsersTestFetchFailNoRinf() {
    interface Elephant {
        name: string
        trunkLength: number
    }
    const url = 'http://nocodepanda.com/neofetch'

    try {
        const elephantRes = await fetch(url);
        const {name, trunkLength: len} = await elephantRes.json() as Elephant;
        console.log(`elephant: ${name}, trunk length: ${len}cm`);
    } catch (error) {
        // Expected to know what is going on here and supposedly handle
        // every case without context with program logic here...

        /* Elaborate string explaining itself only when the program crashes
           this would be done using:

           throw new Error(`Failed: ${error}`)
         */
        console.log(`Failed: ${error}`)
    }
});

Deno.test(function matchVariantWorks() {
    type Shape =
        { variant: 'Circle', radius: number }
        | {variant: 'Rectangle', width: number};

    const chosenShape = { variant: 'Rectangle', width: 20 } as Shape;
    const msg = vmatch(chosenShape, {
        Circle: ({radius}) => `circle with radius of ${radius}`,
        Rectangle: ({width}) => `rectangle with width of ${width}`
    });

    assertEquals(msg, 'rectangle with width of 20');
});