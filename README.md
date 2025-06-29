# Pipeline Transform

Pipeline Transform is a library for interacting with sequences in TypeScript in a type-safe, pipeline-structured way.  It's great for:

- Efficient data pipelines
- Handling infinite or never-ending sequences
- Simplifying performing async operators on collections

## How to

Start by creating a PipelineTransform instance via `PipelineTransform.from`.  It accepts arrays or anything iterable (like generators):

```ts
import { PipelineTransform } from "PipelineTransform";

const pt = PipelineTransform.from([1, 2, 3, 4, 5]);
```

From here, chain on as many sequence operators as you'd like:

```ts
const pt = PipelineTransform.from([1, 2, 3, 4, 5])
  .map(x => x * 2)
  .filter(x => x >= 4)
  .map(x => x.toString().repeat(x))
  .take(3);
```

It's important to note here that _nothing has actually happened yet_ since we haven't provided any reason for this pipeline to run.  Pipelines are lazily-evaluated for efficiency.  Right now, `pt` is a `PipelineTransform<string>`.  Here's what we can do with that:

PipelineTransform instances are iterable via [the async iterable protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator):

```ts
for await (const item of pt) {
  console.log(item);
}
```

This is useful if you'd like to pass a PipelineTransform into another library or data processing pipeline that also integrates this protocol.

Alternatively, we can fully "materialize" the pipeline into an array with `toArray`:

```ts
const array = await pt.toArray();
```

Other operators, like `some`, `every`, `includes`, `find`, `join`, and `reduce` start evaluating the pipeline to return a result.  The result is always a Promise, regardless of whether async operations were used or not.  This is so adding async operations later into your pipeline never results in a refactor.

## Async

You may be used to dealing with this when processing arrays in similar chains:

```ts
[1, 2, 3, 4, 5]
  .map(x => x * 2)
  .filter(x => x > 2) // Whatever, contrived example
  .map(async x => {
    const url = `https://api/item/${x}`;

    const result = await fetch(url);
    const json = await result.json();

    return json;
  })
  // ...?
```

Here we'd need to stop the pipeline, assign this to a variable, `await Promise.all`, then continue:

```ts
const responsePromises = // above code
const responses = await Promise.all(responsePromises);
const tags = responses.flatMap(json => json.tags);
```

This can be clunky depending on what you're trying to accomplish!  With PipelineTransform, this is not an issue at all.

```ts
await tags = PipelineTransform.from([1, 2, 3, 4, 5])
  .map(x => x * 2)
  .filter(x => x > 2) // Whatever, contrived example
  .map(async x => {
    const url = `https://api/item/${x}`;

    const result = await fetch(url);
    const json = await result.json();

    return json;
  })
  .flatMap(json => json.tags)
  .toArray(); // Easy!
```

## Efficiency

The above array examples are also pretty sub-optimal, since they involve iterating the array multiple times.  This example iterates 3 times:

```ts
[1, 2, 3, 4, 5]
  .map(x => x * 2) // 2, 4, 6, 8, 10
  .filter(x => x > 2) // 4, 6, 8, 10
  .map(x => x.toString()); // "4", "6", "8", "10"
```

With pipelines, we "iterate" once - items are yielded one by one from the "top" of the pipe and fall through each stage.  Items that make it to the end are candidates for materialization/can be returned.

```ts
await PipelineTransform.from([1, 2, 3, 4, 5])
  .map(x => x * 2)
  .filter(x => x > 2)
  .map(x => x.toString())
  .toArray();
```



# API

PipelineTransform supports these methods, which should all behave similarly to their array counterparts:

- `map`
- `flatMap`
- `flat`
- `filter`
- `concat`
- `forEach`
- `includes`
- `find`
- `some`
- `every`
- `join`
- `reduce`

A few exceptions are `filter` and `find` which attempt to do additional type narrowing and respect type guards.  The API also includes a few additional helpful methods:

- `toArray` - fully materialize the stream into an array.
- `batch` - groups items in the sequence into arrays of a specified size (which are then sequenced).
- `take` - useful for infinite or long sequences.  Think of this similar to `Array.slice(0, N)`.
- `inspect` - `console.log` every item that passes through this stage.  Accepts labels to prefix calls to `console.log` with.

# Contributing

Contributions are absolutely welcome!  A bit about this project:

- Built with [Bun](https://bun.sh/).
- Run tests with `bun run test`.
- Format and lint with `bun run check`.  Auto-fix with `bun run check --write` ([Biome](https://biomejs.dev/)).
- Ensure tests exist for both functionality and types.
  - Functional tests go in `index.test.ts`.
  - Type tests go in `index.tst.ts` ([TSTyche](https://tstyche.org/)).
