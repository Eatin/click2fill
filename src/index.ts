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
    insertionMethod: string;
}

interface KnowledgeItem {
    id: string;
    keyword: string;
    content: string;
    menuId: string;
    createdAt: number;
}

interface PluginConfig {
    menus: MenuConfig[];
    defaultMenu: string;
    knowledge: KnowledgeItem[];
}

export default class PluginSample extends Plugin {

    private config: PluginConfig;

    async onload() {
        await this.loadConfig();
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
            callback: async (protyle: Proactwrite) => {
                const selectedText = window.getSelection().toString().trim();
                if (!selectedText) {
                    showMessage(this.i18n.selectTextFirst);
                    return;
                }
                await this.showDynamicMenu(protyle, selectedText);
            },
        });
    }
    
    private async loadConfig() {
        // loadData 是异步方法，需要使用 await
        const storedConfig = await this.loadData(STORAGE_NAME) || {};
        
        // 处理可能的数据结构不一致问题
        // 如果 storedConfig 本身是数组，说明是旧版本的数据结构
        if (Array.isArray(storedConfig)) {
            this.config = {
                menus: storedConfig.map(menu => ({
                    ...menu,
                    insertionMethod: menu.insertionMethod || "current"
                })),
                defaultMenu: "",
                knowledge: []
            };
            // 转换后保存新格式
            await this.saveConfig();
        } else {
            // 新的数据结构，有 menus, defaultMenu 和 knowledge 属性
            this.config = {
                menus: Array.isArray(storedConfig.menus) ? storedConfig.menus.map(menu => ({
                    ...menu,
                    insertionMethod: menu.insertionMethod || "current"
                })) : [],
                defaultMenu: storedConfig.defaultMenu || "",
                knowledge: Array.isArray(storedConfig.knowledge) ? storedConfig.knowledge : []
            };
        }
    }
    
    private async saveConfig() {
        // 确保 this.config 有正确的结构
        if (!this.config) {
            this.config = {
                menus: [],
                defaultMenu: "",
                knowledge: []
            };
        }
        
        if (!Array.isArray(this.config.menus)) {
            this.config.menus = [];
        }
        
        if (!Array.isArray(this.config.knowledge)) {
            this.config.knowledge = [];
        }
        
        // saveData 是异步方法，需要使用 await
        await this.saveData(STORAGE_NAME, this.config);
    }
    
    private addKnowledgeToConfig(keyword: string, content: string, menuId: string) {
        // Check if knowledge already exists for this keyword
        const existingIndex = this.config.knowledge.findIndex(item => 
            item.keyword.toLowerCase() === keyword.toLowerCase() && item.menuId === menuId
        );
        
        const knowledgeItem: KnowledgeItem = {
            id: `knowledge-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            keyword,
            content,
            menuId,
            createdAt: Date.now()
        };
        
        if (existingIndex >= 0) {
            // Update existing knowledge
            this.config.knowledge[existingIndex] = knowledgeItem;
        } else {
            // Add new knowledge
            this.config.knowledge.push(knowledgeItem);
        }
        
        // Save the updated config
        this.saveConfig().catch(error => {
            console.error("Failed to save knowledge to config:", error);
        });
        

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
                if (typeof obj === "string") {
                    return obj.replace(/\$\{selectText\}/g, selectedText);
                } else if (typeof obj === "object" && obj !== null) {
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
                "User-Agent": menu.headers["User-Agent"] || (this.app?.config?.ai?.openAI?.apiUserAgent || "Siyuan-Click2Fill-Plugin"),
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

    async onLayoutReady() {
        await this.loadConfig();
    }

    async onunload() {
        await this.saveConfig();
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
    
    private async showDynamicMenu(protyle: Proactwrite, selectedText: string) {
        if (!this.config || !Array.isArray(this.config.menus)) {
            await this.loadConfig();
        }
        
        // Get document ID when menu is created (before context is lost)
        let docId;
        
        // Method 1: From protyle object (if available)
        if (protyle) {
            // Try to get document ID from different properties
            if (protyle.block?.rootID) {
                docId = protyle.block.rootID;
            } else if (protyle.rootID) {
                docId = protyle.rootID;
            } else if (protyle.block?.id) {
                docId = protyle.block.id;
            } else if (protyle.id) {
                docId = protyle.id;
            }
        }
        
        // Method 2: From active editor element
        if (!docId) {
            const activeEditor = document.querySelector(".protyle-wysiwyg");
            if (activeEditor) {
                // Log all attributes of activeEditor
                // Check all possible attributes for document ID
                const possibleAttributes = ["data-node-id", "data-root-id", "data-block-id", "id"];
                for (const attr of possibleAttributes) {
                    const value = activeEditor.getAttribute(attr);
                    if (value) {
                        docId = value;
                        break;
                    }
                }
            }
        }
        
        // Method 3: From URL hash
        if (!docId) {
            const hash = window.location.hash;
            if (hash) {
                // Try different URL patterns
                const patterns = [
                    /^#\/([a-f0-9]{20})$/i, // Original pattern
                    /^#\/([a-z0-9-]{22})$/i, // Pattern with hyphen
                    /id=([a-f0-9]{20})/i,    // Query parameter pattern
                    /node=([a-f0-9]{20})/i   // Another query parameter pattern
                ];
                for (const pattern of patterns) {
                    const match = hash.match(pattern);
                    if (match && match[1]) {
                        docId = match[1];
                        break;
                    }
                }
            }
        }
        
        // Method 4: From active tab
        if (!docId) {
            // Try different selectors for active tab
            const tabSelectors = [
                ".tabs__item--active",
                ".tab-item.active",
                ".protyle-tabs__tab--active",
                ".b3-tab--active"
            ];
            
            for (const selector of tabSelectors) {
                const activeTab = document.querySelector(selector);
                if (activeTab) {
                    // Check all possible attributes for document ID
                    const possibleAttributes = ["data-node-id", "data-root-id", "data-block-id", "id", "data-id"];
                    for (const attr of possibleAttributes) {
                        const tabId = activeTab.getAttribute(attr);
                        if (tabId) {
                            docId = tabId;
                            break;
                        }
                    }
                    if (docId) break;
                }
            }
        }
        
        // Method 5: Debug DOM structure
        if (!docId) {
            // Log all elements with data-node-id attribute (limit to first 20)
            const elementsWithNodeId = document.querySelectorAll("[data-node-id]");
            Array.from(elementsWithNodeId).slice(0, 20).forEach((el, index) => {
                const nodeId = el.getAttribute("data-node-id");
                const className = (el as Element).className;
                const tagName = (el as Element).tagName;
            });
            if (elementsWithNodeId.length > 20) {
            }
            
            // Log all tab elements
            const tabElements = document.querySelectorAll(".tabs__item, .tab-item, .protyle-tabs__tab, .b3-tab");
            tabElements.forEach((el, index) => {
                const className = (el as Element).className;
                const isActive = (el as Element).classList.contains("active") || (el as Element).classList.contains("--active");
                const allAttrs = Array.from((el as Element).attributes).map(attr => `${attr.name}="${attr.value}"`).join(" ");
            });
            
            // Log current URL
            
            // Log document body attributes
            const bodyAttrs = Array.from(document.body.attributes).map(attr => `${attr.name}="${attr.value}"`).join(" ");
        }
        
        // Method 6: Try to get from nearest protyle element
        if (!docId) {
            const protyleElements = document.querySelectorAll('[class*="protyle"]');
            protyleElements.forEach((el, index) => {
                const className = (el as Element).className;
                const nodeId = el.getAttribute("data-node-id");
                if (nodeId) {
                    docId = nodeId;
                }
            });
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
                        this.handleMenuClick(protyle, selectedText, menuConfig, docId);
                    }
                });
            });
            
            menu.addItem({type: "separator"});
        }
        
        menu.addItem({
            id: "configure",
            iconHTML: "<svg class=\"b3-menu__icon\"><use xlink:href=\"#iconSettings\"></use></svg>",
            label: this.i18n.configure,
            click: async () => {
                await this.openConfigurePanel();
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
    
    private async handleMenuClick(protyle: Proactwrite, selectedText: string, menu: MenuConfig, docId?: string) {
        
        try {
            // Call HTTP API to get supplementary knowledge
            const data = await this.sendRequest(menu, selectedText);
            
            // Format the response content
            const content = this.formatResponse(data, menu, selectedText);
            
            // Add the knowledge to the config for future use
            this.addKnowledgeToConfig(selectedText, content, menu.id);
            
            // Use the insertion method configured in the menu
            if (menu.insertionMethod === "subdocument") {
                let finalDocId = docId;
                
                // If docId not passed or empty, try multiple methods to get it
                if (!finalDocId) {
                    
                    // Method 1: From protyle object (if available)
                    if (protyle) {
                        if (protyle.block?.rootID) {
                            finalDocId = protyle.block.rootID;
                        } else if (protyle.rootID) {
                            finalDocId = protyle.rootID;
                        } else if (protyle.block?.id) {
                            finalDocId = protyle.block.id;
                        } else if (protyle.id) {
                            finalDocId = protyle.id;
                        }
                    }
                    
                    // Method 2: From active editor element
                    if (!finalDocId) {
                        const activeEditor = document.querySelector(".protyle-wysiwyg");
                        if (activeEditor) {
                            // Check all possible attributes for document ID
                            const possibleAttributes = ["data-node-id", "data-root-id", "data-block-id", "id"];
                            for (const attr of possibleAttributes) {
                                const value = activeEditor.getAttribute(attr);
                                if (value) {
                                    finalDocId = value;
                                    break;
                                }
                            }
                        }
                    }
                }
                
                
                if (finalDocId) {
                    await this.insertToSubdocument(finalDocId, selectedText, content, protyle);
                } else {
                    console.error("No document ID found after all methods");
                    showMessage(this.i18n.requestFailed);
                }
            } else {
                if (protyle) {
                    this.insertContent(protyle, content);
                    showMessage(this.i18n.contentInserted);
                } else {
                    console.error("No protyle found for current document insertion");
                    // Try fallback method for inserting to current document
                    const activeEditor = document.querySelector(".protyle-wysiwyg");
                    if (activeEditor) {
                        const selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            range.collapse(false);
                            
                            // Create a temporary div to hold the HTML content
                            const tempDiv = document.createElement("div");
                            tempDiv.innerHTML = content;
                            
                            // Insert each child node of the temp div into the document
                            while (tempDiv.firstChild) {
                                range.insertNode(tempDiv.firstChild);
                            }
                            
                            range.collapse(false);
                            selection.removeAllRanges();
                            selection.addRange(range);
                            
                            showMessage(this.i18n.contentInserted);
                        } else {
                            showMessage(this.i18n.requestFailed);
                            console.error("No selection found for fallback insertion");
                        }
                    } else {
                        showMessage(this.i18n.requestFailed);
                        console.error("No active editor found for fallback insertion");
                    }
                }
            }
        } catch (error) {
            console.error("Error in handleMenuClick:", error);
            showMessage(this.i18n.requestFailed);
        }
        
    }
    
    private formatResponse(data: any, menu: MenuConfig, selectedText: string): string {
        const escapeHtml = (text: string): string => {
            const div = document.createElement("div");
            div.textContent = text;
            return div.innerHTML;
        };
        
        // Function to get value from nested object/array using path notation like a.b.c or a.b[0].c
        const getValueByPath = (obj: any, path: string): any => {
            if (obj === null || obj === undefined) return undefined;
            
            // Split path into segments, handling both dot notation and bracket notation
            const segments = path.split(/(?<!\\)\.|(?<!\\)\[(.*?)(?<!\\)\]/g)
                .filter(segment => segment && segment !== "[")
                .map(segment => segment.replace(/^['"]|['"]$/g, '')); // Remove quotes from array indices
            
            let current = obj;
            for (const segment of segments) {
                if (current === null || current === undefined) return undefined;
                
                // Handle array index access
                if (!isNaN(Number(segment))) {
                    const index = Number(segment);
                    if (Array.isArray(current) && index >= 0 && index < current.length) {
                        current = current[index];
                    } else {
                        return undefined;
                    }
                } else {
                    // Handle object property access
                    if (typeof current === "object" && segment in current) {
                        current = current[segment];
                    } else {
                        return undefined;
                    }
                }
            }
            return current;
        };
        
        if (menu.template) {
            try {
                // Updated regex to match more complex paths including dots and brackets
                let rendered = menu.template.replace(/\$\{([^}]+)\}/g, (match, path) => {
                    path = path.trim();
                    
                    if (path === "data") {
                        const dataStr = typeof data === "object" ? JSON.stringify(data, null, 2) : String(data);
                        return `<span class="plugin-click2fill__hover-link" title="点击查看详细内容">${escapeHtml(dataStr)}</span>`;
                    } else if (path === "selectText") {
                        return `<span class="plugin-click2fill__hover-link" title="${escapeHtml(selectedText)}">${escapeHtml(selectedText)}</span>`;
                    }
                    
                    const value = getValueByPath(data, path);
                    return value !== undefined ? 
                        `<span class="plugin-click2fill__hover-link" title="${escapeHtml(String(value))}">${escapeHtml(String(value))}</span>` : 
                        match;
                });
                rendered = rendered.replace(/\\n/g, "\n");
                return rendered;
            } catch (error) {
                // Template rendering failed, fallback to default formatting
                console.error("Template rendering error:", error);
            }
        }
        
        const content = typeof data === "object" ? JSON.stringify(data, null, 2) : String(data);
        return `<span class="plugin-click2fill__hover-link" title="点击查看详细内容">${escapeHtml(content)}</span>`;
    }
    
    private insertContent(protyle: Proactwrite, content: string) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }
        
        const range = selection.getRangeAt(0);
        range.collapse(false);
        
        // Create a temporary div to hold the HTML content
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content;
        
        // Insert each child node of the temp div into the document
        while (tempDiv.firstChild) {
            range.insertNode(tempDiv.firstChild);
        }
        
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
    
    private async insertToSubdocument(currentDocId: string, selectedText: string, content: string, protyle?: Proactwrite) {
        
        try {
            // Get document info to get notebook ID and path
            const docInfo = await this.fetchPost("/api/filetree/getDoc", {
                id: currentDocId,
                mode: 0,
                size: 1
            });
            
            if (!docInfo || !docInfo.box) {
                console.error("Invalid document info, missing box:", docInfo);
                showMessage(this.i18n.requestFailed);
                return;
            }
            
            const notebookId = docInfo.box;
            
            // Get parent document path to create subdocument in the same directory
            let parentPath = docInfo.path ? docInfo.path.substring(0, docInfo.path.lastIndexOf(".sy")) : "";
            
            // Check if current document is a "配套知识" document
            let designDocPath = parentPath;
            if (docInfo.name && docInfo.name.startsWith("配套知识：")) {
                // Get the parent directory of the current "配套知识" document
                // This should be the design document's directory
                designDocPath = parentPath;
            }
            
            // Generate a unique ID for the subdocument in SiYuan format: YYYYMMDDHHmmss-randomstring
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
            const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
            const randomStr = Math.random().toString(36).substring(2, 8);
            const subdocId = `${dateStr}${timeStr}-${randomStr}`;
            
            // Create subdocument title and path
            // All "配套知识" documents should be in the design document's directory
            const subdocTitle = `配套知识：${selectedText}`;
            const subdocPath = `${designDocPath}/${subdocId}.sy`;
            
            // Create subdocument with markdown content
            const createdSubdoc = await this.fetchPost("/api/filetree/createDoc", {
                notebook: notebookId,
                path: subdocPath,
                title: subdocTitle,
                md: `# ${subdocTitle}\n\n${content}`
            });
            
            
            // Wait a moment for the subdocument to be fully created and indexed
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Step 1: Use the subdocument ID directly as the reference
            // We know the content is in the newly created subdocument, so we can use its ID directly
            // This ensures the hover shows the subdocument content, not the parent document
            let refBlockId = subdocId;
            
            // Optional: Verify the subdocument was created successfully
            if (!createdSubdoc) {
                console.error("Failed to verify subdocument creation");
            } else {
                console.log("Subdocument created successfully:", {
                    subdocId,
                    subdocTitle,
                    subdocPath
                });
            }
            
            // Step 2: Get current selection and block info
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) {
                console.error("No selection found");
                showMessage(this.i18n.requestFailed);
                return;
            }
            
            const range = selection.getRangeAt(0);
            let commonContainer = range.commonAncestorContainer;
            
            // Ensure commonContainer is an Element, not a Text node
            if (commonContainer.nodeType === Node.TEXT_NODE) {
                commonContainer = commonContainer.parentElement;
            }
            
            if (!commonContainer || commonContainer.nodeType !== Node.ELEMENT_NODE) {
                console.error("Invalid common container");
                showMessage(this.i18n.requestFailed);
                return;
            }
            
            const blockElement = commonContainer.closest(".p") as HTMLElement;
            if (!blockElement) {
                console.error("No paragraph block found");
                showMessage(this.i18n.requestFailed);
                return;
            }
            
            const blockId = blockElement.getAttribute("data-node-id");
            if (!blockId) {
                console.error("No block ID found");
                showMessage(this.i18n.requestFailed);
                return;
            }
            
            // Step 3: Get current block content for undo operation
            const currentBlockContent = blockElement.outerHTML;
            
            // Step 4: Create new block content with the reference span
            // Format: <span data-type="block-ref" data-id="refBlockId" data-subtype="s">selectedText</span>
            const newContent = currentBlockContent.replace(
                new RegExp(selectedText, "g"),
                `<span data-type="block-ref" data-id="${refBlockId}" data-subtype="s">${selectedText}</span>`
            );
            
            // Step 5: Use transactions API to update the block
            // This is the key step that SiYuan uses internally to create references
            const sessionId = `session-${Date.now()}`;
            
            // Debug: Log transaction parameters
            console.log("Transaction parameters:", {
                sessionId,
                blockId,
                newContent,
                currentBlockContent
            });
            
            try {
                const transactionResult = await this.fetchPost("/api/transactions", {
                    session: sessionId,
                    app: "click2fill",
                    transactions: [{
                        doOperations: [{
                            id: blockId,
                            data: newContent,
                            action: "update"
                        }],
                        undoOperations: [{
                            id: blockId,
                            data: currentBlockContent,
                            action: "update"
                        }]
                    }],
                    reqId: Date.now()
                });
                
                // Debug: Log transaction result
                console.log("Transaction result:", transactionResult);
                
                // Check if transaction was successful
                // API returns an array, so check if it's not empty and no obvious errors
                let isSuccess = false;
                if (Array.isArray(transactionResult)) {
                    // For array results, check if any transaction was successful
                    isSuccess = transactionResult.length > 0;
                } else if (transactionResult?.success || transactionResult === undefined) {
                    // For object results, check success property
                    isSuccess = true;
                }
                
                if (isSuccess) {
                    showMessage(this.i18n.contentInsertedToSubdoc);
                } else {
                    console.error("Transaction failed, using fallback method. Result:", transactionResult);
                    // Fallback: use the old method with enhanced events
                    const hPathResult = await this.fetchPost("/api/filetree/getHPathByPath", {
                        notebook: notebookId,
                        path: subdocPath
                    });
                    const hPath = hPathResult?.hpath || subdocPath;
                    const refLink = `[[${hPath}|${selectedText}]]`;
                    this.replaceSelectionWithLink(refLink);
                }
            } catch (error) {
                console.error("Transaction API call failed, using fallback method. Error:", error);
                // Fallback: use the old method with enhanced events
                try {
                    const hPathResult = await this.fetchPost("/api/filetree/getHPathByPath", {
                        notebook: notebookId,
                        path: subdocPath
                    });
                    const hPath = hPathResult?.hpath || subdocPath;
                    const refLink = `[[${hPath}|${selectedText}]]`;
                    this.replaceSelectionWithLink(refLink);
                } catch (fallbackError) {
                    console.error("Fallback method also failed:", fallbackError);
                    showMessage(this.i18n.requestFailed);
                }
            }
            
        } catch (error) {
            console.error("Error in insertToSubdocument:", error);
            showMessage(this.i18n.requestFailed);
        }
        
    }
    
    private replaceSelectionWithLink(link: string) {
        const activeEditor = document.querySelector(".protyle-wysiwyg");
        if (!activeEditor) {
            console.error("No active editor found");
            return;
        }
        
        // Remove rootId check - it's not essential for the replacement operation
        // This fixes the "No root ID found for active editor" error
        
        try {
            // Use SiYuan's built-in API to replace selection with link
            // The selection is already handled by the editor, we just need to insert the link text
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                
                // Delete the selected text
                range.deleteContents();
                
                // Insert the link text
                const linkText = document.createTextNode(link);
                range.insertNode(linkText);
                
                // Move cursor to end of inserted text
                range.setStartAfter(linkText);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                
                // Trigger a more comprehensive update event to ensure the editor re-parses the content
                const event = new CustomEvent("input", {
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                    detail: { source: "click2fill-plugin" }
                });
                activeEditor.dispatchEvent(event);
                
                // Also trigger a keyup event which might help with parsing
                const keyupEvent = new KeyboardEvent("keyup", {
                    bubbles: true,
                    cancelable: true,
                    key: "Enter"
                });
                activeEditor.dispatchEvent(keyupEvent);
                
            }
        } catch (error) {
            console.error("Failed to replace selection with link:", error);
            // Fallback to simple text insertion if the above method fails
            this.fallbackReplaceSelection(link);
        }
    }
    
    private fallbackReplaceSelection(link: string) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return;
        }
        
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        
        // Find the closest block element
        let blockElement = container;
        while (blockElement && !(blockElement as HTMLElement).hasAttribute("data-node-id")) {
            blockElement = blockElement.parentNode;
            if (!blockElement) break;
        }
        
        if (blockElement && (blockElement as HTMLElement).hasAttribute("data-node-id")) {
            const blockId = (blockElement as HTMLElement).getAttribute("data-node-id");
            if (blockId) {
                // Use SiYuan API to update the block content
                this.updateBlockContent(blockId, link).catch(error => {
                    console.error("Failed to update block content:", error);
                    // Ultimate fallback: direct text insertion
                    this.directTextInsertion(range, link);
                });
                return;
            }
        }
        
        // Ultimate fallback: direct text insertion
        this.directTextInsertion(range, link);
    }
    
    private directTextInsertion(range: Range, link: string) {
        // Delete the selected text
        range.deleteContents();
        
        // Create text node with the link
        const textNode = document.createTextNode(link);
        range.insertNode(textNode);
        
        // Move cursor to end of inserted text
        range.setStartAfter(textNode);
        range.collapse(true);
        
        // Update selection
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        // Trigger multiple events to ensure the editor updates
        const activeElement = document.activeElement;
        if (activeElement) {
            // Trigger input event
            activeElement.dispatchEvent(new InputEvent("input", {
                bubbles: true,
                cancelable: true,
                composed: true
            }));
            
            // Trigger change event
            activeElement.dispatchEvent(new Event("change", {
                bubbles: true,
                cancelable: true
            }));
            
            // Trigger blur and focus to force re-parsing
            activeElement.blur();
            setTimeout(() => activeElement.focus(), 0);
        }
    }
    
    private async updateBlockContent(blockId: string, content: string) {
        try {
            // Use SiYuan's API to update the block content
            const response = await this.fetchPost("/api/block/updateBlock", {
                id: blockId,
                dataType: "markdown",
                data: content
            });
            return response;
        } catch (error) {
            console.error("Failed to update block content:", error);
            throw error;
        }
    }
    
    private async appendContentToDocument(docId: string, content: string) {
        
        try {
            await this.fetchPost("/api/block/appendBlock", {
                id: docId,
                dataType: "markdown",
                data: content
            });
        } catch (error) {
            console.error("Error in appendContentToDocument:", error);
            throw new Error("Failed to append content to document");
        }
        
    }
    
    private async fetchPost(url: string, data: any): Promise<any> {
        
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
            
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Check if response has a data property (Siyuan API format)
            if (result && result.code === 0 && result.data !== undefined) {
                return result.data;
            }
            
            return result;
        } catch (error) {
            console.error("Error in fetchPost:", error);
            throw error;
        }
    }
    
    private async openConfigurePanel() {
        // 确保配置已加载
        if (!this.config || !Array.isArray(this.config.menus)) {
            await this.loadConfig();
        }
        
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
                        <textarea id="plugin-click2fill__menu-template" class="b3-text-field fn__block" rows="3" placeholder="支持 ${'selectText'} 和 ${'data'} 变量，例如：${'selectText'} ${'data'} 或 ${'data'} ${'selectText'} 或仅 ${'data'}">${menu?.template || "${data}"}</textarea>
                        <div class="plugin-click2fill__form-hint">支持 ${'selectText'} 和 ${'data'} 变量，可自定义拼接方式</div>
                    </div>
                    <details class="plugin-click2fill__advanced-section">
                        <summary class="plugin-click2fill__advanced-toggle">高级设置</summary>
                        <div class="plugin-click2fill__advanced-content">
                            <div class="plugin-click2fill__form-item">
                                <label style="display: block; margin-bottom: 8px;">${this.i18n.displayMethod}</label>
                                <select id="plugin-click2fill__display-method" class="b3-select" style="display: block; width: 100%;">
                                    <option value="always" ${(!menu?.keyword && !menu?.regex) ? "selected" : ""}>${this.i18n.alwaysDisplay}</option>
                                    <option value="keyword" ${(menu?.keyword && !menu?.regex) ? "selected" : ""}>${this.i18n.displayByKeyword}</option>
                                    <option value="regex" ${menu?.regex ? "selected" : ""}>${this.i18n.displayByRegex}</option>
                                </select>
                                <div class="plugin-click2fill__form-hint">${this.i18n.displayMethodHint}</div>
                            </div>
                            <div class="plugin-click2fill__form-item" id="plugin-click2fill__keyword-section" style="display: ${(menu?.keyword && !menu?.regex) ? "block" : "none"};">
                                <label style="display: block; margin-bottom: 8px;">${this.i18n.keyword}</label>
                                <input type="text" id="plugin-click2fill__menu-keyword" class="b3-text-field" style="display: block; width: 100%;" value="${menu?.keyword || ""}" placeholder="${this.i18n.keywordPlaceholder}">
                            </div>
                            <div class="plugin-click2fill__form-item" id="plugin-click2fill__regex-section" style="display: ${menu?.regex ? "block" : "none"};">
                                <label style="display: block; margin-bottom: 8px;">${this.i18n.regex}</label>
                                <input type="text" id="plugin-click2fill__menu-regex" class="b3-text-field" style="display: block; width: 100%;" value="${menu?.regex || ""}" placeholder="${this.i18n.regexPlaceholder}">
                            </div>
                            <div class="plugin-click2fill__form-item">
                                <label style="display: block; margin-bottom: 8px;">${this.i18n.insertionMethod}</label>
                                <select id="plugin-click2fill__insertion-method" class="b3-select" style="display: block; width: 100%;">
                                    <option value="current" ${menu?.insertionMethod === "current" ? "selected" : ""}>${this.i18n.insertToCurrentDocument}</option>
                                    <option value="subdocument" ${menu?.insertionMethod === "subdocument" ? "selected" : ""}>${this.i18n.insertToSubdocument}</option>
                                </select>
                            </div>
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
        const insertionMethod = document.getElementById("plugin-click2fill__insertion-method") as HTMLSelectElement;
        
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
            regex: regex.value.trim(),
            insertionMethod: insertionMethod.value
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