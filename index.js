const { Plugin } = require("powercord/entities");
const { inject, uninject } = require("powercord/injector");
const {
    React,
    getModule,
    i18n: { Messages }
} = require("powercord/webpack");
const { findInReactTree } = require("powercord/util");
const {
    Button,
    Card,
    Clickable,
    Divider,
    Icons: { Close },
    Tooltip
} = require("powercord/components");
const PluginSettings = require("./Settings");
const { resolve, join } = require("path");
var _this;

module.exports = class BDLikeSettings extends (
    Plugin
) {
    async startPlugin() {
        _this = this;

        powercord.api.settings.registerSettings(this.entityID, {
            category: this.entityID,
            label: "BD-Like Plugin Settings",
            render: PluginSettings
        });

        const moduleManagerPath = resolve(__dirname, "..", "pc-moduleManager");
        const settingsPath = resolve(__dirname, "..", "pc-settings");

        const InstalledProduct = require(join(
            moduleManagerPath,
            "components/parts/InstalledProduct.jsx"
        ));
        const Settings = require(join(settingsPath, "index.js"));
        this.ErrorBoundary = require(join(
            settingsPath,
            "components/ErrorBoundary.jsx"
        ));

        const SettingsView = await getModule(
            m => m.displayName == "SettingsView"
        );
        const settingsModule = await getModule(["open", "saveAccountChanges"]);

        inject(
            "bd-like-settings_IPrenderPatch",
            InstalledProduct.prototype,
            "render",
            this.IPrenderPatch
        );
        inject(
            "bd-like-settings_IPrenderFooterPatch",
            InstalledProduct.prototype,
            "renderFooter",
            this.IPrenderFooterPatch
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
            settingsModule,
            "open",
            this.openPatch,
            true
        );
    }

    pluginWillUnload() {
        uninject("bd-like-settings_IPrenderPatch");
        uninject("bd-like-settings_IPrenderFooterPatch");
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

    IPrenderPatch(_, res) {
        if (!this.props.isEnabled || this.props.isAPlugin === false) return res;
        if (
            !this.props.hasSettings ||
            !this.state ||
            !this.state.renderSettings
        )
            return res;
        const Settings = this.props.settingsTab.render;
        return React.createElement(
            Card,
            {
                className: "powercord-product"
            },
            [
                this.renderHeader(),
                React.createElement(Divider),
                React.createElement(
                    "div",
                    { style: { display: "flex", "flex-direction": "column" } },
                    React.createElement(
                        "div",
                        {
                            style: {
                                width: "24px",
                                float: "right",
                                "align-self": "flex-end",
                                margin: "5px"
                            }
                        },
                        React.createElement(
                            Tooltip,
                            { text: Messages.CLOSE },
                            React.createElement(
                                Clickable,
                                {
                                    onClick: () => {
                                        this.setState({
                                            renderSettings: false
                                        });
                                    }
                                },
                                React.createElement(Close)
                            )
                        )
                    ),
                    React.createElement(
                        "div",
                        null,
                        React.createElement(
                            _this.ErrorBoundary,
                            null,
                            React.createElement(Settings)
                        )
                    )
                )
            ]
        );
    }

    IPrenderFooterPatch(_, res) {
        if (
            res === null ||
            !this.props.isEnabled ||
            this.props.isAPlugin === false ||
            this.props.hasSettings === false
        )
            return res;
        if (!this.props.plugin) {
            const plugin = [...powercord.pluginManager.plugins.values()].find(
                p =>
                    JSON.stringify(p.manifest) ==
                    JSON.stringify(this.props.product)
            );
            if (!plugin) {
                this.props.isAPlugin = false;
                return;
            }
            this.props.plugin = plugin;
        }
        if (
            this.props.plugin.entityID.startsWith("pc-") ||
            _this.settings.get(this.props.plugin.entityID)
        ) {
            this.props.hasSettings = false;
            return res;
        }
        const tabs = Object.values(powercord.api.settings.tabs);
        if (
            (this.props.settingsTab =
                powercord.api.settings.tabs[this.props.plugin.entityID] ||
                tabs.find(t => t.category == this.props.plugin.entityID)) &&
            this.props.settingsTab
        )
            this.props.hasSettings = true;
        else this.props.hasSettings = false;
        if (this.props.hasSettings) {
            const buttons = findInReactTree(
                res,
                c => c.props && c.props.className == "powercord-product-footer"
            );
            if (!Array.isArray(buttons.props.children))
                buttons.props.children = [buttons.props.children];
            buttons.props.children.unshift(
                React.createElement(
                    Button,
                    {
                        onClick: () => {
                            this.setState({ renderSettings: true });
                        },
                        color: Button.Colors.BRAND,
                        look: Button.Looks.FILLED,
                        size: Button.Sizes.SMALL,
                        style: { left: "-5px" }
                    },
                    Messages.SETTINGS
                )
            );
            buttons.props.style = { display: "flex", "flex-direction": "row" };
            if (!this.state) this.setState({ renderSettings: false });
        }
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
