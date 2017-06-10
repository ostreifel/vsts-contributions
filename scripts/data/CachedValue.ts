import * as Q from "q";

export class CachedValue<T> {
    private value: T;
    private isValueSet: boolean = false;
    private deferred: Q.IPromise<T>;
    constructor(private readonly generator: () => Q.IPromise<T>) {}
    public getValue(): Q.IPromise<T> {
        if (this.isValueSet) {
            return Q(this.value);
        }
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
