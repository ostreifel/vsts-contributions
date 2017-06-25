///<reference types="vss-web-extension-sdk" />
import {
    IWidgetConfiguration,
    WidgetStatus,
    WidgetSettings,
    IWidgetConfigurationContext,
} from "TFS/Dashboards/WidgetContracts";
import * as Q from "q";
import { renderFilters } from "./controls/filters";
import { WidgetStatusHelper, WidgetEvent, WidgetConfigurationSave } from "TFS/Dashboards/WidgetHelpers";
import { trackEvent } from "./events";
import { IContributionFilter, filterToIProperties, defaultFilter } from "./filter";

class ContributionsConfiguration implements IWidgetConfiguration {
    private context: IWidgetConfigurationContext;
    private filter: IContributionFilter;
    private configUpdated(filter: IContributionFilter) {
        this.filter = filter;
        this.context.notify(WidgetEvent.ConfigurationChange, WidgetEvent.Args({
            data: JSON.stringify(filter)
        }));
    }
    public load(
        widgetSettings: WidgetSettings,
        widgetConfigurationContext: IWidgetConfigurationContext
    ): Q.IPromise<WidgetStatus> {
        this.context = widgetConfigurationContext;
        const filterPromise = widgetSettings.customSettings.data
            ? Q(JSON.parse(widgetSettings.customSettings.data))
            : defaultFilter.getValue();
        return filterPromise.then(filter => {
            this.filter = filter;
            renderFilters(this.configUpdated.bind(this), this.filter, false, () => VSS.resize());
            return WidgetStatusHelper.Success();
        })

    }
    public onSave() {
        trackEvent("configUpdated", filterToIProperties(this.filter));
        return WidgetConfigurationSave.Valid({data: JSON.stringify(this.filter)})
    }
}

VSS.register("ContributionsWidget-Configuration", new ContributionsConfiguration());
