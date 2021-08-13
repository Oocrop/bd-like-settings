const { Plugin } = require("powercord/entities");
const { inject, uninject } = require("powercord/injector");
const {
	React: { createElement },
	getModule,
	i18n: { Messages }
} = require("powercord/webpack");
const { findInReactTree } = require("powercord/util");
const {
	Card,
	Clickable,
	Divider,
	Icons: { Close, Gear },
	Tooltip
} = require("powercord/components");
const InstalledProduct = require("../pc-moduleManager/components/parts/InstalledProduct.jsx");
const Settings = require("../pc-settings/index.js");
const ErrorBoundary = require("../pc-settings/components/ErrorBoundary.jsx");
const PluginSettings = require("./Settings");
var _this;

module.exports = class BDLikeSettings extends Plugin {
	async startPlugin() {
		_this = this;

		powercord.api.settings.registerSettings(this.entityID, {
			category: this.entityID,
			label: "BD-Like Plugin Settings",
			render: PluginSettings
		});

		const SettingsView = await getModule(
			m => m.displayName == "SettingsView"
		);
		this.settingsModule = await getModule(["open", "saveAccountChanges"]);

		inject(
			"bd-like-settings_productRenderPrePatch",
			InstalledProduct.prototype,
			"render",
			this.productRenderPrePatch,
			true
		);
		inject(
			"bd-like-settings_productRenderPatch",
			InstalledProduct.prototype,
			"render",
			this.productRenderPatch
		);
		inject(
			"bd-like-settings_productRenderFooterPatch",
			InstalledProduct.prototype,
			"renderFooter",
			this.productRenderFooterPatch
		);
		inject(
			"bd-like-settings_makeSectionPatch",
			Settings.prototype,
			"_makeSection",
			this.makeSectionPatch
		);
		inject(
			"bd-like-settings_getPredicateSectionsPatch",
			SettingsView.prototype,
			"getPredicateSections",
			this.getPredicateSectionsPatch
		);
		inject(
			"bd-like-settings_openSettings",
			this.settingsModule,
			"open",
			this.openPatch,
			true
		);
	}

	pluginWillUnload() {
		uninject("bd-like-settings_productRenderPrePatch");
		uninject("bd-like-settings_productRenderPatch");
		uninject("bd-like-settings_productRenderFooterPatch");
		uninject("bd-like-settings_makeSectionPatch");
		uninject("bd-like-settings_getPredicateSectionsPatch");
		uninject("bd-like-settings_openSettings");
		powercord.api.settings.unregisterSettings(this.entityID);
	}

	getPredicateSectionsPatch(_, res) {
		return res.filter(s => JSON.stringify(s) !== "{}");
	}

	makeSectionPatch(_, res) {
		if (
			res.section.startsWith("pc-") ||
			_this.settings.get("hideSections") === false ||
			_this.settings.get(res.section) ||
			_this.openedSettings === res.section
		)
			return (
				_this.openedSettings === res.section &&
					(_this.openedSettings = undefined),
				res
			);
		return {};
	}

	productRenderPrePatch() {
		if (this.props.isAPlugin === false || this.settingsTab !== undefined)
			return [];
		if (this.props.plugin === undefined) {
			const plugin = [...powercord.pluginManager.plugins.values()].find(
				p =>
					JSON.stringify(p.manifest) ==
					JSON.stringify(this.props.product)
			);
			if (!plugin) {
				this.props.isAPlugin = false;
				return [];
			}
			this.props.plugin = plugin;
		}
		const tabs = Object.values(powercord.api.settings.tabs);
		if (
			(this.props.settingsTab =
				powercord.api.settings.tabs[this.props.plugin.entityID] ||
				tabs.find(t => t.category === this.props.plugin.entityID)) &&
			this.props.settingsTab
		) {
			this.props.hasSettings = true;
			this.props.goToSettings = () =>
				this.setState({ renderSettings: true });
		} else this.props.hasSettings = false;
		const key = Object.keys(powercord.api.settings.tabs).find(
			k =>
				powercord.api.settings.tabs[k].category ===
				this.props.plugin.entityID
		);
		if (
			this.props.hasSettings &&
			key &&
			(this.props.plugin.entityID.startsWith("pc-") ||
				_this.settings.get(this.props.plugin.entityID))
		) {
			this.props.hasSettings = false;
			this.props.goToSettings = () => _this.settingsModule.open(key);
			return [];
		}
		return [];
	}

	productRenderPatch(_, res) {
		if (
			res === null ||
			!this.props.isEnabled ||
			this.props.isAPlugin === false ||
			this.props.hasSettings === false
		)
			return res;
		if (!this.props.hasSettings || !this.state?.renderSettings) return res;
		const Settings = this.props.settingsTab.render;
		return createElement(Card, { className: "powercord-product" }, [
			this.renderHeader(),
			createElement(Divider),
			createElement(
				"div",
				{ style: { display: "flex", "flex-direction": "column" } },
				[
					createElement(
						"div",
						{
							style: {
								width: "24px",
								float: "right",
								"align-self": "flex-end",
								margin: "5px"
							}
						},
						createElement(
							Tooltip,
							{ text: Messages.CLOSE },
							createElement(
								Clickable,
								{
									onClick: () =>
										this.setState({
											renderSettings: false
										})
								},
								createElement(Close)
							)
						)
					)
				]
			),
			createElement(
				"div",
				null,
				createElement(ErrorBoundary, null, createElement(Settings))
			)
		]);
	}

	productRenderFooterPatch(_, res) {
		const icon = findInReactTree(
			findInReactTree(res, c => c.props?.text === "Settings"),
			c => c.type === Gear
		);
		if (icon) icon.props = { style: { width: "24px", cursor: "pointer" } };
		return res;
	}

	openPatch(args) {
		if (
			!args[0].startsWith("pc-") &&
			powercord.api.settings.tabs[args[0]] &&
			!_this.settings.get(args[0])
		)
			_this.openedSettings = args[0];
		return args;
	}
};
