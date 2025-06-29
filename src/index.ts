import { Readable } from 'node:stream';

type OptionalPromise<T> = T | Promise<T>;
type GeneralIterable<T> = Iterable<T> | AsyncIterable<T>;

export class PipelineTransform<T> {
  private readonly stages: [
    GeneralIterable<T>,
    ...((items: AsyncGenerator<T>) => AsyncGenerator)[],
  ];

  private constructor(initialStage: GeneralIterable<T>) {
    this.stages = [initialStage];
  }

  public static from<
    T extends GeneralIterable<unknown>,
    TElement = T extends GeneralIterable<infer Element> ? Element : never,
  >(source: T): PipelineTransform<TElement> {
    if (Buffer.isBuffer(source)) {
      return new PipelineTransform(Readable.from(source));
    }

    if (typeof (source as any)[Symbol.asyncIterator] === 'function') {
      return new PipelineTransform(source as AsyncIterable<TElement>);
    }

    return new PipelineTransform(source as Iterable<TElement>);
  }

  public map<U>(fn: (value: T) => OptionalPromise<U>): PipelineTransform<U> {
    this.stages.push(async function* (items) {
      for await (const item of items) {
        yield await fn(item);
      }
    });

    return this as unknown as PipelineTransform<U>;
  }

  public flatMap<U, TArrayValue = U extends Array<infer V> ? V : U>(
    fn: (value: T) => OptionalPromise<U>,
  ): PipelineTransform<TArrayValue> {
    this.stages.push(async function* (items) {
      for await (const item of items) {
        yield* [await fn(item)].flat();
      }
    });

    return this as unknown as PipelineTransform<TArrayValue>;
  }

  public flat<
    TElement = T extends Array<infer Element> ? Element : T,
  >(): PipelineTransform<TElement> {
    this.stages.push(async function* (items) {
      for await (const item of items) {
        yield* [item].flat();
      }
    });

    return this as unknown as PipelineTransform<TElement>;
  }

  public filter<U extends T>(
    predicate: (value: T) => value is U,
  ): PipelineTransform<U>;
  public filter<U>(
    predicate: (value: unknown) => value is U,
  ): PipelineTransform<U>;
  public filter(
    predicate: (value: T) => OptionalPromise<boolean>,
  ): PipelineTransform<T>;

  public filter(
    predicate: (value: T) => OptionalPromise<boolean>,
  ): PipelineTransform<T> {
    this.stages.push(async function* (items) {
      for await (const item of items) {
        if (await predicate(item)) {
          yield item;
        }
      }
    });

    return this;
  }

  public concat<
    U,
    // biome-ignore lint/suspicious/noRedeclare: aliasing
    UElement = U extends Iterable<infer Element> | AsyncIterable<infer Element>
      ? Element
      : never,
  >(...values: U[]): PipelineTransform<T | UElement> {
    this.stages.push(async function* (items) {
      yield* items;

      for (const value of values) {
        if (/* !Array.isArray(value) &&*/ PipelineTransform.isIterable(value)) {
          yield* value;
        } else {
          yield value;
        }
      }
    });

    return this as unknown as PipelineTransform<T | UElement>;
  }

  public forEach(fn: (item: T) => void): PipelineTransform<T> {
    this.stages.push(async function* (items) {
      for await (const item of items) {
        fn(item);

        yield item;
      }
    });

    return this;
  }

  public async includes(value: T): Promise<boolean> {
    for await (const item of this) {
      if (item === value) {
        return true;
      }
    }

    return false;
  }

  public async find<U extends T>(
    predicate: (value: T) => value is U,
  ): Promise<U | undefined>;
  public async find<U>(
    predicate: (value: unknown) => value is U,
  ): Promise<U | undefined>;
  public async find(
    predicate: (value: T) => OptionalPromise<boolean>,
  ): Promise<T | undefined>;

  public async find(
    predicate: (value: T) => OptionalPromise<boolean>,
  ): Promise<T | undefined> {
    for await (const item of this) {
      if (await predicate(item)) {
        return item;
      }
    }
  }

  public async some(
    predicate: (value: T) => OptionalPromise<boolean>,
  ): Promise<boolean> {
    for await (const item of this) {
      if (await predicate(item)) {
        return true;
      }
    }

    return false;
  }

  public async every(
    predicate: (value: T) => OptionalPromise<boolean>,
  ): Promise<boolean> {
    for await (const item of this) {
      if (!(await predicate(item))) {
        return false;
      }
    }

    return true;
  }

  public async join(separator: string = ','): Promise<string> {
    const array = await this.toArray();

    return array.join(separator);
  }

  public inspect(...labels: unknown[]): PipelineTransform<T> {
    this.stages.push(async function* (items) {
      for await (const item of items) {
        console.log(...labels, item);

        yield item;
      }
    });

    return this;
  }

  public async reduce<U>(
    reducer: (
      accumulator: U,
      currentValue: T,
      index: number,
    ) => OptionalPromise<U>,
    initialValue: U,
  ): Promise<U> {
    let accumulator = initialValue;
    let index = 0;

    for await (const item of this) {
      accumulator = await reducer(accumulator, item, index++);
    }

    return accumulator;
  }

  public batch(size: number): PipelineTransform<T[]> {
    this.stages.push(async function* (items) {
      let batch: T[] = [];

      for await (const item of items) {
        batch.push(item);

        if (batch.length >= size) {
          yield batch;
          batch = [];
        }
      }

      if (batch.length) {
        yield batch;
      }
    });

    return this as unknown as PipelineTransform<T[]>;
  }

  public take(count: number): PipelineTransform<T> {
    this.stages.push(async function* (items) {
      let seen = 0;

      for await (const item of items) {
        if (seen++ >= count) {
          break;
        }

        yield item;
      }
    });

    return this;
  }

  public async *[Symbol.asyncIterator](): AsyncGenerator<T> {
    const [firstStage, ...restStages] = this.stages;
    let generator: AsyncGenerator<any> = firstStage as AsyncGenerator<any>;

    for (const stage of restStages) {
      generator = stage(generator);
    }

    yield* generator;
  }

  public toArray(): Promise<T[]> {
    return Array.fromAsync(this);
  }

  private static isIterable<T>(
    value: T | Iterable<T> | AsyncIterable<T>,
  ): value is Iterable<T> | AsyncIterable<T> {
    return (
      value != null &&
      (typeof (value as AsyncIterable<T>)[Symbol.asyncIterator] ===
        'function' ||
        typeof (value as Iterable<T>)[Symbol.iterator] === 'function')
    );
  }
}
