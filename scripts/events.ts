import { DelayedFunction } from "VSS/Utils/Core"

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

const flush = new DelayedFunction(null, 100, "flush", () => {
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
        properties = { ...(properties || {}), host: VSS.getWebContext().host.authority };
        insights.trackEvent(name, properties, measurements);
        flush.reset();
    }
}
function getInsights(): Microsoft.ApplicationInsights.IAppInsights | undefined {
    return window["appInsights"];
}
