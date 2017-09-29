import * as Q from "q";

/** Need to implement b/c ie doesn't support */
class IterableIterator<T> {
    constructor(
        public hasNext: () => boolean,
        public next: () => T,
    ) {}
}

function batchGenerator<T>(
    promiseGenerator: IterableIterator<Q.IPromise<T>>,
    batchsize: number,
): IterableIterator<Q.IPromise<T>[]> {
    return new IterableIterator<Q.IPromise<T>[]>(
        () => promiseGenerator.hasNext(),
        () => {
            const arr: Q.IPromise<T>[] = [];
            while (promiseGenerator.hasNext()) {
                arr.push(promiseGenerator.next());
                if (arr.length >= batchsize) {
                    return arr;
                }
            }
            return arr;

        }
    );
}
/** It is important to only create the promises as needed by the generator or they will all run at once */
export function throttlePromises<A, T>(arr: A[], convert: (val: A) => Q.IPromise<T>, batchsize: number): Q.IPromise<T[]> {
    const promiseGenerator = createPromiseGenerator(arr, convert);
    const batcher = batchGenerator(promiseGenerator, batchsize);
    const results: T[] = [];
    const deferred = Q.defer<T[]>();
    function queueNext() {
        if (batcher.hasNext()) {
            Q.all(batcher.next()).then(
                vals => {
                    results.push(...vals);
                    queueNext();
                },
                error => { deferred.reject(error); }
            );
        } else {
            deferred.resolve(results);
        }
    }
    queueNext();
    return deferred.promise;
}

function createPromiseGenerator<A, T>(arr: A[], convert: (val: A) => Q.IPromise<T>): IterableIterator<Q.IPromise<T>> {
    let idx = 0;
    const a = new IterableIterator<Q.IPromise<T>>(
        () => idx < arr.length,
        () => convert(arr[idx++]),
    );
    return a;
}

