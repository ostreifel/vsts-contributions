import * as Q from "q";

const collection = "extension-cache";

interface IExtensionCacheEntry<T> {
    id: string;
    value: T;
    formatVersion: number;
    expiration: string;
    __etag: -1;
}
const formatVersion = 3;

export function store<T>(key: string, value: T, expiration?: Date): Q.IPromise<void> {
    const entry: IExtensionCacheEntry<T> = {
        id: key,
        value,
        formatVersion,
        expiration: expiration ? expiration.toJSON() : "",
        __etag: -1,
    };
    return VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData).then((dataService): Q.IPromise<void> =>
        dataService.setDocument(collection, entry).then(() => Q())
    );
}

export interface IHardGetValue<T> extends Q.IPromise<{
    value: T,
    expiration?: Date,
}> {}

export function get<T>(key: string, hardGet: () => IHardGetValue<T>): Q.IPromise<T> {
    function hardGetAndStore() {
        return hardGet().then(({value, expiration}) => {
            store(key, value, expiration);
            return value;
        });
    }
    return VSS.getService(VSS.ServiceIds.ExtensionData).then((dataService: IExtensionDataService) => {
        return dataService.getDocument(collection, key).then((doc: IExtensionCacheEntry<T>) => {
            if (doc.formatVersion !== formatVersion) {
                return hardGetAndStore();
            }
            if (doc.expiration && new Date(doc.expiration) < new Date()) {
                hardGetAndStore();
            }
            return doc.value;
        }, (error: TfsError): Q.Promise<T> => {
            const status = Number(error.status);
            // If collection has not been created yet;
            if (status === 404 ||
                // User does not have permissions
                status === 401) {
                return hardGetAndStore() as Q.Promise<T>;
            }
            throw error;
        });
    });
}
