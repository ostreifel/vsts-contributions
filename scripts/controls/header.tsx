import * as React from "react";
import { IconButton } from "OfficeFabric/components/Button";


export class CollapsibleHeader extends React.Component<{ title: string, name: string }, { showChildren: boolean }> {
    constructor() {
        super();
        this.state = { showChildren: false };
    }
    render() {
        const { showChildren } = this.state;
        return <div>
            <div className="collapsible-header">
                <IconButton
                    className="toggle-button"
                    iconProps={{ iconName: showChildren ? 'ChevronDownSmall' : "ChevronRightSmall" }}
                    title={`${showChildren ? "Hide" : "Show"} ${this.props.name}`}
                    onClick={() => this.setState({ showChildren: !this.state.showChildren })}
                />
                <h4>{this.props.title}</h4>
            </div>
            {showChildren ?
                <div>{this.props.children}</div>
                : null
            }
        </div>
    }
}
