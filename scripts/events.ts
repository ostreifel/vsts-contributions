import { DelayedFunction } from "VSS/Utils/Core";

export interface ValueWithTimings<T> {
    value: T;
    properties: IProperties;
    measurements: IMeasurements;
}
export interface IProperties {
    [name: string]: string;
}
export interface IMeasurements {
    [name: string]: number;
}

const flush = new DelayedFunction(null, 3000, "flush", () => {
    const insights = getInsights();
    if (insights) {
        insights.flush();
    }
});
export function flushNow() {
    flush.invokeNow();
}

export function trackEvent(name: string, properties?: IProperties, measurements?: IMeasurements) {
    const insights = getInsights();
    if (insights) {
        const { host } = VSS.getWebContext();
        properties = {
            ...(properties || {}),
            host: host.name || host.authority,
            contributionLocation: window['contributionLocation']
        };
        insights.trackEvent(name, properties, measurements);
        flush.start();
    }
}
function getInsights(): Microsoft.ApplicationInsights.IAppInsights | undefined {
    return window["appInsights"];
}
