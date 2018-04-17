import * as React from "react";
import { IconButton } from "office-ui-fabric-react/lib-amd/components/Button";

export class CollapsibleHeader extends React.Component<{
    title: string,
    titleSuffix?: JSX.Element,
    buttonName: string,
    level: 1 | 2 | 3 | 4 | 5 | 6
    className?: string,
}, {
    showChildren: boolean,
}> {
    constructor(props) {
        super(props);
        this.state = { showChildren: false };
    }
    render() {
        const { showChildren } = this.state;
        return <div className={`collapsible-header ${this.props.className}`}>
            <div className={`header`}>
                <IconButton
                    className="toggle-button"
                    iconProps={{ iconName: showChildren ? 'ChevronDownSmall' : "ChevronRightSmall" }}
                    title={`${showChildren ? "Hide" : "Show"} ${this.props.buttonName}`}
                    onClick={() => this.setState({ showChildren: !this.state.showChildren })}
                />
                {this.getTitle()}
                {this.props.titleSuffix}
            </div>
            {showChildren ?
                <div>{this.props.children}</div>
                : null
            }
        </div>;
    }
    private getTitle() {
        switch (this.props.level) {
            case 1:
                return <h1>{this.props.title}</h1>;
            case 2:
                return <h2>{this.props.title}</h2>;
            case 3:
                return <h3>{this.props.title}</h3>;
            case 4:
                return <h4>{this.props.title}</h4>;
            case 5:
                return <h5>{this.props.title}</h5>;
            case 6:
                return <h6>{this.props.title}</h6>;
            default:
                throw Error(`no header level ${this.props.level}`);
        }
    }
}
