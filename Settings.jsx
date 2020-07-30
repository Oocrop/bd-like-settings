const { settings: { Category, SwitchItem } } = require("powercord/components");
const { React } = require("powercord/webpack");

module.exports = class Settings extends React.Component {
    constructor(...args) {
        super(...args);

        this.state = { pluginsCategoryOpen: false };
    }

    render() {
        const { getSetting, toggleSetting } = this.props;

        return <>
            <SwitchItem
                value={getSetting("hideSections", true)}
                onChange={() => toggleSetting("hideSections", true)}
            >Hide sections from settings menu</SwitchItem>
            <Category
                name="Which plugins should use section"
                opened={this.state.pluginsCategoryOpen}
                onChange={() => this.setState({ pluginsCategoryOpen: !this.state.pluginsCategoryOpen })}
            >
                {Object.values(powercord.api.settings.tabs).filter(p => !p.category.startsWith("pc-")).map(p =>
                    <SwitchItem
                        value={getSetting(p.category, false)}
                        onChange={() => toggleSetting(p.category, false)}
                    >{p.label}</SwitchItem>
                )}
            </Category>
        </>;
    }
}