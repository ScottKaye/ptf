import { bench, type k_state, run, summary } from 'mitata';

import { PipelineTransform } from '../src';

// Note on these benchmarks:
// Array tests include the array being created _inside_ the test
// PipelineTransform tests include the array being created _outside_ the test, and PipelineTransform being initialized _inside_ the test.
// This is to try to keep things semi-fair - a consistent data source.
// The difference does not affect the outcome of the tests either way.  Please try for yourself!

// Pipelines win dramatically here because we cut out 99% of the required operations that array chaining needs to do.
summary(() => {
  bench('array[$length] find early', function* (state: k_state) {
    const length = state.get('length');

    yield () =>
      Array.from({ length }, (_, i) => i)
        .map((i) => i * 2)
        .filter((i) => i > 0)
        .find((i) => i < 10);
  }).args('length', [1e6]);

  bench('pt[$length] find early', function* (state: k_state) {
    const length = state.get('length');
    const arr = Array.from({ length }, (_, i) => i);

    yield () =>
      PipelineTransform.from(arr)
        .map((i) => i * 2)
        .filter((i) => i > 0)
        .find((i) => i < 10);
  }).args('length', [1e6]);
});

// Arrays win here because we're starting to see the drawbacks of the increased overhead of generators, and the benefits of engine optimizations
summary(() => {
  bench('array[$length] find middle', function* (state: k_state) {
    const length = state.get('length');

    yield () =>
      Array.from({ length }, (_, i) => i)
        .map((i) => i * 2)
        .filter((i) => i > 0)
        .find((i) => i > 500_000);
  }).args('length', [1e6]);

  bench('pt[$length] find middle', function* (state: k_state) {
    const length = state.get('length');
    const arr = Array.from({ length }, (_, i) => i);

    yield () =>
      PipelineTransform.from(arr)
        .map((i) => i * 2)
        .filter((i) => i > 0)
        .find((i) => i > 500_000);
  }).args('length', [1e6]);
});

// Arrays win here again because we're processing nearly the entire result set, and again are comparing high-level scripting to V8/native optimizations.
summary(() => {
  bench('array[$length] find late', function* (state: k_state) {
    const length = state.get('length');

    yield () =>
      Array.from({ length }, (_, i) => i)
        .map((i) => i * 2)
        .filter((i) => i > 0)
        .find((i) => i > 900_000);
  }).args('length', [1e6]);

  bench('pt[$length] find late', function* (state: k_state) {
    const length = state.get('length');
    const arr = Array.from({ length }, (_, i) => i);

    yield () =>
      PipelineTransform.from(arr)
        .map((i) => i * 2)
        .filter((i) => i > 0)
        .find((i) => i > 900_000);
  }).args('length', [1e6]);
});

summary(() => {
  interface APIResult {
    itemId: number;
    tags: string[];
  }

  const getFromAPI = (itemId: number): Promise<APIResult> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ itemId, tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] });
      }, 100);
    });
  };

  bench('array[$length] map async in batches', function* (state: k_state) {
    const length = state.get('length');

    yield async () => {
      const itemIds = Array.from({ length }, (_, i) => i);

      const itemRequests: APIResult[] = [];
      const batchSize = 5;
      let start = 0;

      while (true) {
        const batch = itemIds.slice(start, start + batchSize);
        start += batchSize;

        if (batch.length === 0) {
          break;
        }

        itemRequests.push(...(await Promise.all(batch.map(getFromAPI))));
      }

      itemRequests.some((req) => req.tags.includes('g'));
    };
  }).args('length', [100]);

  bench('pt[$length] map async in batches', function* (state: k_state) {
    const length = state.get('length');
    const itemIds = Array.from({ length }, (_, i) => i);

    yield async () => {
      await PipelineTransform.from(itemIds)
        .batch(5)
        .flatMap(async (batch) => await Promise.all(batch.map(getFromAPI)))
        .some((req) => req.tags.includes('g'));
    };
  }).args('length', [100]);
});

await run();
