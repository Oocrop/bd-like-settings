const {
	settings: { Category, SwitchItem }
} = require("powercord/components");
const { React } = require("powercord/webpack");

module.exports = class Settings extends React.Component {
	constructor(...args) {
		super(...args);

		this.state = { pluginsCategoryOpen: false };
	}

	render() {
		return (
			<div>
				This plugin is deprecated because it would have caused issues
				with injections when Discord pushed Electron 14.
				<br /> If you want an alternative,{" "}
				<a href="https://github.com/mr-miner1/better-settings">
					better-settings
				</a>{" "}
				is a good replacement.
			</div>
		);
		const { getSetting, toggleSetting } = this.props;

		return (
			<>
				<SwitchItem
					value={getSetting("hideSections", true)}
					onChange={() => toggleSetting("hideSections", true)}
				>
					Hide sections from settings menu
				</SwitchItem>
				<Category
					name="Which plugins should use section"
					opened={this.state.pluginsCategoryOpen}
					onChange={() =>
						this.setState({
							pluginsCategoryOpen: !this.state.pluginsCategoryOpen
						})
					}
				>
					{Object.keys(powercord.api.settings.tabs)
						.filter(p => !p.startsWith("pc-"))
						.map(p => (
							<SwitchItem
								value={getSetting(p, false)}
								onChange={() => toggleSetting(p, false)}
							>
								{powercord.api.settings.tabs[p].label}
							</SwitchItem>
						))}
				</Category>
			</>
		);
	}
};
