export class CachedValue<T> {
    private value: T;
    private isValueSet: boolean = false;
    private deferred: PromiseLike<T>;
    constructor(private readonly generator: () => PromiseLike<T>) {}
    public async getValue(): Promise<T> {
        if (!this.deferred) {
            this.deferred = this.generator().then(value => {
                this.isValueSet = true;
                this.value = value;
                return this.value;
            });
        }
        return this.deferred;
    }
    public isLoaded() {
        return this.isValueSet;
    }
}
