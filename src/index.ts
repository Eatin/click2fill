import { Plugin, showMessage, confirm, Dialog, Menu, Proactwrite } from "siyuan";

const STORAGE_NAME = "click2fill-config";

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
    keyword?: string;
    regex?: string;
}

interface PluginConfig {
    menus: MenuConfig[];
    defaultMenu: string;
}

export default class PluginSample extends Plugin {

    private config: PluginConfig;

    onload() {
        this.addIcons(`<symbol id="iconFace" viewBox="0 0 32 32">
<path d="M13.667 17.333c0 0.92-0.747 1.667-1.667 1.667s-1.667-0.747-1.667-1.667 0.747-1.667 1.667-1.667 1.667 0.747 1.667 1.667zM20 15.667c-0.92 0-1.667 0.747-1.667 1.667s0.747 1.667 1.667 1.667 1.667-0.6 1.667-1.333c0-0.733-0.6-1.333-1.333-1.333s-1.333 0.6-1.333 1.333zM14.213 5.493c1.867 3.093 5.253 5.173 9.12 5.173 0.613 0 1.213-0.067 1.787-0.16-1.867-3.093-5.253-5.173-9.12-5.173-0.613 0-1.213 0.067-1.787 0.16zM5.893 12.627c2.28-1.293 4.04-3.4 4.88-5.92-2.28 1.293-4.04 3.4-4.88 5.92zM26.667 16c0-1.040-0.16-2.040-0.44-2.987-0.933 0.2-1.893 0.32-2.893 0.32-4.173 0-7.893-1.92-10.347-4.92-1.4 3.413-4.187 6.093-7.653 7.4 0.013 0.053 0 0.12 0 0.187 0 5.88 4.787 10.667 10.667 10.667s10.667-4.787 10.667-10.667z"></path>
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

        this.addCommand({
            langKey: "openMenu",
            hotkey: "⇧⌘I",
            callback: (protyle: Proactwrite) => {
                const selectedText = window.getSelection().toString().trim();
                if (!selectedText) {
                    showMessage(this.i18n.selectTextFirst);
                    return;
                }
                this.showDynamicMenu(protyle, selectedText);
            },
        });
    }
    
    private loadConfig() {
        const storedConfig = this.data[STORAGE_NAME] || {};
        this.config = {
            menus: Array.isArray(storedConfig.menus) ? storedConfig.menus : [],
            defaultMenu: storedConfig.defaultMenu || ""
        };
    }
    
    private saveConfig() {
        this.saveData(STORAGE_NAME, this.config);
    }
    
    private async sendRequest(menu: MenuConfig, selectedText: string): Promise<any> {
        const requestData: any = {
            text: selectedText
        };
        
        if (menu.params) {
            // 创建params的深拷贝，避免修改原始配置
            const paramsCopy = JSON.parse(JSON.stringify(menu.params));
            
            // 递归替换所有${selectText}占位符为实际选中的文本
            const replaceSelectText = (obj: any): any => {
                if (typeof obj === 'string') {
                    return obj.replace(/\$\{selectText\}/g, selectedText);
                } else if (typeof obj === 'object' && obj !== null) {
                    if (Array.isArray(obj)) {
                        return obj.map(item => replaceSelectText(item));
                    } else {
                        const result: any = {};
                        for (const key in obj) {
                            if (obj.hasOwnProperty(key)) {
                                result[key] = replaceSelectText(obj[key]);
                            }
                        }
                        return result;
                    }
                }
                return obj;
            };
            
            const processedParams = replaceSelectText(paramsCopy);
            Object.assign(requestData, processedParams);
        }
        
        const options: any = {
            method: menu.method || "GET",
            headers: {
                "Content-Type": "application/json",
                ...menu.headers
            }
        };
        
        let url = menu.url;
        if (!/^https?:\/\//i.test(url)) {
            url = `http://${url}`;
        }
            
        if (options.method !== "GET" && options.method !== "HEAD") {
            options.body = JSON.stringify(requestData);
        } else {
            const requestUrl = new URL(url);
            Object.entries(requestData).forEach(([key, value]) => {
                requestUrl.searchParams.append(key, value.toString());
            });
            url = requestUrl.toString();
        }
            
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
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
    }

    onLayoutReady() {
        this.loadConfig();
    }

    onunload() {

    }

    async uninstall() {
        await this.removeData(STORAGE_NAME);
    }

    private isMenuMatch(menuConfig: MenuConfig, selectedText: string): boolean {
        if (!menuConfig.keyword && !menuConfig.regex) {
            return true;
        }
        
        if (menuConfig.regex) {
            try {
                const regex = new RegExp(menuConfig.regex);
                return regex.test(selectedText);
            } catch (error) {
                // Invalid regex, fallback to keyword matching
            }
        }
        
        if (menuConfig.keyword) {
            const keywords = menuConfig.keyword.split(/[,，]/);
            return keywords.some(keyword => {
                const trimmedKeyword = keyword.trim();
                return trimmedKeyword && selectedText.includes(trimmedKeyword);
            });
        }
        
        return true;
    }
    
    private showDynamicMenu(protyle: Proactwrite, selectedText: string) {
        if (!this.config || !Array.isArray(this.config.menus)) {
            this.loadConfig();
        }
        
        const menu = new Menu("click2fill", () => {

        });
        
        const matchedMenus = this.config.menus.filter(menuConfig => {
            return this.isMenuMatch(menuConfig, selectedText);
        });
        
        if (matchedMenus.length > 0) {
            matchedMenus.forEach(menuConfig => {

                menu.addItem({
                    id: menuConfig.id,
                    iconHTML: `<svg class="b3-menu__icon"><use xlink:href="#${menuConfig.icon}"></use></svg>`,
                    label: menuConfig.name,
                    click: () => {
                        this.handleMenuClick(protyle, selectedText, menuConfig);
                    }
                });
            });
            
            menu.addItem({type: "separator"});
        }
        
        menu.addItem({
            id: "configure",
            iconHTML: "<svg class=\"b3-menu__icon\"><use xlink:href=\"#iconSettings\"></use></svg>",
            label: this.i18n.configure,
            click: () => {
                this.openConfigurePanel();
            }
        });
        
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
            // Ignore selection range errors
        }
        
        menu.open({x: x, y: y});
    }
    
    private async handleMenuClick(protyle: Proactwrite, selectedText: string, menu: MenuConfig) {
        try {
            const data = await this.sendRequest(menu, selectedText);
            const content = this.formatResponse(data, menu);
            this.insertContent(protyle, content);
            showMessage(this.i18n.contentInserted);
        } catch (error) {
            showMessage(this.i18n.requestFailed);
        }
    }
    
    private formatResponse(data: any, menu: MenuConfig): string {
        if (menu.template) {
            try {
                let rendered = menu.template.replace(/\$\{(\w+)\}/g, (match, key) => {
                    if (key === "data") {
                        return typeof data === "object" ? JSON.stringify(data, null, 2) : String(data);
                    }
                    return data[key] !== undefined ? data[key] : match;
                });
                rendered = rendered.replace(/\\n/g, "\n");
                return rendered;
            } catch (error) {
                // Template rendering failed, fallback to default formatting
            }
        }
        
        if (typeof data === "object") {
            return JSON.stringify(data, null, 2);
        } else {
            return String(data);
        }
    }
    
    private insertContent(protyle: Proactwrite, content: string) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }
        
        const range = selection.getRangeAt(0);
        range.collapse(false);
        range.insertNode(document.createTextNode(content));
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        
        const activeElement = document.activeElement;
        if (activeElement) {
            const inputEvent = new InputEvent("input", {
                bubbles: true,
                cancelable: true,
                composed: true
            });
            activeElement.dispatchEvent(inputEvent);
        }
    }
    
    private openConfigurePanel() {
        const dialog = new Dialog({
            title: this.i18n.configure,
            content: `
                <div class="plugin-click2fill__config">
                    <div class="plugin-click2fill__config-header">
                        <h3>${this.i18n.click2fill} ${this.i18n.configure}</h3>
                        <div class="plugin-click2fill__config-buttons">
                            <button id="plugin-click2fill__import-menu" class="b3-button b3-button--outline b3-button--small" style="margin-right: 8px;">
                                导入
                            </button>
                            <button id="plugin-click2fill__export-menu" class="b3-button b3-button--outline b3-button--small" style="margin-right: 8px;">
                                导出
                            </button>
                            <button id="plugin-click2fill__add-menu" class="b3-button b3-button--outline b3-button--small">
                                新增请求
                            </button>
                        </div>
                    </div>
                    <div id="plugin-click2fill__menu-list" class="plugin-click2fill__menu-list">
                        ${this.renderMenuList()}
                    </div>
                </div>
            `,
            width: 700,
            height: 500,
            destroyCallback: () => {
            }
        });
        
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
        const importMenuButton = dialogElement.querySelector("#plugin-click2fill__import-menu") as HTMLElement;
        if (importMenuButton) {
            importMenuButton.addEventListener("click", () => {
                this.importMenus();
            });
        }
        
        const exportMenuButton = dialogElement.querySelector("#plugin-click2fill__export-menu") as HTMLElement;
        exportMenuButton.addEventListener("click", () => {
            this.exportMenus();
        });
        
        const addMenuButton = dialogElement.querySelector("#plugin-click2fill__add-menu") as HTMLElement;
        addMenuButton.addEventListener("click", () => {
            this.openMenuEditDialog(null);
        });
        
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
    
    private exportMenus() {
        const exportData = {
            version: "1.0.0",
            exportTime: new Date().toISOString(),
            menus: this.config.menus
        };
        
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `click2fill-menus-${new Date().toISOString().slice(0, 10)}.json`;
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        showMessage("菜单配置已成功导出");
    }
    
    private importMenus() {
        // Create a file input element
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        
        // Handle file selection
        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    try {
                        const content = event.target?.result as string;
                        const importData = JSON.parse(content);
                        
                        // Validate imported data
                        if (importData.menus && Array.isArray(importData.menus)) {
                            // Import menus
                            this.config.menus = importData.menus;
                            this.saveConfig();
                            
                            // Update menu list
                            const menuListElement = document.getElementById("plugin-click2fill__menu-list");
                            if (menuListElement) {
                                menuListElement.innerHTML = this.renderMenuList();
                                this.bindConfigPanelEvents(menuListElement.closest(".plugin-click2fill__config") as HTMLElement);
                            }
                            
                            showMessage("菜单配置已成功导入");
                        } else {
                            showMessage("导入失败：无效的菜单配置文件");
                        }
                    } catch (error) {
                        showMessage("导入失败：JSON解析错误");
                    }
                };
                
                reader.readAsText(file);
            }
        };
        
        // Trigger file selection dialog
        input.click();
    }
    
    private openMenuEditDialog(menu: MenuConfig | null) {
        const isEdit = menu !== null;
        const dialog = new Dialog({
            title: isEdit ? this.i18n.editMenu : this.i18n.addMenu,
            content: `
                <div class="plugin-click2fill__menu-edit">
                    <div class="plugin-click2fill__form-item" style="display: block; width: 100%; margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px;">${this.i18n.menuName}</label>
                        <input type="text" id="plugin-click2fill__menu-name" class="b3-text-field" style="display: block; width: 100%;" value="${menu?.name || ""}">
                    </div>
                    <div class="plugin-click2fill__form-item" style="display: block; width: 100%; margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px;">${this.i18n.menuUrl}</label>
                        <input type="text" id="plugin-click2fill__menu-url" class="b3-text-field" style="display: block; width: 100%;" value="${menu?.url || ""}">
                    </div>
                    <div class="plugin-click2fill__form-item">
                        <label>${this.i18n.menuMethod}</label>
                        <select id="plugin-click2fill__menu-method" class="b3-select">
                            <option value="GET" ${menu?.method === "GET" ? "selected" : ""}>GET</option>
                            <option value="POST" ${menu?.method === "GET" ? "" : "selected"}>POST</option>
                        </select>
                    </div>
                    <div class="plugin-click2fill__form-item">
                        <label>${this.i18n.menuTemplate}</label>
                        <textarea id="plugin-click2fill__menu-template" class="b3-text-field fn__block" rows="3">${menu?.template || "${data}"}</textarea>
                    </div>
                    <div class="plugin-click2fill__form-item">
                        <label>${this.i18n.displayMethod}</label>
                        <select id="plugin-click2fill__display-method" class="b3-select">
                            <option value="always" ${(!menu?.keyword && !menu?.regex) ? "selected" : ""}>${this.i18n.alwaysDisplay}</option>
                            <option value="keyword" ${(menu?.keyword && !menu?.regex) ? "selected" : ""}>${this.i18n.displayByKeyword}</option>
                            <option value="regex" ${menu?.regex ? "selected" : ""}>${this.i18n.displayByRegex}</option>
                        </select>
                        <div class="plugin-click2fill__form-hint">${this.i18n.displayMethodHint}</div>
                    </div>
                    <div class="plugin-click2fill__form-item" id="plugin-click2fill__keyword-section" style="display: ${(menu?.keyword && !menu?.regex) ? "block" : "none"};">
                        <label>${this.i18n.keyword}</label>
                        <input type="text" id="plugin-click2fill__menu-keyword" class="b3-text-field" value="${menu?.keyword || ""}" placeholder="${this.i18n.keywordPlaceholder}">
                    </div>
                    <div class="plugin-click2fill__form-item" id="plugin-click2fill__regex-section" style="display: ${menu?.regex ? "block" : "none"};">
                        <label>${this.i18n.regex}</label>
                        <input type="text" id="plugin-click2fill__menu-regex" class="b3-text-field" value="${menu?.regex || ""}" placeholder="${this.i18n.regexPlaceholder}">
                    </div>
                    <details class="plugin-click2fill__advanced-section">
                        <summary class="plugin-click2fill__advanced-toggle">高级设置</summary>
                        <div class="plugin-click2fill__advanced-content">
                            <div class="plugin-click2fill__form-item">
                                <label>${this.i18n.menuHeaders}</label>
                                <textarea id="plugin-click2fill__menu-headers" class="b3-text-field fn__block" rows="3">${menu?.headers ? JSON.stringify(menu.headers, null, 2) : "{}"}</textarea>
                            </div>
                            <div class="plugin-click2fill__form-item">
                                <label>${this.i18n.menuParams}</label>
                                <textarea id="plugin-click2fill__menu-params" class="b3-text-field fn__block" rows="3">${menu?.params ? JSON.stringify(menu.params, null, 2) : '{"text": "${selectText}"}'}</textarea>
                            </div>
                        </div>
                    </details>
                    <div class="b3-dialog__action">
                        <button class="b3-button b3-button--cancel" id="plugin-click2fill__cancel">${this.i18n.cancel}</button>
                        <div class="fn__space"></div>
                        <button class="b3-button b3-button--text" id="plugin-click2fill__save">${this.i18n.save}</button>
                    </div>
                </div>
            `,
            width: 500,
            height: 650
        });
        
        setTimeout(() => {
            const cancelBtn = dialog.element.querySelector("#plugin-click2fill__cancel");
            const saveBtn = dialog.element.querySelector("#plugin-click2fill__save");
            const displayMethodSelect = dialog.element.querySelector("#plugin-click2fill__display-method");
            const keywordSection = dialog.element.querySelector("#plugin-click2fill__keyword-section");
            const regexSection = dialog.element.querySelector("#plugin-click2fill__regex-section");
            const keywordInput = dialog.element.querySelector("#plugin-click2fill__menu-keyword");
            const regexInput = dialog.element.querySelector("#plugin-click2fill__menu-regex");
            
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
            
            // Add event listener for display method change
            if (displayMethodSelect && keywordSection && regexSection && keywordInput && regexInput) {
                displayMethodSelect.addEventListener("change", (e) => {
                    const selectedValue = (e.target as HTMLSelectElement).value;
                    
                    // Reset inputs
                    keywordInput.value = "";
                    regexInput.value = "";
                    
                    // Show/hide sections based on selected value
                    if (selectedValue === "always") {
                        keywordSection.style.display = "none";
                        regexSection.style.display = "none";
                    } else if (selectedValue === "keyword") {
                        keywordSection.style.display = "block";
                        regexSection.style.display = "none";
                    } else if (selectedValue === "regex") {
                        keywordSection.style.display = "none";
                        regexSection.style.display = "block";
                    }
                });
            }
        }, 0);
    }
    
    private saveMenu(menuId: string | null) {
        const name = document.getElementById("plugin-click2fill__menu-name") as HTMLInputElement;
        const url = document.getElementById("plugin-click2fill__menu-url") as HTMLInputElement;
        const method = document.getElementById("plugin-click2fill__menu-method") as HTMLSelectElement;
        const headers = document.getElementById("plugin-click2fill__menu-headers") as HTMLTextAreaElement;
        const params = document.getElementById("plugin-click2fill__menu-params") as HTMLTextAreaElement;
        const keyword = document.getElementById("plugin-click2fill__menu-keyword") as HTMLInputElement;
        const regex = document.getElementById("plugin-click2fill__menu-regex") as HTMLInputElement;
        const template = document.getElementById("plugin-click2fill__menu-template") as HTMLTextAreaElement;
        
        if (!name.value.trim() || !url.value.trim()) {
            showMessage("请填写必填字段");
            return;
        }
        
        let headersData: Record<string, string> = {};
        let paramsData: Record<string, string> = {};
        
        try {
            headersData = JSON.parse(headers.value) || {};
            paramsData = JSON.parse(params.value) || {};
        } catch (error) {
            showMessage("JSON格式错误");
            return;
        }
        
        let menuUrl = url.value.trim();
        if (!/^https?:\/\//i.test(menuUrl)) {
            menuUrl = `http://${menuUrl}`;
        }
        
        const menu: MenuConfig = {
            id: menuId || this.generateMenuId(),
            name: name.value.trim(),
            icon: "iconLink",
            url: menuUrl,
            method: method.value,
            headers: headersData,
            params: paramsData,
            responseType: "json",
            template: template.value.trim(),
            keyword: keyword.value.trim(),
            regex: regex.value.trim()
        };
        
        if (menuId) {
            const index = this.config.menus.findIndex(m => m.id === menuId);
            if (index !== -1) {
                this.config.menus[index] = menu;
            }
        } else {
            this.config.menus.push(menu);
        }
        
        this.saveConfig();
        
        const menuListElement = document.getElementById("plugin-click2fill__menu-list");
        if (menuListElement) {
            menuListElement.innerHTML = this.renderMenuList();
            this.bindConfigPanelEvents(menuListElement.closest(".plugin-click2fill__config") as HTMLElement);
        }
        
        showMessage(this.i18n.configSaved);
    }
    
    private deleteMenu(menu: MenuConfig) {
        confirm("⚠️", this.i18n.confirmDeleteMenu, () => {
            this.config.menus = this.config.menus.filter(m => m.id !== menu.id);
            this.saveConfig();
            
            const menuListElement = document.getElementById("plugin-click2fill__menu-list");
            if (menuListElement) {
                menuListElement.innerHTML = this.renderMenuList();
                this.bindConfigPanelEvents(menuListElement.closest(".plugin-click2fill__config") as HTMLElement);
            }
            
            showMessage(this.i18n.configSaved);
        });
    }
    
    private generateMenuId(): string {
        return "menu-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
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
}