import {
    Plugin,
    showMessage,
    confirm,
    Dialog,
    Menu,
    openTab,
    adaptHotkey,
    getFrontend,
    getBackend,
    Setting,
    fetchPost,
    fetchGet,
    Protyle,
    openWindow,
    IOperation,
    Constants,
    openMobileFileById,
    lockScreen,
    ICard,
    ICardData,
    Custom,
    exitSiYuan,
    getModelByDockType,
    Files,
    platformUtils,
    openAttributePanel,
    saveLayout
} from "siyuan";
import "./index.scss";
import {IMenuItem} from "siyuan/types";

const STORAGE_NAME = "click2fill-config";
const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";

interface MenuConfig {
    id: string;
    name: string;
    icon: string;
    url: string;
    method: string;
    headers: Record<string, string>;
    params: Record<string, string>;
    responseType: string;
    template: string;
}

interface PluginConfig {
    menus: MenuConfig[];
    defaultMenu: string;
}

export default class PluginSample extends Plugin {

    private custom: () => Custom;
    private isMobile: boolean;
    private blockIconEventBindThis = this.blockIconEvent.bind(this);
    private config: PluginConfig;



    onload() {
        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        // 图标的制作参见帮助文档
        this.addIcons(`<symbol id="iconFace" viewBox="0 0 32 32">
<path d="M13.667 17.333c0 0.92-0.747 1.667-1.667 1.667s-1.667-0.747-1.667-1.667 0.747-1.667 1.667-1.667 1.667 0.747 1.667 1.667zM20 15.667c-0.92 0-1.667 0.747-1.667 1.667s0.747 1.667 1.667 1.667 1.667-0.747 1.667-1.667-0.747-1.667-1.667-1.667zM29.333 16c0 7.36-5.973 13.333-13.333 13.333s-13.333-5.973-13.333-13.333 5.973-13.333 13.333-13.333 13.333 5.973 13.333 13.333zM14.213 5.493c1.867 3.093 5.253 5.173 9.12 5.173 0.613 0 1.213-0.067 1.787-0.16-1.867-3.093-5.253-5.173-9.12-5.173-0.613 0-1.213 0.067-1.787 0.16zM5.893 12.627c2.28-1.293 4.040-3.4 4.88-5.92-2.28 1.293-4.040 3.4-4.88 5.92zM26.667 16c0-1.040-0.16-2.040-0.44-2.987-0.933 0.2-1.893 0.32-2.893 0.32-4.173 0-7.893-1.92-10.347-4.92-1.4 3.413-4.187 6.093-7.653 7.4 0.013 0.053 0 0.12 0 0.187 0 5.88 4.787 10.667 10.667 10.667s10.667-4.787 10.667-10.667z"></path>
</symbol>
<symbol id="iconSaving" viewBox="0 0 32 32">
<path d="M20 13.333c0-0.733 0.6-1.333 1.333-1.333s1.333 0.6 1.333 1.333c0 0.733-0.6 1.333-1.333 1.333s-1.333-0.6-1.333-1.333zM10.667 12h6.667v-2.667h-6.667v2.667zM29.333 10v9.293l-3.76 1.253-2.24 7.453h-7.333v-2.667h-2.667v2.667h-7.333c0 0-3.333-11.28-3.333-15.333s3.28-7.333 7.333-7.333h6.667c1.213-1.613 3.147-2.667 5.333-2.667 1.107 0 2 0.893 2 2 0 0.28-0.053 0.533-0.16 0.773-0.187 0.453-0.347 0.973-0.427 1.533l3.027 3.027h2.893zM26.667 12.667h-1.333l-4.667-4.667c0-0.867 0.12-1.72 0.347-2.547-1.293 0.333-2.347 1.293-2.787 2.547h-8.227c-2.573 0-4.667 2.093-4.667 4.667 0 2.507 1.627 8.867 2.68 12.667h2.653v-2.667h8v2.667h2.68l2.067-6.867 3.253-1.093v-4.707z"></path>
</symbol>
<symbol id="iconClick2Fill" viewBox="0 0 32 32">
<rect width="32" height="32" rx="6" fill="#4A90E2"/>
<path d="M22 10L16 16L22 22" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="8" y="8" width="12" height="12" rx="2" fill="white" opacity="0.9"/>
<path d="M11 12H17" stroke="#4A90E2" stroke-width="2" stroke-linecap="round"/>
<path d="M11 16H19" stroke="#4A90E2" stroke-width="2" stroke-linecap="round"/>
<path d="M11 20H18" stroke="#4A90E2" stroke-width="2" stroke-linecap="round"/>
<path d="M24 14V20" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
<path d="M22 17H26" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
</symbol>`);

        this.custom = this.addTab({
            type: TAB_TYPE,
            init() {
                this.element.innerHTML = `<div class="plugin-click2fill__custom-tab">${this.data.text}</div>`;
            },
            beforeDestroy() {
                console.log("before destroy tab:", TAB_TYPE);
            },
            destroy() {
                console.log("destroy tab:", TAB_TYPE);
            }
        });

        this.addCommand({
            langKey: "showDialog",
            hotkey: "⇧⌘O",
            callback: () => {
                this.showDialog();
            },
        });

        this.addCommand({
            langKey: "getTab",
            hotkey: "⇧⌘M",
            globalCallback: () => {
                console.log(this.getOpenedTab());
            },
        });

        // Add shortcut for opening dynamic menu
        this.addCommand({
            langKey: "openMenu",
            hotkey: "⇧⌘I",
            callback: (protyle: Protyle) => {
                const selectedText = window.getSelection().toString().trim();
                if (!selectedText) {
                    showMessage(this.i18n.selectTextFirst);
                    return;
                }
                this.showDynamicMenu(protyle, selectedText);
            },
        });
        this.addDock({
            config: {
                position: "LeftBottom",
                size: {width: 200, height: 0},
                icon: "iconSaving",
                title: "Custom Dock",
                hotkey: "⌥⌘W",
            },
            data: {
                text: "This is my custom dock"
            },
            type: DOCK_TYPE,
            resize() {
                console.log(DOCK_TYPE + " resize");
            },
            update() {
                console.log(DOCK_TYPE + " update");
            },
            init: (dock) => {
                if (this.isMobile) {
                    dock.element.innerHTML = `<div class="toolbar toolbar--border toolbar--dark">
    <svg class="toolbar__icon"><use xlink:href="#iconEmoji"></use></svg>
        <div class="toolbar__text">Custom Dock</div>
    </div>
    <div class="fn__flex-1 plugin-click2fill__custom-dock">
        ${dock.data.text}
    </div>
</div>`;
                } else {
                    dock.element.innerHTML = `<div class="fn__flex-1 fn__flex-column">
    <div class="block__icons">
        <div class="block__logo">
            <svg class="block__logoicon"><use xlink:href="#iconEmoji"></use></svg>Custom Dock
        </div>
        <span class="fn__flex-1 fn__space"></span>
        <span data-type="min" class="block__icon b3-tooltips b3-tooltips__sw" aria-label="Min ${adaptHotkey("⌘W")}"><svg><use xlink:href="#iconMin"></use></svg></span>
    </div>
    <div class="fn__flex-1 plugin-sample__custom-dock">
        ${dock.data.text}
    </div>
</div>`;
                }
            },
            destroy() {
                console.log("destroy dock:", DOCK_TYPE);
            }
        });

        // Remove duplicate config button from settings panel
        // Configuration is now available only through the floating menu

        this.protyleSlash = [{
            filter: ["insert emoji 😊", "插入表情 😊", "crbqwx"],
            html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${this.i18n.insertEmoji}</span><span class="b3-list-item__meta">😊</span></div>`,
            id: "insertEmoji",
            callback(protyle: Protyle) {
                protyle.insert("😊");
            }
        }];

        this.protyleOptions = {
            toolbar: ["block-ref",
                "a",
                "|",
                "text",
                "strong",
                "em",
                "u",
                "s",
                "mark",
                "sup",
                "sub",
                "clear",
                "|",
                "code",
                "kbd",
                "tag",
                "inline-math",
                "inline-memo",
            ],
        };

        console.log(this.i18n.helloPlugin);
    }
    
    private loadConfig() {
        // Get configuration from storage or initialize default config
        const storedConfig = this.data[STORAGE_NAME] || {};
        this.config = {
            menus: Array.isArray(storedConfig.menus) ? storedConfig.menus : [],
            defaultMenu: storedConfig.defaultMenu || ""
        };
        console.log('Click2Fill: Loaded config:', this.config);
    }
    
    private saveConfig() {
        // Save configuration to storage
        this.saveData(STORAGE_NAME, this.config);
    }
    
    private async sendRequest(menu: MenuConfig, selectedText: string): Promise<any> {
        try {
            // Prepare request data
            const requestData: any = {
                text: selectedText
            };
            
            // Add custom params to request data
            if (menu.params) {
                Object.assign(requestData, menu.params);
            }
            
            // Prepare request options
        const options: any = {
            method: menu.method || "GET",
            headers: {
                "Content-Type": "application/json",
                ...menu.headers
            }
        };
        
        // Ensure URL has protocol prefix
        let url = menu.url;
        if (!/^https?:\/\//i.test(url)) {
            url = `http://${url}`;
        }
            
            // Add request body if method is not GET
            if (options.method !== "GET" && options.method !== "HEAD") {
                options.body = JSON.stringify(requestData);
            } else {
                // Add params to URL for GET requests
                const requestUrl = new URL(url);
                Object.entries(requestData).forEach(([key, value]) => {
                    requestUrl.searchParams.append(key, value.toString());
                });
                url = requestUrl.toString();
            }
            
            // Send request
            console.log('Click2Fill: Request details:', {
                url: url,
                method: options.method,
                headers: options.headers,
                body: options.body,
                requestData: requestData
            });
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                console.error('Click2Fill: Response error details:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url
                });
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            
            // Parse response based on response type
            let data;
            switch (menu.responseType || "json") {
                case "json":
                    data = await response.json();
                    break;
                case "text":
                    data = await response.text();
                    break;
                case "blob":
                    data = await response.blob();
                    break;
                case "arrayBuffer":
                    data = await response.arrayBuffer();
                    break;
                default:
                    data = await response.json();
            }
            
            return data;
        } catch (error) {
            console.error("Request failed:", error);
            throw error;
        }
    }

    onLayoutReady() {
        const topBarElement = this.addTopBar({
            icon: "iconSettings",
            title: this.i18n.configure,
            position: "right",
            callback: () => {
                this.openConfigurePanel();
            }
        });
        const statusIconTemp = document.createElement("template");
        statusIconTemp.innerHTML = `<div class="toolbar__item ariaLabel" aria-label="Remove click2fill Data">
    <svg>
        <use xlink:href="#iconTrashcan"></use>
    </svg>
</div>`;
        statusIconTemp.content.firstElementChild.addEventListener("click", () => {
            confirm("⚠️", this.i18n.confirmRemove.replace("${name}", this.name), () => {
                this.removeData(STORAGE_NAME).then(() => {
                    this.data[STORAGE_NAME] = {menus: [], defaultMenu: ""};
                    this.loadConfig();
                    showMessage(`[${this.name}]: ${this.i18n.removedData}`);
                });
            });
        });
        this.addStatusBar({
            element: statusIconTemp.content.firstElementChild as HTMLElement,
        });
        this.loadData(STORAGE_NAME).then(() => {
            // Update config after loading data
            this.loadConfig();
            console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);
        });
    }

    onunload() {
        console.log(this.i18n.byePlugin);
    }

    uninstall() {
        console.log("uninstall");
    }

    // 使用 saveData() 存储的数据发生变更时触发，注释掉则自动禁用插件再重新启用
    // Triggered when data stored using saveData() changes. If commented out, the plugin will be automatically disabled and then re-enabled.
    // onDataChanged() {
    //     console.log("onDataChanged");
    // }

    private showDynamicMenu(protyle: Protyle, selectedText: string) {
        // Ensure config is loaded
        if (!this.config || !Array.isArray(this.config.menus)) {
            this.loadConfig();
            console.log('Click2Fill: showDynamicMenu - Reloaded config:', this.config);
        }
        
        console.log('Click2Fill: showDynamicMenu - Config available:', !!this.config);
        console.log('Click2Fill: showDynamicMenu - Menus config:', this.config?.menus);
        
        // Create menu with correct API
        const menu = new Menu("click2fill", () => {
            console.log("Menu closed");
        });
        
        // Add dynamic menu items from config
        if (this.config && this.config.menus && this.config.menus.length > 0) {
            console.log('Click2Fill: showDynamicMenu - Adding', this.config.menus.length, 'menu items');
            this.config.menus.forEach(menuConfig => {
                console.log('Click2Fill: Adding menu:', menuConfig.name, 'with icon:', menuConfig.icon);
                menu.addItem({
                    id: menuConfig.id,
                    iconHTML: `<svg class="b3-menu__icon"><use xlink:href="#${menuConfig.icon}"></use></svg>`,
                    label: menuConfig.name,
                    click: () => {
                        // Handle menu click
                        this.handleMenuClick(protyle, selectedText, menuConfig);
                    }
                });
            });
            
            // Add separator
            menu.addItem({type: "separator"});
        } else {
            console.log('Click2Fill: showDynamicMenu - No menus configured');
        }
        
        // Add configure menu item
        menu.addItem({
            id: "configure",
            iconHTML: `<svg class="b3-menu__icon"><use xlink:href="#iconSettings"></use></svg>`,
            label: this.i18n.configure,
            click: () => {
                // Open configuration panel
                this.openConfigurePanel();
            }
        });
        
        // Get cursor position instead of mouse position
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;
        
        try {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                x = rect.left;
                y = rect.bottom;
            }
        } catch (error) {
            console.error('Failed to get cursor position:', error);
        }
        
        // Show menu with correct API
        menu.open({x: x, y: y});
    }
    
    private async handleMenuClick(protyle: Protyle, selectedText: string, menu: MenuConfig) {
        try {
            // Send API request
            const data = await this.sendRequest(menu, selectedText);
            
            // Prepare content to insert
            let content = this.formatResponse(data, menu);
            
            // Insert content into document
            this.insertContent(protyle, content);
            
            // Show success message
            showMessage(this.i18n.contentInserted);
        } catch (error) {
            console.error("Failed to get content:", error);
            showMessage(this.i18n.requestFailed);
        }
    }
    
    private formatResponse(data: any, menu: MenuConfig): string {
        // Use template if provided
        if (menu.template) {
            try {
                // Simple template rendering using ${key} syntax
                return menu.template.replace(/\$\{(\w+)\}/g, (match, key) => {
                    return data[key] !== undefined ? data[key] : match;
                });
            } catch (error) {
                console.error("Template rendering failed:", error);
            }
        }
        
        // Default formatting based on response type
        if (typeof data === "object") {
            return JSON.stringify(data, null, 2);
        } else {
            return String(data);
        }
    }
    
    private insertContent(protyle: Protyle, content: string) {
        // Get selection range
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }
        
        const range = selection.getRangeAt(0);
        
        // Move cursor to the end of selected text
        range.collapse(false);
        
        // Insert new content after selected text
        range.insertNode(document.createTextNode(content));
        
        // Move cursor to end of inserted content
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
    private openConfigurePanel() {
        const dialog = new Dialog({
            title: this.i18n.configure,
            content: `
                <div class="plugin-click2fill__config">
                    <div class="plugin-click2fill__config-header">
                        <h3>${this.i18n.click2fill} ${this.i18n.configure}</h3>
                        <button id="plugin-click2fill__add-menu" class="b3-button b3-button--outline b3-button--small">
                            ${this.i18n.addMenu}
                        </button>
                    </div>
                    <div id="plugin-click2fill__menu-list" class="plugin-click2fill__menu-list">
                        ${this.renderMenuList()}
                    </div>
                </div>
            `,
            width: 600,
            height: 500,
            destroyCallback: () => {
                console.log("Configuration panel closed");
            }
        });
        
        // Bind events after dialog is opened
        setTimeout(() => {
            this.bindConfigPanelEvents(dialog.element);
        }, 0);
    }
    
    private renderMenuList(): string {
        if (!this.config.menus || this.config.menus.length === 0) {
            return `<div class="plugin-click2fill__empty">${this.i18n.noMenusConfigured}</div>`;
        }
        
        return this.config.menus.map(menu => `
            <div class="plugin-click2fill__menu-item" data-id="${menu.id}">
                <div class="plugin-click2fill__menu-info">
                    <div class="plugin-click2fill__menu-name">${menu.name}</div>
                    <div class="plugin-click2fill__menu-url">${menu.url}</div>
                </div>
                <div class="plugin-click2fill__menu-actions">
                    <button class="b3-button b3-button--outline b3-button--small plugin-click2fill__edit-menu">
                        ${this.i18n.editMenu}
                    </button>
                    <button class="b3-button b3-button--outline b3-button--small plugin-click2fill__delete-menu">
                        ${this.i18n.deleteMenu}
                    </button>
                </div>
            </div>
        `).join("");
    }
    
    private bindConfigPanelEvents(dialogElement: HTMLElement) {
        // Add menu button
        const addMenuButton = dialogElement.querySelector("#plugin-click2fill__add-menu") as HTMLElement;
        addMenuButton.addEventListener("click", () => {
            this.openMenuEditDialog(null);
        });
        
        // Edit menu buttons
        dialogElement.querySelectorAll(".plugin-click2fill__edit-menu").forEach(button => {
            button.addEventListener("click", (e) => {
                const menuElement = (e.target as HTMLElement).closest(".plugin-click2fill__menu-item");
                if (menuElement) {
                    const menuId = menuElement.getAttribute("data-id");
                    const menu = this.config.menus.find(m => m.id === menuId);
                    if (menu) {
                        this.openMenuEditDialog(menu);
                    }
                }
            });
        });
        
        // Delete menu buttons
        dialogElement.querySelectorAll(".plugin-click2fill__delete-menu").forEach(button => {
            button.addEventListener("click", (e) => {
                const menuElement = (e.target as HTMLElement).closest(".plugin-click2fill__menu-item");
                if (menuElement) {
                    const menuId = menuElement.getAttribute("data-id");
                    const menu = this.config.menus.find(m => m.id === menuId);
                    if (menu) {
                        this.deleteMenu(menu);
                    }
                }
            });
        });
    }
    
    private openMenuEditDialog(menu: MenuConfig | null) {
        const isEdit = menu !== null;
        const dialog = new Dialog({
            title: isEdit ? this.i18n.editMenu : this.i18n.addMenu,
            content: `
                <div class="plugin-click2fill__menu-edit">
                    <div class="plugin-click2fill__form-item">
                        <label>${this.i18n.menuName}</label>
                        <input type="text" id="plugin-click2fill__menu-name" class="b3-text-field" value="${menu?.name || ""}">
                    </div>
                    <div class="plugin-click2fill__form-item">
                        <label>${this.i18n.menuUrl}</label>
                        <input type="text" id="plugin-click2fill__menu-url" class="b3-text-field" value="${menu?.url || ""}">
                    </div>
                    <div class="plugin-click2fill__form-item">
                        <label>${this.i18n.menuMethod}</label>
                        <select id="plugin-click2fill__menu-method" class="b3-select">
                            <option value="GET" ${menu?.method === "GET" ? "selected" : ""}>GET</option>
                            <option value="POST" ${menu?.method === "POST" ? "selected" : ""}>POST</option>
                            <option value="PUT" ${menu?.method === "PUT" ? "selected" : ""}>PUT</option>
                            <option value="DELETE" ${menu?.method === "DELETE" ? "selected" : ""}>DELETE</option>
                        </select>
                    </div>
                    <div class="plugin-click2fill__form-item">
                        <label>${this.i18n.menuHeaders}</label>
                        <textarea id="plugin-click2fill__menu-headers" class="b3-text-field fn__block" rows="3">${menu?.headers ? JSON.stringify(menu.headers, null, 2) : "{}"}</textarea>
                    </div>
                    <div class="plugin-click2fill__form-item">
                        <label>${this.i18n.menuParams}</label>
                        <textarea id="plugin-click2fill__menu-params" class="b3-text-field fn__block" rows="3">${menu?.params ? JSON.stringify(menu.params, null, 2) : "{}"}</textarea>
                    </div>
                    <div class="plugin-click2fill__form-item">
                        <label>${this.i18n.menuTemplate}</label>
                        <textarea id="plugin-click2fill__menu-template" class="b3-text-field fn__block" rows="3">${menu?.template || ""}</textarea>
                    </div>
                    <div class="b3-dialog__action">
                        <button class="b3-button b3-button--cancel" id="plugin-click2fill__cancel">${this.i18n.cancel}</button>
                        <div class="fn__space"></div>
                        <button class="b3-button b3-button--text" id="plugin-click2fill__save">${this.i18n.save}</button>
                    </div>
                </div>
            `,
            width: 500,
            height: 500
        });
        
        // Bind event handlers after dialog is opened
        setTimeout(() => {
            const cancelBtn = dialog.element.querySelector("#plugin-click2fill__cancel");
            const saveBtn = dialog.element.querySelector("#plugin-click2fill__save");
            
            if (cancelBtn) {
                cancelBtn.addEventListener("click", () => {
                    dialog.destroy();
                });
            }
            
            if (saveBtn) {
                saveBtn.addEventListener("click", () => {
                    this.saveMenu(menu ? menu.id : null);
                    dialog.destroy();
                });
            }
        }, 0);
    }
    
    private saveMenu(menuId: string | null) {
        // Get form values
        const name = document.getElementById("plugin-click2fill__menu-name") as HTMLInputElement;
        const url = document.getElementById("plugin-click2fill__menu-url") as HTMLInputElement;
        const method = document.getElementById("plugin-click2fill__menu-method") as HTMLSelectElement;
        const headers = document.getElementById("plugin-click2fill__menu-headers") as HTMLTextAreaElement;
        const params = document.getElementById("plugin-click2fill__menu-params") as HTMLTextAreaElement;
        const template = document.getElementById("plugin-click2fill__menu-template") as HTMLTextAreaElement;
        
        // Validate required fields
        if (!name.value.trim() || !url.value.trim()) {
            showMessage("请填写必填字段");
            return;
        }
        
        // Parse JSON fields
        let headersData: Record<string, string> = {};
        let paramsData: Record<string, string> = {};
        
        try {
            headersData = JSON.parse(headers.value) || {};
            paramsData = JSON.parse(params.value) || {};
        } catch (error) {
            showMessage("JSON格式错误");
            return;
        }
        
        // Create or update menu
        // Ensure URL has protocol prefix when saving
        let menuUrl = url.value.trim();
        if (!/^https?:\/\//i.test(menuUrl)) {
            menuUrl = `http://${menuUrl}`;
        }
        
        const menu: MenuConfig = {
            id: menuId || this.generateMenuId(),
            name: name.value.trim(),
            icon: "iconLink", // Default icon
            url: menuUrl,
            method: method.value,
            headers: headersData,
            params: paramsData,
            responseType: "json",
            template: template.value.trim()
        };
        
        if (menuId) {
            // Update existing menu
            const index = this.config.menus.findIndex(m => m.id === menuId);
            if (index !== -1) {
                this.config.menus[index] = menu;
            }
        } else {
            // Add new menu
            this.config.menus.push(menu);
        }
        
        // Save config
        this.saveConfig();
        console.log('Click2Fill: Saved menu:', menu);
        console.log('Click2Fill: All menus after save:', this.config.menus);
        
        // Update menu list in config panel
        const menuListElement = document.getElementById("plugin-click2fill__menu-list");
        if (menuListElement) {
            menuListElement.innerHTML = this.renderMenuList();
            this.bindConfigPanelEvents(menuListElement.closest(".plugin-click2fill__config") as HTMLElement);
        }
        
        // Show success message
        showMessage(this.i18n.configSaved);
    }
    
    private deleteMenu(menu: MenuConfig) {
        confirm("⚠️", this.i18n.confirmDeleteMenu, () => {
            this.config.menus = this.config.menus.filter(m => m.id !== menu.id);
            this.saveConfig();
            
            // Update menu list
            const menuListElement = document.getElementById("plugin-click2fill__menu-list");
            if (menuListElement) {
                menuListElement.innerHTML = this.renderMenuList();
                this.bindConfigPanelEvents(menuListElement.closest(".plugin-click2fill__config") as HTMLElement);
            }
            
            // Show success message
            showMessage(this.i18n.configSaved);
        });
    }
    
    private generateMenuId(): string {
        return "menu-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    }
    
    async updateCards(options: ICardData) {
        options.cards.sort((a: ICard, b: ICard) => {
            if (a.blockID < b.blockID) {
                return -1;
            }
            if (a.blockID > b.blockID) {
                return 1;
            }
            return 0;
        });
        return options;
    }

    /* 自定义设置
    openSetting() {
        const dialog = new Dialog({
            title: this.name,
            content: `<div class="b3-dialog__content"><textarea class="b3-text-field fn__block" placeholder="readonly text in the menu"></textarea></div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${this.i18n.cancel}</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text">${this.i18n.save}</button>
</div>`,
            width: this.isMobile ? "92vw" : "520px",
        });
        const inputElement = dialog.element.querySelector("textarea");
        inputElement.value = this.data[STORAGE_NAME].readonlyText;
        const btnsElement = dialog.element.querySelectorAll(".b3-button");
        dialog.bindInput(inputElement, () => {
            (btnsElement[1] as HTMLButtonElement).click();
        });
        inputElement.focus();
        btnsElement[0].addEventListener("click", () => {
            dialog.destroy();
        });
        btnsElement[1].addEventListener("click", () => {
            this.saveData(STORAGE_NAME, {readonlyText: inputElement.value});
            dialog.destroy();
        });
    }
    */

    private eventBusPaste(event: any) {
        // 如果需异步处理请调用 preventDefault， 否则会进行默认处理
        event.preventDefault();
        // 如果使用了 preventDefault，必须调用 resolve，否则程序会卡死
        event.detail.resolve({
            textPlain: event.detail.textPlain.trim(),
        });
    }

    private eventBusLog({detail}: any) {
        console.log(detail);
    }

    private blockIconEvent({detail}: any) {
        detail.menu.addItem({
            id: "pluginSample_removeSpace",
            iconHTML: "",
            label: this.i18n.removeSpace,
            click: () => {
                const doOperations: IOperation[] = [];
                detail.blockElements.forEach((item: HTMLElement) => {
                    const editElement = item.querySelector('[contenteditable="true"]');
                    if (editElement) {
                        editElement.textContent = editElement.textContent.replace(/ /g, "");
                        doOperations.push({
                            id: item.dataset.nodeId,
                            data: item.outerHTML,
                            action: "update"
                        });
                    }
                });
                detail.protyle.getInstance().transaction(doOperations);
            }
        });
    }

    private showDialog() {
        const dialog = new Dialog({
            title: `SiYuan ${Constants.SIYUAN_VERSION}`,
            content: `<div class="b3-dialog__content">
    <div>appId:</div>
    <div class="fn__hr"></div>
    <div class="plugin-sample__time">${this.app.appId}</div>
    <div class="fn__hr"></div>
    <div class="fn__hr"></div>
    <div>API demo:</div>
    <div class="fn__hr"></div>
    <div class="plugin-sample__time">System current time: <span id="time"></span></div>
    <div class="fn__hr"></div>
    <div class="fn__hr"></div>
    <div>Protyle demo:</div>
    <div class="fn__hr"></div>
    <div id="protyle" style="height: 360px;"></div>
</div>`,
            width: this.isMobile ? "92vw" : "560px",
            height: "540px",
        });
        new Protyle(this.app, dialog.element.querySelector("#protyle"), {
            blockId: this.getEditor().protyle.block.rootID,
        });
        fetchPost("/api/system/currentTime", {}, (response) => {
            dialog.element.querySelector("#time").innerHTML = new Date(response.data).toString();
        });
    }

    private addMenu(rect?: DOMRect) {
        const menu = new Menu("topBarSample", () => {
            console.log(this.i18n.byeMenu);
        });
        menu.addItem({
            icon: "iconSettings",
            label: "Open Setting",
            click: () => {
                openSetting(this.app);
            }
        });
        menu.addItem({
            icon: "iconDrag",
            label: "Open Attribute Panel",
            click: () => {
                openAttributePanel({
                    nodeElement: this.getEditor().protyle.wysiwyg.element.firstElementChild as HTMLElement,
                    protyle: this.getEditor().protyle,
                    focusName: "custom",
                });
            }
        });
        menu.addItem({
            icon: "iconInfo",
            label: "Dialog(open doc first)",
            accelerator: this.commands[0].customHotkey,
            click: () => {
                this.showDialog();
            }
        });
        menu.addItem({
            icon: "iconFocus",
            label: "Select Opened Doc(open doc first)",
            click: () => {
                (getModelByDockType("file") as Files).selectItem(this.getEditor().protyle.notebookId, this.getEditor().protyle.path);
            }
        });
        if (!this.isMobile) {
            menu.addItem({
                icon: "iconFace",
                label: "Open Custom Tab",
                click: () => {
                    const tab = openTab({
                        app: this.app,
                        custom: {
                            icon: "iconFace",
                            title: "Custom Tab",
                            data: {
                                text: platformUtils.isHuawei() ? "Hello, Huawei!" : "This is my custom tab",
                            },
                            id: this.name + TAB_TYPE
                        },
                    });
                    console.log(tab);
                }
            });
            menu.addItem({
                icon: "iconImage",
                label: "Open Asset Tab(First open the Chinese help document)",
                click: () => {
                    const tab = openTab({
                        app: this.app,
                        asset: {
                            path: "assets/paragraph-20210512165953-ag1nib4.svg"
                        }
                    });
                    console.log(tab);
                }
            });
            menu.addItem({
                icon: "iconFile",
                label: "Open Doc Tab(open doc first)",
                click: async () => {
                    const tab = await openTab({
                        app: this.app,
                        doc: {
                            id: this.getEditor().protyle.block.rootID,
                        }
                    });
                    console.log(tab);
                }
            });
            menu.addItem({
                icon: "iconSearch",
                label: "Open Search Tab",
                click: () => {
                    const tab = openTab({
                        app: this.app,
                        search: {
                            k: "SiYuan"
                        }
                    });
                    console.log(tab);
                }
            });
            menu.addItem({
                icon: "iconRiffCard",
                label: "Open Card Tab",
                click: () => {
                    const tab = openTab({
                        app: this.app,
                        card: {
                            type: "all"
                        }
                    });
                    console.log(tab);
                }
            });
            menu.addItem({
                icon: "iconLayout",
                label: "Open Float Layer(open doc first)",
                click: () => {
                    this.addFloatLayer({
                        refDefs: [{refID: this.getEditor().protyle.block.rootID}],
                        x: window.innerWidth - 768 - 120,
                        y: 32,
                        isBacklink: false
                    });
                }
            });
            menu.addItem({
                icon: "iconOpenWindow",
                label: "Open Doc Window(open doc first)",
                click: () => {
                    openWindow({
                        doc: {id: this.getEditor().protyle.block.rootID}
                    });
                }
            });
        } else {
            menu.addItem({
                icon: "iconFile",
                label: "Open Doc(open doc first)",
                click: () => {
                    openMobileFileById(this.app, this.getEditor().protyle.block.rootID);
                }
            });
        }
        menu.addItem({
            icon: "iconLock",
            label: "Lockscreen",
            click: () => {
                lockScreen(this.app);
            }
        });
        menu.addItem({
            icon: "iconQuit",
            label: "Exit Application",
            click: () => {
                exitSiYuan();
            }
        });
        menu.addItem({
            icon: "iconDownload",
            label: "Save Layout",
            click: () => {
                saveLayout(() => {
                    showMessage("Layout saved");
                });
            }
        });
        menu.addItem({
            icon: "iconScrollHoriz",
            label: "Event Bus",
            type: "submenu",
            submenu: [{
                icon: "iconSelect",
                label: "On ws-main",
                click: () => {
                    this.eventBus.on("ws-main", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off ws-main",
                click: () => {
                    this.eventBus.off("ws-main", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On click-blockicon",
                click: () => {
                    this.eventBus.on("click-blockicon", this.blockIconEventBindThis);
                }
            }, {
                icon: "iconClose",
                label: "Off click-blockicon",
                click: () => {
                    this.eventBus.off("click-blockicon", this.blockIconEventBindThis);
                }
            }, {
                icon: "iconSelect",
                label: "On click-pdf",
                click: () => {
                    this.eventBus.on("click-pdf", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off click-pdf",
                click: () => {
                    this.eventBus.off("click-pdf", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On click-editorcontent",
                click: () => {
                    this.eventBus.on("click-editorcontent", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off click-editorcontent",
                click: () => {
                    this.eventBus.off("click-editorcontent", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On click-editortitleicon",
                click: () => {
                    this.eventBus.on("click-editortitleicon", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off click-editortitleicon",
                click: () => {
                    this.eventBus.off("click-editortitleicon", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On click-flashcard-action",
                click: () => {
                    this.eventBus.on("click-flashcard-action", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off click-flashcard-action",
                click: () => {
                    this.eventBus.off("click-flashcard-action", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-noneditableblock",
                click: () => {
                    this.eventBus.on("open-noneditableblock", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-noneditableblock",
                click: () => {
                    this.eventBus.off("open-noneditableblock", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On loaded-protyle-static",
                click: () => {
                    this.eventBus.on("loaded-protyle-static", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off loaded-protyle-static",
                click: () => {
                    this.eventBus.off("loaded-protyle-static", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On loaded-protyle-dynamic",
                click: () => {
                    this.eventBus.on("loaded-protyle-dynamic", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off loaded-protyle-dynamic",
                click: () => {
                    this.eventBus.off("loaded-protyle-dynamic", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On switch-protyle",
                click: () => {
                    this.eventBus.on("switch-protyle", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off switch-protyle",
                click: () => {
                    this.eventBus.off("switch-protyle", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On destroy-protyle",
                click: () => {
                    this.eventBus.on("destroy-protyle", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off destroy-protyle",
                click: () => {
                    this.eventBus.off("destroy-protyle", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-doctree",
                click: () => {
                    this.eventBus.on("open-menu-doctree", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-doctree",
                click: () => {
                    this.eventBus.off("open-menu-doctree", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-blockref",
                click: () => {
                    this.eventBus.on("open-menu-blockref", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-blockref",
                click: () => {
                    this.eventBus.off("open-menu-blockref", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-fileannotationref",
                click: () => {
                    this.eventBus.on("open-menu-fileannotationref", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-fileannotationref",
                click: () => {
                    this.eventBus.off("open-menu-fileannotationref", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-tag",
                click: () => {
                    this.eventBus.on("open-menu-tag", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-tag",
                click: () => {
                    this.eventBus.off("open-menu-tag", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-link",
                click: () => {
                    this.eventBus.on("open-menu-link", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-link",
                click: () => {
                    this.eventBus.off("open-menu-link", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-image",
                click: () => {
                    this.eventBus.on("open-menu-image", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-image",
                click: () => {
                    this.eventBus.off("open-menu-image", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-av",
                click: () => {
                    this.eventBus.on("open-menu-av", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-av",
                click: () => {
                    this.eventBus.off("open-menu-av", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-content",
                click: () => {
                    this.eventBus.on("open-menu-content", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-content",
                click: () => {
                    this.eventBus.off("open-menu-content", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-breadcrumbmore",
                click: () => {
                    this.eventBus.on("open-menu-breadcrumbmore", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-breadcrumbmore",
                click: () => {
                    this.eventBus.off("open-menu-breadcrumbmore", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-menu-inbox",
                click: () => {
                    this.eventBus.on("open-menu-inbox", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-menu-inbox",
                click: () => {
                    this.eventBus.off("open-menu-inbox", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On input-search",
                click: () => {
                    this.eventBus.on("input-search", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off input-search",
                click: () => {
                    this.eventBus.off("input-search", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On paste",
                click: () => {
                    this.eventBus.on("paste", this.eventBusPaste);
                }
            }, {
                icon: "iconClose",
                label: "Off paste",
                click: () => {
                    this.eventBus.off("paste", this.eventBusPaste);
                }
            }, {
                icon: "iconSelect",
                label: "On open-siyuan-url-plugin",
                click: () => {
                    this.eventBus.on("open-siyuan-url-plugin", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-siyuan-url-plugin",
                click: () => {
                    this.eventBus.off("open-siyuan-url-plugin", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On open-siyuan-url-block",
                click: () => {
                    this.eventBus.on("open-siyuan-url-block", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off open-siyuan-url-block",
                click: () => {
                    this.eventBus.off("open-siyuan-url-block", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On opened-notebook",
                click: () => {
                    this.eventBus.on("opened-notebook", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off opened-notebook",
                click: () => {
                    this.eventBus.off("opened-notebook", this.eventBusLog);
                }
            }, {
                icon: "iconSelect",
                label: "On closed-notebook",
                click: () => {
                    this.eventBus.on("closed-notebook", this.eventBusLog);
                }
            }, {
                icon: "iconClose",
                label: "Off closed-notebook",
                click: () => {
                    this.eventBus.off("closed-notebook", this.eventBusLog);
                }
            }]
        });
        menu.addSeparator();
        menu.addItem({
            icon: "iconSparkles",
            label: this.data[STORAGE_NAME].readonlyText || "Readonly",
            type: "readonly",
        });
        if (this.isMobile) {
            menu.fullscreen();
        } else {
            menu.open({
                x: rect.right,
                y: rect.bottom,
                isLeft: true,
            });
        }
    }

    private getEditor() {
        const editors = getAllEditor();
        if (editors.length === 0) {
            showMessage("please open doc first");
            return;
        }
        return editors[0];
    }
}
