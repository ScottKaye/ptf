import { describe, expect, test } from 'tstyche';

import { PipelineTransform } from '../src';

expect(PipelineTransform.from([1]).map((x) => x.toString())).type.toBe<
  PipelineTransform<string>
>();

expect(PipelineTransform.from([1]).flatMap((x) => x.toString())).type.toBe<
  PipelineTransform<string>
>();

describe('from', () => {
  test('simple cases', () => {
    expect(PipelineTransform.from([1, 2, 3])).type.toBe<
      PipelineTransform<number>
    >();
    expect(PipelineTransform.from([1, [2, 3]])).type.toBe<
      PipelineTransform<number | number[]>
    >();
  });
});

const pt = PipelineTransform.from([1, 2, 3]);

describe('map', () => {
  test('simple', () => {
    expect(pt.map((x) => x.toString())).type.toBe<PipelineTransform<string>>();
  });
});

describe('flatMap', () => {
  test('simple', () => {
    expect(pt.flatMap((x) => x.toString())).type.toBe<
      PipelineTransform<string>
    >();
  });
});

describe('flat', () => {
  test('simple', () => {
    expect(pt.flat()).type.toBe<PipelineTransform<number>>();
  });
});

describe('filter', () => {
  test('predicate', () => {
    expect(pt.filter((x) => x > 2)).type.toBe<PipelineTransform<number>>();
  });

  test('type guard', () => {
    expect(pt.filter(Array.isArray)).type.toBe<PipelineTransform<any[]>>();
  });

  test('custom type guard', () => {
    const arrayPt = PipelineTransform.from([1, 2, [3, 4]]);

    expect(arrayPt.filter((x): x is number[] => Array.isArray(x))).type.toBe<
      PipelineTransform<number[]>
    >();
  });
});

describe('concat', () => {
  test('simple', () => {
    expect(pt.concat([1, 2, 3])).type.toBe<PipelineTransform<number>>();
  });
});

describe('includes', () => {
  test('simple', () => {
    expect(pt.includes(3)).type.toBe<Promise<boolean>>();
  });
});

describe('find', () => {
  test('predicate', () => {
    expect(pt.find(() => true)).type.toBe<Promise<number | undefined>>();
  });

  test('type guard', () => {
    expect(pt.find(Array.isArray)).type.toBe<Promise<any[] | undefined>>();
  });

  test('custom type guard', () => {
    const arrayPt = PipelineTransform.from([1, 2, [3, 4]]);

    expect(arrayPt.find((x): x is number[] => Array.isArray(x))).type.toBe<
      Promise<number[] | undefined>
    >();
  });
});

describe('some', () => {
  test('simple', () => {
    expect(pt.some(() => true)).type.toBe<Promise<boolean>>();
  });
});

describe('every', () => {
  test('simple', () => {
    expect(pt.every(() => true)).type.toBe<Promise<boolean>>();
  });
});

describe('join', () => {
  test('simple', () => {
    expect(pt.join()).type.toBe<Promise<string>>();
  });
});

describe('reduce', () => {
  test('simple', () => {
    expect(pt.reduce((acc, _x) => acc, 0)).type.toBe<Promise<number>>();
  });

  test('different initial type', () => {
    expect(pt.reduce((acc, _x) => acc, '')).type.toBe<Promise<string>>();
  });
});
