import * as Q from "q";

function *batchGenerator<T>(
    promiseGenerator: IterableIterator<Q.IPromise<T>>,
    batchsize: number,
): IterableIterator<Q.IPromise<T>[]> {
    let arr: Q.IPromise<T>[] = [];
    for (const promise of promiseGenerator) {
        arr.push(promise);
        if (arr.length >= batchsize) {
            yield arr;
            arr = [];
        }
    }
    if (arr.length > 0) {
        yield arr;
    }
}
/** It is important to only create the promises as needed by the generator or they will all run at once */
export async function throttlePromises<A, T>(arr: A[], convert: (val: A) => Q.IPromise<T>, batchsize: number): Promise<T[]> {
    const promiseGenerator = createPromiseGenerator(arr, convert);
    const results: T[] = [];
    for (const promises of batchGenerator(promiseGenerator, batchsize)) {
        results.push(...(await Q.all(promises)));
    }
    return results;
}

function *createPromiseGenerator<A, T>(arr: A[], convert: (val: A) => Q.IPromise<T>): IterableIterator<Q.IPromise<T>> {
    for (const val of arr) {
        yield convert(val);
    }
}
