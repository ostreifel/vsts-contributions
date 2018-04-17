export interface IBatchedCachedValueOptions<Args, Value> {
    generator: (queued: {[id: string]: Args}) => Promise<{[id: string]: Value}>;
    /** How long to wait before making the queued request, longer delay = more batching*/
    delay: number;
    /** How many ms the cached value is valid for */
    valueTimeout?: number;
    /** How many values to request at once */
    batchSize: number;
}
/** Group otherwise single calls together */
export class BatchedCachedValue<Args, Value> {
    private queued: {[id: string]: Args} = {};
    private readonly cached: {[id: string]: Promise<Value>} = {};
    constructor(
        private readonly options: IBatchedCachedValueOptions<Args, Value>,
    ) {}

    public async getValue(id: string, args: Args): Promise<Value> {
        if (this.cached[id]) {
            return this.cached[id];
        }
        this.queued[id] = args;
        if (this.options.delay) {
            await new Promise((resolve) => setTimeout(resolve, this.options.delay));
        }
        if (!this.cached[id]) {
            // just in case the cache was cleared during the batch window
            this.queued[id] = args;
            let ids = Object.keys(this.queued);

            while (ids.length > 0) {
                const idBatch = ids.slice(0, this.options.batchSize);
                ids = ids.slice(this.options.batchSize);
                const batchArgs: {[id: string]: Args} = {};
                for (const id of idBatch) {
                    batchArgs[id] = this.queued[id];
                }
                const batchPromise = this.options.generator(batchArgs);
                for (const id of idBatch) {
                    this.cached[id] = batchPromise.then((wis) => wis[id]);
                }
            }
            this.queued = {};
        }
        if (this.options.valueTimeout) {
            setTimeout(() =>{
                delete this.cached[id];
            }, this.options.valueTimeout);
        }
        return this.cached[id];
    }
}
