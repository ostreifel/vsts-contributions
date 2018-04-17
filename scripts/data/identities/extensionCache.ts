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

export async function store<T>(key: string, value: T, expiration?: Date): Promise<void> {
    const entry: IExtensionCacheEntry<T> = {
        id: key,
        value,
        formatVersion,
        expiration: expiration ? expiration.toJSON() : "",
        __etag: -1,
    };
    const dataService = await VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData);
    await dataService.setDocument(collection, entry);
}

export type IHardGetValue<T> = {
    value: T,
    expiration?: Date,
};

export async function get<T>(key: string, hardGet: () => Promise<IHardGetValue<T>>): Promise<T> {
    function hardGetAndStore() {
        return hardGet().then(({value, expiration}) => {
            store(key, value, expiration);
            return value;
        });
    }
    const dataService = await VSS.getService<IExtensionDataService>(VSS.ServiceIds.ExtensionData);
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
}
