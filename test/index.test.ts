import { beforeEach, describe, expect, it, mock, spyOn, test } from 'bun:test';

import { PipelineTransform } from '../src/index';

const getInfiniteStream = () =>
  (async function* () {
    let i = 0;

    while (true) {
      yield i++;
    }
  })();

describe('Parity with array operators', () => {
  describe('map', () => {
    test('matches', async () => {
      const arr = [1, 2, 3, 4, 5].map((x) => x * 2);
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5])
        .map((x) => x * 2)
        .toArray();

      expect(pt).toEqual(arr);
    });

    test('negative', async () => {
      const arr = [].map((x) => x * 2);
      const pt = await PipelineTransform.from([] as number[])
        .map((x) => x * 2)
        .toArray();

      expect(pt).toEqual(arr);
    });
  });

  describe('flatMap', () => {
    test('matches', async () => {
      const arr = [1, 2, 3, 4, 5].flatMap((x) => [x, x * 2]);
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5])
        .flatMap((x) => [x, x * 2])
        .toArray();

      expect(pt).toEqual(arr);
    });

    test('negative', async () => {
      const arr = [1, 2, 3, 4, 5].flatMap(() => []);
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5])
        .flatMap(() => [])
        .toArray();

      expect(pt).toEqual(arr);
    });
  });

  describe('flat', () => {
    test('matches', async () => {
      const nested = [1, [2, 3], [4, 5]];
      const arr = nested.flat();
      const pt = await PipelineTransform.from(nested).flat().toArray();

      expect(pt).toEqual(arr);
    });

    test('negative', async () => {
      const nested = [1, 2, 3, 4, 5];
      const arr = nested.flat();
      const pt = await PipelineTransform.from(nested).flat().toArray();

      expect(pt).toEqual(arr);
    });
  });

  describe('filter', () => {
    test('matches', async () => {
      const arr = [1, 2, 3, 4, 5].filter((x) => x % 2 === 0);
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5])
        .filter((x) => x % 2 === 0)
        .toArray();

      expect(pt).toEqual(arr);
    });

    test('negative', async () => {
      const arr = [1, 2, 3, 4, 5].filter((x) => x > 10);
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5])
        .filter((x) => x > 10)
        .toArray();

      expect(pt).toEqual(arr);
    });
  });

  describe('concat', () => {
    test('matches', async () => {
      const arr = [1, 2, 3, 4, 5].concat([6, 7]);
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5])
        .concat([6, 7])
        .toArray();

      expect(pt).toEqual(arr);
    });

    test('negative', async () => {
      const arr = [1, 2, 3, 4, 5].concat([]);
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5])
        .concat([])
        .toArray();

      expect(pt).toEqual(arr);
    });
  });

  describe('includes', () => {
    test('matches', async () => {
      const arr = [1, 2, 3, 4, 5].includes(3);
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).includes(3);

      expect(pt).toEqual(arr);
    });

    test('negative', async () => {
      const arr = [1, 2, 3, 4, 5].includes(100);
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).includes(100);

      expect(pt).toEqual(arr);
    });
  });

  describe('find', () => {
    test('matches', async () => {
      const arr = [1, 2, 3, 4, 5].find((x) => x > 3);
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).find(
        (x) => x > 3,
      );
      expect([pt]).toEqual([arr]);
    });

    test('negative', async () => {
      const arr = [1, 2, 3, 4, 5].find((x) => x > 100);
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).find(
        (x) => x > 100,
      );
      expect([pt]).toEqual([arr]);
    });
  });

  describe('some', () => {
    test('matches', async () => {
      const arr = [1, 2, 3, 4, 5].some((x) => x > 3);
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).some(
        (x) => x > 3,
      );

      expect(pt).toEqual(arr);
    });

    test('negative', async () => {
      const arr = [1, 2, 3, 4, 5].some((x) => x > 100);
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).some(
        (x) => x > 100,
      );

      expect(pt).toEqual(arr);
    });
  });

  describe('every', () => {
    test('matches', async () => {
      const arr = [1, 2, 3, 4, 5].every((x) => x > 0);
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).every(
        (x) => x > 0,
      );

      expect(pt).toEqual(arr);
    });

    test('negative', async () => {
      const arr = [1, 2, 3, 4, 5].every((x) => x > 10);
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).every(
        (x) => x > 10,
      );

      expect(pt).toEqual(arr);
    });
  });

  describe('join', () => {
    test('matches', async () => {
      const arr = [1, 2, 3, 4, 5].join('-');
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).join('-');

      expect(pt).toEqual(arr);
    });

    test('negative', async () => {
      const arr = ([] as number[]).join('-');
      const pt = await PipelineTransform.from([] as number[]).join('-');

      expect(pt).toEqual(arr);
    });

    test('with primitives and default separator', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).join();

      expect(pt).toEqual('1,2,3,4,5');
    });

    test('with objects', async () => {
      const objects = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const pt = await PipelineTransform.from(objects).join();

      expect(pt).toEqual('[object Object],[object Object],[object Object]');
    });

    test('with empty array', async () => {
      const pt = await PipelineTransform.from([]).join();

      expect(pt).toEqual('');
    });

    test('with custom separator', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).join(' - ');

      expect(pt).toEqual('1 - 2 - 3 - 4 - 5');
    });
  });

  describe('reduce', () => {
    test('matches', async () => {
      const arr = [1, 2, 3, 4, 5].reduce((a, b) => a + b, 0);
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).reduce(
        (a, b) => a + b,
        0,
      );

      expect(pt).toEqual(arr);
    });

    test('negative', async () => {
      const arr = ([] as number[]).reduce((a, b) => a + b, 0);
      const pt = await PipelineTransform.from([] as number[]).reduce(
        (a, b) => a + b,
        0,
      );

      expect(pt).toEqual(arr);
    });
  });

  describe('forEach', () => {
    test('matches', async () => {
      let arrSum = 0;
      let ptSum = 0;

      // Obviously not the greatest thing to do in a forEach, but simple and clear to test
      [1, 2, 3, 4, 5].forEach((value) => {
        arrSum += value;
      });

      await PipelineTransform.from([1, 2, 3, 4, 5])
        .forEach((value) => {
          ptSum += value;
        })
        .toArray();

      expect(ptSum).toEqual(arrSum);
    });

    test('negative', async () => {
      const arr = ([] as number[]).reduce((a, b) => a + b, 0);
      const pt = await PipelineTransform.from([] as number[]).reduce(
        (a, b) => a + b,
        0,
      );

      expect(pt).toEqual(arr);
    });
  });
});

describe('Behaviour', () => {
  it('should handle multiple stages', async () => {
    const regular = [1, 2, 3, 4, 5]
      .map((x) => x * 2)
      .filter((x) => x > 5)
      .concat([10, 11]);

    const pt = await PipelineTransform.from([1, 2, 3, 4, 5])
      .map((x) => x * 2)
      .filter((x) => x > 5)
      .concat([10, 11])
      .toArray();

    expect(pt).toEqual(regular);
  });

  it('should be iterable', async () => {
    const pt = PipelineTransform.from([1, 2, 3, 4, 5])
      .map((x) => x * 2)
      .filter((x) => x > 5);

    const result = [];
    for await (const value of pt) {
      result.push(value);
    }

    expect(result).toEqual([6, 8, 10]);
  });

  describe('input types', () => {
    test('array', async () => {
      const pt = await PipelineTransform.from([1, 2, 3]).toArray();

      expect(pt).toEqual([1, 2, 3]);
    });

    test('generator', async () => {
      const pt = await PipelineTransform.from(
        (function* () {
          yield 1;
          yield 2;
          yield 3;
        })(),
      ).toArray();

      expect(pt).toEqual([1, 2, 3]);
    });

    test('async generator', async () => {
      const pt = await PipelineTransform.from(
        (async function* () {
          yield 1;
          yield 2;
          yield 3;
        })(),
      ).toArray();

      expect(pt).toEqual([1, 2, 3]);
    });

    test('buffer', async () => {
      const stream = Buffer.from('1 _ 2 _ 3');

      const pt = await PipelineTransform.from(stream)
        .flatMap((x) => x.toString().split(''))
        .map((x) => Number.parseInt(x))
        .filter((x) => !Number.isNaN(x))
        .toArray();

      expect(pt).toEqual([1, 2, 3]);
    });
  });
});

describe('Special operators', () => {
  describe('filter', () => {
    test('predicate', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5])
        .filter((x) => x > 2)
        .toArray();

      expect(pt).toEqual([3, 4, 5]);
    });

    test('type guard', async () => {
      const pt = await PipelineTransform.from([[1, 2, 3], 4, 5])
        .filter(Array.isArray)
        .toArray();

      expect(pt).toEqual([[1, 2, 3]]);
    });

    test('custom type guard', async () => {
      const pt = await PipelineTransform.from([[1, 2, 3], 4, 5])
        .filter((x): x is number[] => Array.isArray(x))
        .toArray();

      expect(pt).toEqual([[1, 2, 3]]);
    });

    test('async', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5])
        .filter(async () => true)
        .toArray();

      expect(pt).toEqual([1, 2, 3, 4, 5]);
    });
  });

  test('batch', async () => {
    const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).batch(2).toArray();

    expect(pt).toEqual([[1, 2], [3, 4], [5]]);
  });

  describe('concat', () => {
    test('with array', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5])
        .concat([6, 7, 8])
        .toArray();

      expect(pt).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    test('with iterable', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5])
        .concat(
          (function* () {
            yield 6;
            yield 7;
            yield 8;
          })(),
        )
        .toArray();

      expect(pt).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    test('with async iterable', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5])
        .concat(
          (async function* () {
            yield 6;
            yield 7;
            yield 8;
          })(),
        )
        .toArray();

      expect(pt).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    test('with individual values', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5])
        .concat(6, 7, 8)
        .toArray();

      expect(pt).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });

  describe('includes', () => {
    test('positive', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).includes(2);

      expect(pt).toBeTrue();
    });

    test('negative', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).includes(100);

      expect(pt).toBeFalse();
    });
  });

  describe('find', () => {
    test('positive', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).find(
        (x) => x > 2,
      );

      expect(pt).toEqual(3);
    });

    test('negative', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).find(
        (x) => x > 10,
      );

      expect(pt).toBeUndefined();
    });
  });

  describe('take', () => {
    test('take 5 items', async () => {
      const pt = await PipelineTransform.from(getInfiniteStream())
        .take(5)
        .toArray();

      expect(pt).toEqual([0, 1, 2, 3, 4]);
    });

    test('take 0 items', async () => {
      const pt = await PipelineTransform.from(getInfiniteStream())
        .take(0)
        .toArray();

      expect(pt).toEqual([]);
    });

    test('take -1 items', async () => {
      const pt = await PipelineTransform.from(getInfiniteStream())
        .take(-1)
        .toArray();

      expect(pt).toEqual([]);
    });
  });
});

describe('Lazy evaluation', () => {
  let pt: PipelineTransform<number>;

  beforeEach(() => {
    pt = PipelineTransform.from([1, 2, 3, 4, 5]).map((x) => {
      if (x > 3) {
        throw new Error('Boom!');
      }

      return x;
    });
  });

  test('includes (success)', async () => {
    expect(() => pt.includes(3)).not.toThrow();
  });

  test('includes (fail)', async () => {
    expect(() => pt.includes(100)).toThrow();
  });

  test('find (success)', async () => {
    expect(() => pt.find((x) => x === 3)).not.toThrow();
  });

  test('find (fail)', async () => {
    expect(() => pt.find((x) => x === 100)).toThrow();
  });

  test('with infinite stream', async () => {
    const pt = await PipelineTransform.from(getInfiniteStream()).includes(10);

    expect(pt).toBeTrue();
  });
});

describe('async', () => {
  describe('map', () => {
    test('should work with async functions', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5])
        .map(async (x) => x * 2)
        .toArray();

      expect(pt).toEqual([2, 4, 6, 8, 10]);
    });
  });

  describe('flatMap', () => {
    test('should work with async functions', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5])
        .flatMap(async (x) => x * 2)
        .toArray();

      expect(pt).toEqual([2, 4, 6, 8, 10]);
    });
  });

  describe('filter', () => {
    test('should work with async functions', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5])
        .filter(async (x) => x > 3)
        .toArray();

      expect(pt).toEqual([4, 5]);
    });
  });

  describe('find', () => {
    test('should work with async functions', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).find(
        async (x) => x > 3,
      );

      expect(pt).toEqual(4);
    });
  });

  describe('some', () => {
    test('should work with async functions', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).some(
        async (x) => x > 3,
      );

      expect(pt).toEqual(true);
    });
  });

  describe('every', () => {
    test('should work with async functions', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).every(
        async (x) => x > 0,
      );

      expect(pt).toEqual(true);
    });
  });

  describe('reduce', () => {
    test('should work with async functions', async () => {
      const pt = await PipelineTransform.from([1, 2, 3, 4, 5]).reduce(
        async (sum, x) => sum + x,
        0,
      );

      expect(pt).toEqual(15);
    });
  });
});

describe('efficiency', () => {
  test('should only iterate the collection once', async () => {
    const dataSource = [1, 2, 3, 4, 5];
    let initialItemsSeen = 0;
    let finalItemsSeen = 0;

    const pt = await PipelineTransform.from(dataSource)
      .forEach(() => {
        ++initialItemsSeen;
      })
      .batch(2)
      .flat()
      .batch(3)
      .flat()
      .filter((x) => x > 3)
      .forEach(() => {
        ++finalItemsSeen;
      })
      .reduce((sum, value) => sum + value, 0);

    expect(pt).toEqual(9);
    expect(initialItemsSeen).toEqual(dataSource.length);
    expect(finalItemsSeen).toEqual(2);
  });
});

describe('inspect', () => {
  test('inspect function prints items in the pipeline at the relevant time', async () => {
    const spy = spyOn(console, 'log').mockImplementation(() => {});

    const pt = await PipelineTransform.from(getInfiniteStream())
      .inspect('initial')
      .filter((x) => x > 4)
      .inspect('filter')
      .take(3)
      .toArray();

    expect(pt).toEqual([5, 6, 7]);

    // Iterate up past 4...
    expect(spy).toHaveBeenNthCalledWith(1, 'initial', 0);
    expect(spy).toHaveBeenNthCalledWith(2, 'initial', 1);
    expect(spy).toHaveBeenNthCalledWith(3, 'initial', 2);
    expect(spy).toHaveBeenNthCalledWith(4, 'initial', 3);
    expect(spy).toHaveBeenNthCalledWith(5, 'initial', 4);
    expect(spy).toHaveBeenNthCalledWith(6, 'initial', 5);
    // at which point the filter stage is active:
    expect(spy).toHaveBeenNthCalledWith(7, 'filter', 5);
    expect(spy).toHaveBeenNthCalledWith(8, 'initial', 6);
    expect(spy).toHaveBeenNthCalledWith(9, 'filter', 6);
    expect(spy).toHaveBeenNthCalledWith(10, 'initial', 7);
    expect(spy).toHaveBeenNthCalledWith(11, 'filter', 7);
    expect(spy).toHaveBeenNthCalledWith(12, 'initial', 8);
    expect(spy).toHaveBeenNthCalledWith(13, 'filter', 8);

    mock.restore();
  });
});
