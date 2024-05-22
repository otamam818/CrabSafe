import { assertEquals, fail } from "https://deno.land/std@0.219.0/assert/mod.ts";
import { OptionBuilder, vmatch, match, parsers } from "./rustInterfaces.ts";

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

Deno.test(function parsersTestObject() {
    interface Dog {
        age: number,
        species: {
            variant: string,
            location: string
        }
    }
    const someObj = {
        age: 21,
        species: {
            variant: 'Golden Retriever',
            location: 'Scotland'
        }
    }
    let result = parsers.parseObject<Dog>(someObj, [
     ['age', 'number'],
     ['species', [
       ['variant', 'string'],
       ['location', 'string']
     ]]
    ]);

    assertEquals(result.unwrap().age, 21);

    result = parsers.parseObject<Dog>(someObj, [
     ['age', 'number'],
     ['species', []]
    ]);

    if (result.variant === 'Ok') {
        fail("datatypes should not be empty arrays")
    }

    assertEquals(result.errKind, 'DataTypeSpecificationError')

    result = parsers.parseObject<Dog>(someObj, [
     ['age', 'string'],
     ['species', [
       ['variant', 'string'],
       ['location', 'string']
     ]]
    ]);

    if (result.variant === 'Ok') {
        fail("Wrong datatypes should be caught")
    }

    assertEquals(result.errKind, 'TypeError')

    result = parsers.parseObject<Dog>(someObj, [
     // @ts-ignore forcing a fail
     ['agex', 'number'],
     ['species', [
       ['variant', 'string'],
       ['location', 'string']
     ]]
    ]);

    if (result.variant === 'Ok') {
        fail("Mismatching key values between object and validator array should be caught")
    }

    assertEquals(result.errKind, 'KeyMismatchError')

    result = parsers.parseObject<Dog>(someObj, [
     ['age', 'number'],
     ['species', [
       // For some reason TypeScript can't catch nested values
       ['variantx', 'string'],
       ['location', 'string']
     ]]
    ]);

    if (result.variant === 'Ok') {
        fail("Mismatching key values between object and validator array should be caught")
    }

    assertEquals(result.errKind, 'KeyMismatchError')
});