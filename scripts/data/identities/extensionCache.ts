import * as Q from "q";
import { CachedValue } from "../cachedValue";

const collection = "extension-cache";
const service = new CachedValue<IExtensionDataService>(() => VSS.getService(VSS.ServiceIds.ExtensionData));

interface IExtensionCacheEntry<T> {
    id: string;
    value: T;
    formatVersion: number;
    expiration: string;
    __etag: -1;
}
const formatVersion = 2;

export function store<T>(key: string, value: T, expiration?: Date): Q.IPromise<void> {
    const entry: IExtensionCacheEntry<T> = {
        id: key,
        value,
        formatVersion,
        expiration: expiration ? expiration.toJSON() : "",
        __etag: -1,
    };
    return service.getValue().then((dataService): Q.IPromise<void> =>
        dataService.setDocument(collection, entry).then(() => Q())
    );
}

export function get<T>(key: string): Q.IPromise<T | null> {
    return VSS.getService(VSS.ServiceIds.ExtensionData).then((dataService: IExtensionDataService) => {
        return dataService.getDocument(collection, key).then((doc: IExtensionCacheEntry<T>) => {
            if (doc.formatVersion !== formatVersion) {
                return null;
            }
            if (doc.expiration && new Date(doc.expiration) < new Date()) {
                return null;
            }
            return doc.value;
        }, (error: TfsError): T | null => {
            const status = Number(error.status);
            // If collection has not been created yet;
            if (status === 404 ||
                // User does not have permissions
                status === 401) {
                return null;
            }
            throw error;
        });
    });
}
