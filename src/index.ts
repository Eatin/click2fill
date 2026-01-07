import { Plugin, showMessage, Dialog } from "siyuan";

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
    history: RequestHistory[];
    aiChatHistory: AIChatHistory[];
}

interface AIChatMessage {
    role: "user" | "assistant" | "request" | "response";
    content: string;
    timestamp: number;
}

interface AIChatHistory {
    id: string;
    title: string;
    messages: AIChatMessage[];
    createdAt: number;
    updatedAt: number;
}

interface RequestHistory {
    id: string;
    timestamp: number;
    selectedText: string;
    menu: MenuConfig;
    requestData: any;
    responseData: any;
    error: string | null;
}

interface DialogState {
    selectedText: string;
    selectedMenu: MenuConfig | null;
    requestData: any;
    responseData: any;
    step: "send" | "result" | "history" | "aiChat";
    loading: boolean;
    loadingTime: number;
    error: string | null;
    history: RequestHistory[];
    currentHistoryId: string | null;
    // AI 聊天相关状态
    aiChatMessages: AIChatMessage[];
    aiChatInput: string;
    aiChatLoading: boolean;
    aiChatError: string | null;
    aiChatHistory: AIChatHistory[];
    currentAIChatId: string | null;
}

export default class PluginSample extends Plugin {

    private config: PluginConfig;
    private dialogState: DialogState = {
        selectedText: "",
        selectedMenu: null,
        requestData: {},
        responseData: null,
        step: "send",
        loading: false,
        loadingTime: 0,
        error: null,
        history: [],
        currentHistoryId: null,
        // AI 聊天相关默认值
        aiChatMessages: [],
        aiChatInput: "",
        aiChatLoading: false,
        aiChatError: null,
        aiChatHistory: [],
        currentAIChatId: null
    };

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
            callback: async () => {
                // 立即获取选中文本，确保在DOM变化前获取
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) {
                    showMessage(this.i18n.selectTextFirst || "请先选中文本");
                    return;
                }
                const selectedText = selection.toString().trim();
                if (!selectedText) {
                    showMessage(this.i18n.selectTextFirst || "请先选中文本");
                    return;
                }
                // 保存选中的文本到对话框状态
                this.dialogState.selectedText = selectedText;
                // 只显示浮动菜单，让用户选择接口
                // 右侧对话框会在用户选择接口后显示
                this.showFloatingMenu(selectedText, selection);
            },
        });

        // 添加右侧对话框
        this.addDock({
            type: "click2fillDialog",
            config: {
                position: "RightBottom",
                size: {
                    width: 400,
                    height: null
                },
                icon: "iconClick2Fill",
                title: "Click2Fill",
                // 确保对话框默认不激活
                actived: false
                // 移除快捷键，避免与 addCommand 冲突
            },
            data: {},
            init: (dock) => {
                this.initSidebarDialog(dock.element);
                // 确保对话框初始化后保持关闭状态
                dock.actived = false;
            }
        });
    }
    
    private async loadConfig() {
        const storedConfig = await this.loadData(STORAGE_NAME) || {};
        
        if (Array.isArray(storedConfig)) {
            this.config = {
                menus: storedConfig.map(menu => ({
                    ...menu,
                    insertionMethod: menu.insertionMethod || "current"
                })),
                defaultMenu: "",
                knowledge: [],
                history: [],
                aiChatHistory: []
            };
            await this.saveConfig();
        } else {
            const menus = Array.isArray(storedConfig.menus) ? storedConfig.menus.map(menu => ({
                ...menu,
                insertionMethod: menu.insertionMethod || "current"
            })) : [];
            
            // 如果没有菜单，添加默认的demo接口（随机笑话API）
            if (menus.length === 0) {
                menus.push({
                    id: "demo-joke-api",
                    name: "随机笑话",
                    icon: "iconFace",
                    url: "https://api.timelessq.com/joke",
                    method: "GET",
                    headers: {
                        "accept": "*/*",
                        "accept-language": "zh-CN",
                        "content-type": "application/json",
                        "user-agent": "SiYuan/3.1.26 https://b3log.org/siyuan"
                    },
                    params: {
                        "text": "\${selectText}",
                        "type": "其他"
                    },
                    responseType: "json",
                    template: "# 随机笑话\n\n## 内容\n\${data.content}\n\n## 类型\n\${data.type || '其他'}\n\n## 搞笑等级\n\${data.level || 0}/10",
                    keyword: "笑话,幽默",
                    regex: "",
                    insertionMethod: "current"
                });
            }
            
            this.config = {
                menus: menus,
                defaultMenu: storedConfig.defaultMenu || "",
                knowledge: Array.isArray(storedConfig.knowledge) ? storedConfig.knowledge : [],
                history: Array.isArray(storedConfig.history) ? storedConfig.history : [],
                aiChatHistory: Array.isArray(storedConfig.aiChatHistory) ? storedConfig.aiChatHistory : []
            };
            
            // 加载历史记录到对话框状态
            if (Array.isArray(this.config.history)) {
                this.dialogState.history = this.config.history;
                // 确保历史记录数量不超过100条
                if (this.dialogState.history.length > 100) {
                    this.dialogState.history = this.dialogState.history.slice(0, 100);
                    this.config.history = this.dialogState.history;
                    await this.saveConfig();
                }
            }
            
            // 加载 AI 聊天历史到对话框状态
            if (Array.isArray(this.config.aiChatHistory)) {
                this.dialogState.aiChatHistory = this.config.aiChatHistory;
                // 确保 AI 聊天历史数量不超过50条
                if (this.dialogState.aiChatHistory.length > 50) {
                    this.dialogState.aiChatHistory = this.dialogState.aiChatHistory.slice(0, 50);
                    this.config.aiChatHistory = this.dialogState.aiChatHistory;
                    await this.saveConfig();
                }
            }
            
            // 如果添加了默认菜单，保存配置
            if (menus.length > 0 && !Array.isArray(storedConfig.menus)) {
                await this.saveConfig();
            }
        }
    }
    
    private async saveConfig() {
        if (!this.config) {
            this.config = {
                menus: [],
                defaultMenu: "",
                knowledge: [],
                history: [],
                aiChatHistory: []
            };
        }
        
        if (!Array.isArray(this.config.menus)) {
            this.config.menus = [];
        }
        
        if (!Array.isArray(this.config.knowledge)) {
            this.config.knowledge = [];
        }
        
        if (!Array.isArray(this.config.history)) {
            this.config.history = [];
        }
        
        if (!Array.isArray(this.config.aiChatHistory)) {
            this.config.aiChatHistory = [];
        }
        
        await this.saveData(STORAGE_NAME, this.config);
    }
    
    private addKnowledgeToConfig(keyword: string, content: string, menuId: string) {
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
            this.config.knowledge[existingIndex] = knowledgeItem;
        } else {
            this.config.knowledge.push(knowledgeItem);
        }
        
        this.saveConfig().catch(error => {
            console.error("Failed to save knowledge to config:", error);
        });
    }
    
    private async sendRequest(menu: MenuConfig, selectedText: string): Promise<any> {
        const requestData: any = {
            text: selectedText
        };
        
        if (menu.params) {
            const paramsCopy = JSON.parse(JSON.stringify(menu.params));
            
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
        
        const globalSiyuan = (globalThis as any).siyuan;
        const config = this.app?.config || globalSiyuan?.config;
        const aiConfig = config?.ai || config?.openAI;
        const apiUserAgent = aiConfig?.openAI?.apiUserAgent || aiConfig?.apiUserAgent;
        
        const options: any = {
            method: menu.method || "GET",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": menu.headers["User-Agent"] || (apiUserAgent || "Siyuan-Click2Fill-Plugin"),
                "X-Original-User-Agent": apiUserAgent,
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
    
    private async sendAIChatRequest(messages: AIChatMessage[]): Promise<string> {
        const globalSiyuan = (globalThis as any).siyuan;
        const config = this.app?.config || globalSiyuan?.config;
        const aiConfig = config?.ai || config?.openAI;
        
        if (!aiConfig?.openAI?.apiKey || !aiConfig?.openAI?.apiBaseURL) {
            throw new Error("请先在思源笔记设置中配置 OpenAI API 密钥和基础 URL");
        }
        
        const apiKey = aiConfig.openAI.apiKey;
        const apiBaseURL = aiConfig.openAI.apiBaseURL;
        const model = aiConfig.openAI.apiModel || "gpt-3.5-turbo";
        
        const url = `${apiBaseURL.endsWith("/") ? apiBaseURL : apiBaseURL + "/"}chat/completions`;
        
        const requestMessages = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        
        const options: any = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: requestMessages,
                stream: true
            })
        };
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`AI 聊天请求失败: ${errorData.error?.message || `HTTP error! status: ${response.status}`}`);
        }
        
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("无法读取响应流");
        }
        
        let fullResponse = "";
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            
            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const data = line.substring(6);
                    if (data === "[DONE]") continue;
                    
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content;
                        if (content) {
                            fullResponse += content;
                        }
                    } catch (e) {
                        // 忽略解析错误
                    }
                }
            }
        }
        
        return fullResponse;
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
    
    private async showSidebarDialog(): Promise<void> {
        // 确保 sidebar dialog 可见
        // 直接更新对话框内容，SiYuan 会自动管理 dock 的显示
        this.updateSidebarDialog();
        
        // 尝试多种方法显示右侧面板和 Click2Fill 对话框
        
        // 方法 1：尝试通过 DOM 操作显示右侧面板
        const rightPanel = document.querySelector(".layout__right");
        if (rightPanel) {
            rightPanel.style.display = "flex";
        }
        
        // 方法 2：尝试直接点击右侧面板的切换按钮
        const rightPanelToggle = document.querySelector(".layout__toggle--right");
        if (rightPanelToggle) {
            rightPanelToggle.click();
        }
        
        // 方法 3：尝试找到并点击 Click2Fill 的 dock 项
        const dockItems = document.querySelectorAll(".dock__item");
        let click2fillDockItem = null;
        dockItems.forEach(item => {
            const type = item.getAttribute("data-type");
            // 匹配 click2fillDialog 或 click2fillclick2fillDialog（处理重复的情况）
            if (type === "click2fillDialog" || type === "click2fillclick2fillDialog") {
                click2fillDockItem = item;
            }
        });
        
        if (click2fillDockItem) {
            // 检查 dock 项是否已经激活，只有未激活时才点击
            const isActive = click2fillDockItem.classList.contains("dock__item--active");
            if (!isActive) {
                click2fillDockItem.click();
            }
        } else {
            // 尝试查找包含 Click2Fill 图标的元素
            const iconItems = document.querySelectorAll("svg use[*|href='#iconClick2Fill']");
            iconItems.forEach(icon => {
                const parentButton = icon.closest("button");
                if (parentButton) {
                    parentButton.click();
                }
            });
        }
        
        // 方法 4：尝试通过 HTTP API 设置完整的布局
        try {
            // 先获取当前布局
            const getLayoutResponse = await fetch("/api/system/getUILayout");
            if (getLayoutResponse.ok) {
                const currentLayout = await getLayoutResponse.json();
                
                // 修改布局，确保右侧面板显示
                currentLayout.layout.layout.children.forEach((row: any) => {
                    if (row.children) {
                        row.children.forEach((col: any) => {
                            if (col.type === "right") {
                                // 确保右侧面板大小大于 0
                                if (col.size === "0px") {
                                    col.size = "400px";
                                }
                            }
                        });
                    }
                });
                
                // 发送更新后的布局
                const setLayoutResponse = await fetch("/api/system/setUILayout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(currentLayout)
                });
            }
        } catch (error) {
            // 忽略 HTTP API 调用错误，继续执行
        }
    }
    
    private initSidebarDialog(element: HTMLElement) {
        element.innerHTML = `
            <div class="click2fill-dialog" style="padding: 16px; height: 100%; display: flex; flex-direction: column;">
                <!-- 主操作按钮 -->
                <div class="main-actions" style="display: flex; align-items: center; margin-bottom: 20px; gap: 8px;">
                    <button class="action-btn" data-action="new" style="flex: 1; padding: 8px 12px; border: 1px solid var(--b3-theme-border); border-radius: 4px; background-color: var(--b3-theme-primary); color: white; cursor: pointer; transition: all 0.2s ease;">
                        <svg class="b3-button__icon" style="width: 16px; height: 16px; margin-right: 4px;"><use xlink:href="#iconAdd"></use></svg>
                        新请求
                    </button>
                    <button class="action-btn" data-action="config" style="flex: 1; padding: 8px 12px; border: 1px solid var(--b3-theme-border); border-radius: 4px; background-color: var(--b3-theme-background); color: var(--b3-theme-on-surface); cursor: pointer; transition: all 0.2s ease;">
                        <svg class="b3-button__icon" style="width: 16px; height: 16px; margin-right: 4px;"><use xlink:href="#iconSettings"></use></svg>
                        配置接口
                    </button>
                    <button class="action-btn" data-action="history" style="flex: 1; padding: 8px 12px; border: 1px solid var(--b3-theme-border); border-radius: 4px; background-color: var(--b3-theme-background); color: var(--b3-theme-on-surface); cursor: pointer; transition: all 0.2s ease;">
                        <svg class="b3-button__icon" style="width: 16px; height: 16px; margin-right: 4px;"><use xlink:href="#iconHistory"></use></svg>
                        历史记录
                    </button>
                </div>
                
                <!-- 步骤导航 (仅在新请求模式下显示) -->
                <div class="step-nav" style="display: flex; align-items: center; margin-bottom: 20px; gap: 8px;">
                    <button class="step-btn" data-step="aiChat" style="flex: 1; padding: 8px 12px; border: 1px solid var(--b3-theme-border); border-radius: 4px; background-color: var(--b3-theme-primary); color: white; cursor: pointer; transition: all 0.2s ease;">
                        🤖 AI 聊天
                    </button>
                </div>
                
                <!-- 内容区域 -->
                <div id="dialog-content" style="flex: 1; overflow-y: auto;"></div>
            </div>
        `;
        
        // 添加主操作按钮事件监听
        const actionBtns = element.querySelectorAll(".action-btn");
        actionBtns.forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const action = (e.target as HTMLElement).closest(".action-btn")?.getAttribute("data-action");
                if (action === "new") {
                    this.dialogState.step = "send";
                    this.updateSidebarDialog();
                } else if (action === "config") {
                    await this.openConfigurePanel();
                } else if (action === "history") {
                    this.dialogState.step = "history";
                    this.updateSidebarDialog();
                }
            });
        });
        
        // 添加步骤导航事件监听
        const stepBtns = element.querySelectorAll(".step-btn");
        stepBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                const step = (e.target as HTMLElement).closest(".step-btn")?.getAttribute("data-step") as "send" | "result" | "aiChat";
                if (step) {
                    this.dialogState.step = step;
                    this.updateSidebarDialog();
                }
            });
        });
        
        this.updateSidebarDialog();
    }
    
    private canNavigateToStep(step: "send" | "result"): boolean {
        const stepOrder = { send: 0, result: 1 };
        const currentStepOrder = stepOrder[this.dialogState.step as "send" | "result"] || 0;
        const targetStepOrder = stepOrder[step];
        // 只允许导航到当前步骤或之前的步骤
        return targetStepOrder <= currentStepOrder;
    }
    
    private updateSidebarDialog() {
        const contentElement = document.querySelector("#dialog-content");
        if (!contentElement) return;
        
        // 更新步骤导航状态
        this.updateStepNavigation();
        
        // 清空内容并根据当前步骤渲染
        contentElement.innerHTML = "";
        
        // 渲染当前步骤内容
        switch (this.dialogState.step) {
            case "history":
                this.renderHistoryStep(contentElement);
                break;
            case "aiChat":
            case "send":
            case "result":
                // 所有请求相关步骤都显示AI聊天界面
                this.dialogState.step = "aiChat";
                this.renderAIChatStep(contentElement);
                break;
        }
    }
    
    private updateStepNavigation() {
        const stepNav = document.querySelector(".step-nav");
        const stepBtns = document.querySelectorAll(".step-btn");
        
        if (this.dialogState.step === "history") {
            // 在历史记录模式下隐藏步骤导航
            stepNav?.setAttribute("style", "display: none;");
            return;
        }
        
        // 显示步骤导航
        stepNav?.setAttribute("style", "display: flex; align-items: center; margin-bottom: 20px; gap: 8px;");
        
        // 为所有步骤按钮启用点击
        stepBtns.forEach(btn => {
            btn.removeAttribute("disabled");
            btn.style.cursor = "pointer";
        });
        
        // 更新按钮样式
        stepBtns.forEach(btn => {
            const step = btn.getAttribute("data-step") as "aiChat";
            // 始终高亮AI聊天步骤
            btn.style.backgroundColor = "var(--b3-theme-primary)";
            btn.style.color = "white";
        });
    }
    
    private renderHistoryStep(element: Element) {
        let html = `
            <div style="margin-bottom: 16px;">
                <h3 style="margin-top: 0;">历史记录</h3>
                <p style="margin-bottom: 16px; color: var(--b3-theme-on-surface-light);">查看之前的API调用记录</p>
        `;
        
        if (this.dialogState.history.length === 0) {
            html += `
                <div class="b3-label--info" style="padding: 20px; text-align: center;">
                    暂无历史记录
                </div>
            `;
        } else {
            html += `
                <div style="display: flex; flex-direction: column; gap: 12px;">
            `;
            
            this.dialogState.history.forEach((item, index) => {
                const timestamp = new Date(item.timestamp).toLocaleString();
                const isError = !!item.error;
                
                html += `
                    <div class="history-item" data-history-id="${item.id}" style="border: 1px solid var(--b3-theme-border); border-radius: 4px; padding: 12px; cursor: pointer; transition: all 0.2s ease;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div>
                                <h4 style="margin: 0; display: flex; align-items: center;">
                                    <svg class="b3-button__icon" style="width: 16px; height: 16px; margin-right: 8px;"><use xlink:href="#${item.menu.icon}"></use></svg>
                                    ${item.menu.name}
                                </h4>
                                <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--b3-theme-on-surface-light);">${timestamp}</p>
                            </div>
                            <div class="b3-label ${isError ? "b3-label--error" : "b3-label--success"}">
                                ${isError ? "失败" : "成功"}
                            </div>
                        </div>
                        <div style="font-size: 12px; color: var(--b3-theme-on-surface-light); margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            选中文本: ${item.selectedText.length > 50 ? item.selectedText.substring(0, 50) + "..." : item.selectedText}
                        </div>
                        ${isError ? `
                            <div class="b3-label--error" style="font-size: 12px; padding: 4px 8px; margin-top: 4px;">
                                错误: ${item.error}
                            </div>
                        ` : ""}
                    </div>
                `;
            });
            
            html += `
                </div>
            `;
        }
        
        html += `
            </div>
        `;
        
        element.innerHTML = html;
        
        // 添加历史记录项点击事件
        const historyItems = element.querySelectorAll(".history-item");
        historyItems.forEach(item => {
            item.addEventListener("click", (e) => {
                const historyId = (e.currentTarget as HTMLElement).getAttribute("data-history-id");
                if (historyId) {
                    this.viewHistoryDetail(historyId);
                }
            });
        });
    }
    
    private viewHistoryDetail(historyId: string) {
        const historyItem = this.dialogState.history.find(item => item.id === historyId);
        if (!historyItem) return;
        
        // 显示历史记录详情
        const contentElement = document.querySelector("#dialog-content");
        if (!contentElement) return;
        
        const isError = !!historyItem.error;
        const formattedRequest = JSON.stringify(historyItem.requestData, null, 2);
        const formattedResponse = historyItem.responseData ? JSON.stringify(historyItem.responseData, null, 2) : "";
        
        const html = `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <button class="b3-button" id="back-to-history" style="margin-right: 12px;">
                        <svg class="b3-button__icon"><use xlink:href="#iconBack"></use></svg>
                        <span>返回历史</span>
                    </button>
                    <h3 style="margin: 0;">历史记录详情</h3>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <h4 style="margin-bottom: 8px;">基本信息</h4>
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <svg class="b3-button__icon" style="width: 16px; height: 16px; margin-right: 8px;"><use xlink:href="#${historyItem.menu.icon}"></use></svg>
                        <span><strong>接口:</strong> ${historyItem.menu.name}</span>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>时间:</strong> ${new Date(historyItem.timestamp).toLocaleString()}
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>选中文本:</strong>
                        <div class="b3-label--info" style="margin-top: 4px; padding: 8px;">
                            ${historyItem.selectedText}
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <h4 style="margin-bottom: 8px;">请求数据</h4>
                    <pre style="background-color: var(--b3-theme-surface-light); padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px; user-select: text;">${formattedRequest}</pre>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <h4 style="margin-bottom: 8px;">响应数据</h4>
                    ${isError ? `
                        <div class="b3-label--error" style="padding: 12px; border-radius: 4px;">
                            ${historyItem.error}
                        </div>
                    ` : `
                        <pre style="background-color: var(--b3-theme-surface-light); padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px; user-select: text;">${formattedResponse}</pre>
                    `}
                </div>
                
                <div style="display: flex; gap: 8px;">
                    <button class="b3-button" id="reuse-request">
                        <svg class="b3-button__icon"><use xlink:href="#iconRefresh"></use></svg>
                        <span>重用请求</span>
                    </button>
                    ${!isError ? `
                        <button class="b3-button b3-button--primary" id="copy-history-result">
                            <svg class="b3-button__icon"><use xlink:href="#iconCopy"></use></svg>
                            <span>复制结果</span>
                        </button>
                    ` : ""}
                </div>
            </div>
        `;
        
        contentElement.innerHTML = html;
        
        // 添加返回按钮事件
        const backBtn = contentElement.querySelector("#back-to-history");
        if (backBtn) {
            backBtn.addEventListener("click", () => {
                this.dialogState.step = "history";
                this.updateSidebarDialog();
            });
        }
        
        // 添加重用请求按钮事件
        const reuseBtn = contentElement.querySelector("#reuse-request");
        if (reuseBtn) {
            reuseBtn.addEventListener("click", () => {
                // 重用历史请求
                this.dialogState.selectedText = historyItem.selectedText;
                this.dialogState.selectedMenu = historyItem.menu;
                this.dialogState.requestData = historyItem.requestData;
                this.dialogState.step = "send";
                this.updateSidebarDialog();
            });
        }
        
        // 添加复制结果按钮事件
        const copyBtn = contentElement.querySelector("#copy-history-result");
        if (copyBtn && !isError) {
            copyBtn.addEventListener("click", () => {
                const formattedHistoryResponse = this.formatResponse(
                    historyItem.responseData,
                    historyItem.menu,
                    historyItem.selectedText
                );
                navigator.clipboard.writeText(formattedHistoryResponse).then(() => {
                    showMessage("结果已复制到剪贴板");
                }).catch(err => {
                    showMessage("复制失败，请手动选择复制");
                    console.error("复制失败:", err);
                });
            });
        }
    }
    
    private renderPrepareStep(element: Element) {
        const matchedMenus = this.config.menus.filter(menuConfig => {
            return this.isMenuMatch(menuConfig, this.dialogState.selectedText);
        });
        
        let html = `
            <div style="margin-bottom: 16px;">
                <h3 style="margin-top: 0;">选择接口</h3>
                <p style="margin-bottom: 12px;">已选文本: <strong>${this.dialogState.selectedText}</strong></p>
                <div style="display: flex; flex-direction: column; gap: 8px;">
        `;
        
        if (matchedMenus.length > 0) {
            matchedMenus.forEach(menu => {
                html += `
                    <button class="b3-button" style="text-align: left;" data-menu-id="${menu.id}">
                        <svg class="b3-button__icon"><use xlink:href="#${menu.icon}"></use></svg>
                        <span>${menu.name}</span>
                    </button>
                `;
            });
        } else {
            html += `
                <div class="b3-label--info">
                    没有匹配的接口，请先配置接口
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
            <button class="b3-button b3-button--primary" id="configure-btn">
                <svg class="b3-button__icon"><use xlink:href="#iconSettings"></use></svg>
                <span>配置接口</span>
            </button>
        `;
        
        element.innerHTML = html;
        
        matchedMenus.forEach(menu => {
            const button = element.querySelector(`button[data-menu-id="${menu.id}"]`);
            if (button) {
                button.addEventListener("click", async () => {
                    this.dialogState.selectedMenu = menu;
                    this.prepareRequestData();
                    // 添加装配报文到AI聊天
                    this.addAssemblyMessageToChat();
                    this.dialogState.step = "aiChat";
                    this.updateSidebarDialog();
                    // 延迟一下确保对话框已显示，然后自动发送请求
                    setTimeout(async () => {
                        await this.sendRequestAndShowResult();
                    }, 100);
                });
            }
        });
        
        const configureBtn = element.querySelector("#configure-btn");
        if (configureBtn) {
            configureBtn.addEventListener("click", async () => {
                await this.openConfigurePanel();
            });
        }
    }
    
    private prepareRequestData() {
        if (!this.dialogState.selectedMenu) return;
        
        const menu = this.dialogState.selectedMenu;
        const selectedText = this.dialogState.selectedText;
        
        const requestData: any = {
            text: selectedText
        };
        
        if (menu.params) {
            const paramsCopy = JSON.parse(JSON.stringify(menu.params));
            
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
        
        this.dialogState.requestData = requestData;
    }
    
    private renderSendStep(element: Element) {
        if (!this.dialogState.selectedMenu) return;
        
        const menu = this.dialogState.selectedMenu;
        
        const html = `
            <div style="margin-bottom: 16px;">
                <h3 style="margin-top: 0;">装配报文</h3>
                <div class="b3-label" style="margin-bottom: 12px;">
                    <svg class="b3-label__icon"><use xlink:href="#${menu.icon}"></use></svg>
                    <span>${menu.name}</span>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <h4 style="margin-bottom: 8px;">请求信息</h4>
                    <div class="b3-label--info" style="margin-bottom: 8px;">
                        <strong>URL:</strong> ${menu.url}
                    </div>
                    <div class="b3-label--info" style="margin-bottom: 8px;">
                        <strong>Method:</strong> ${menu.method}
                    </div>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <h4 style="margin-bottom: 8px;">请求数据</h4>
                    <pre style="background-color: var(--b3-theme-surface-light); padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px; user-select: text;">${JSON.stringify(this.dialogState.requestData, null, 2)}</pre>
                </div>
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button class="b3-button" id="back-btn">
                    <svg class="b3-button__icon"><use xlink:href="#iconBack"></use></svg>
                    <span>返回</span>
                </button>
                <button class="b3-button b3-button--primary" id="send-btn" ${this.dialogState.loading ? "disabled" : ""}>
                    ${this.dialogState.loading ? (
                        `<div style="display: flex; align-items: center; gap: 8px;"><div class="b3-loading"></div><span>请求中 ${this.dialogState.loadingTime}s</span></div>`
                    ) : (
                        '<svg class="b3-button__icon"><use xlink:href="#iconSend"></use></svg><span>发送请求</span>'
                    )}
                </button>
            </div>
        `;
        
        element.innerHTML = html;
        
        const backBtn = element.querySelector("#back-btn");
        if (backBtn) {
            backBtn.addEventListener("click", () => {
                this.dialogState.step = "prepare";
                this.updateSidebarDialog();
            });
        }
        
        const sendBtn = element.querySelector("#send-btn");
        if (sendBtn) {
            sendBtn.addEventListener("click", async () => {
                await this.sendRequestAndShowResult();
            });
        }
    }
    
    private async sendRequestAndShowResult() {
        if (!this.dialogState.selectedMenu) return;
        
        this.dialogState.loading = true;
        this.dialogState.loadingTime = 0;
        this.dialogState.error = null;
        this.updateSidebarDialog();
        
        const startTime = Date.now();
        const loadingInterval: NodeJS.Timeout = setInterval(() => {
            this.dialogState.loadingTime = Math.floor((Date.now() - startTime) / 1000);
            this.updateSidebarDialog();
        }, 1000);
        
        try {
            const data = await this.sendRequest(this.dialogState.selectedMenu, this.dialogState.selectedText);
            this.dialogState.responseData = data;
            
            // 添加响应消息到AI聊天
            this.addResponseMessageToChat(data);
            
            this.addKnowledgeToConfig(
                this.dialogState.selectedText,
                this.formatResponse(data, this.dialogState.selectedMenu, this.dialogState.selectedText),
                this.dialogState.selectedMenu.id
            );
            
            // 添加到历史记录
            this.addToHistory(this.dialogState.selectedText, this.dialogState.selectedMenu, this.dialogState.requestData, data, null);
        } catch (error) {
            this.dialogState.error = error instanceof Error ? error.message : "请求失败";
            
            // 添加错误响应消息到AI聊天
            this.addResponseMessageToChat(null, this.dialogState.error);
            
            // 添加错误到历史记录
            this.addToHistory(this.dialogState.selectedText, this.dialogState.selectedMenu!, this.dialogState.requestData, null, this.dialogState.error);
        } finally {
            clearInterval(loadingInterval);
            this.dialogState.loading = false;
            this.updateSidebarDialog();
        }
    }
    
    private addAssemblyMessageToChat() {
        if (!this.dialogState.selectedMenu || !this.dialogState.requestData) {
            console.error("缺少必要数据: selectedMenu=", this.dialogState.selectedMenu, "requestData=", this.dialogState.requestData);
            return;
        }
        
        const menu = this.dialogState.selectedMenu;
        const formattedRequest = JSON.stringify(this.dialogState.requestData, null, 2);
        
        // 创建装配报文消息，使用HTML换行符保持样式一致
        const assemblyMessage: AIChatMessage = {
            role: "request",
            content: `**${menu.name} 装配报文**<br><br>` +
                    `**请求信息**<br>` +
                    `URL: ${menu.url}<br>` +
                    `Method: ${menu.method}<br><br>` +
                    `**请求数据**<br>` +
                    `<pre style="background-color: var(--b3-theme-surface-light); padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px; font-family: var(--b3-font-family-code);">${formattedRequest}</pre>`,
            timestamp: Date.now()
        };
        
        this.dialogState.aiChatMessages.push(assemblyMessage);
        console.log("添加装配报文消息:", assemblyMessage);
    }
    
    private addResponseMessageToChat(data: any, error: string | null = null) {
        if (!this.dialogState.selectedMenu) return;
        
        const menu = this.dialogState.selectedMenu;
        
        // 创建响应消息
        let responseContent = "";
        if (data) {
            // 尝试使用formatResponse方法格式化响应数据
            try {
                responseContent = this.formatResponse(data, menu, this.dialogState.selectedText);
                // 将Markdown转换为HTML
                responseContent = this.markdownToHtml(responseContent);
            } catch (e) {
                // 如果格式化失败，使用JSON格式
                const jsonContent = typeof data === "object" ? 
                    JSON.stringify(data, null, 2) : 
                    String(data);
                responseContent = `<pre style="background-color: var(--b3-theme-surface-light); padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px; font-family: var(--b3-font-family-code);">${jsonContent}</pre>`;
            }
        } else {
            responseContent = `<div style="color: var(--b3-theme-error);">${error || "请求失败"}</div>`;
        }
        
        const responseMessage: AIChatMessage = {
            role: "response",
            content: `**${menu.name} 请求结果**<br><br>` +
                    `**响应数据**<br>${responseContent}`,
            timestamp: Date.now()
        };
        
        this.dialogState.aiChatMessages.push(responseMessage);
        console.log("添加响应消息:", responseMessage);
    }
    
    private markdownToHtml(markdown: string): string {
        // 转换标题
        markdown = markdown.replace(/^# (.*$)/gm, '<h1 style="margin: 12px 0 8px 0; font-size: 18px; font-weight: bold;">$1</h1>');
        markdown = markdown.replace(/^## (.*$)/gm, '<h2 style="margin: 10px 0 6px 0; font-size: 16px; font-weight: bold;">$1</h2>');
        markdown = markdown.replace(/^### (.*$)/gm, '<h3 style="margin: 8px 0 4px 0; font-size: 14px; font-weight: bold;">$1</h3>');
        
        // 转换加粗
        markdown = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // 转换斜体
        markdown = markdown.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // 转换行内代码
        markdown = markdown.replace(/`(.*?)`/g, '<code style="background-color: var(--b3-theme-surface-light); padding: 2px 4px; border-radius: 3px; font-family: var(--b3-font-family-code); font-size: 12px;">$1</code>');
        
        // 转换代码块
        markdown = markdown.replace(/```([\s\S]*?)```/g, '<pre style="background-color: var(--b3-theme-surface-light); padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px; font-family: var(--b3-font-family-code); margin: 8px 0;">$1</pre>');
        
        // 转换无序列表
        markdown = markdown.replace(/^\s*[-*]\s(.*$)/gm, '<li style="margin-left: 20px; list-style-type: disc;">$1</li>');
        
        // 转换有序列表
        markdown = markdown.replace(/^\s*\d+\.\s(.*$)/gm, '<li style="margin-left: 20px; list-style-type: decimal;">$1</li>');
        
        // 转换引用
        markdown = markdown.replace(/^> (.*$)/gm, '<blockquote style="border-left: 3px solid var(--b3-theme-primary); padding-left: 10px; margin: 8px 0; color: var(--b3-theme-on-surface-light);">$1</blockquote>');
        
        // 转换换行符
        markdown = markdown.replace(/\n/g, '<br>');
        
        return markdown;
    }
    
    private addToHistory(selectedText: string, menu: MenuConfig, requestData: any, responseData: any, error: string | null) {
        const historyItem: RequestHistory = {
            id: `history-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: Date.now(),
            selectedText,
            menu,
            requestData,
            responseData,
            error
        };
        
        this.dialogState.history.unshift(historyItem); // 添加到开头
        this.dialogState.currentHistoryId = historyItem.id;
        
        // 限制历史记录数量
        if (this.dialogState.history.length > 100) {
            this.dialogState.history = this.dialogState.history.slice(0, 100);
        }
        
        // 更新配置中的历史记录
        if (this.config) {
            this.config.history = this.dialogState.history;
            // 保存配置，持久化历史记录
            this.saveConfig().catch(error => {
                console.error("保存历史记录失败:", error);
            });
        }
    }
    
    private async sendAIChatMessage() {
        const userMessage = this.dialogState.aiChatInput.trim();
        if (!userMessage) return;
        
        // 添加用户消息到聊天记录
        const userChatMessage: AIChatMessage = {
            role: "user",
            content: userMessage,
            timestamp: Date.now()
        };
        this.dialogState.aiChatMessages.push(userChatMessage);
        
        // 清空输入框
        this.dialogState.aiChatInput = "";
        this.dialogState.aiChatLoading = true;
        this.dialogState.aiChatError = null;
        
        // 更新界面
        this.updateSidebarDialog();
        
        try {
            // 发送 AI 聊天请求
            const response = await this.sendAIChatRequest(this.dialogState.aiChatMessages);
            
            // 添加 AI 回复到聊天记录
            const aiChatMessage: AIChatMessage = {
                role: "assistant",
                content: response,
                timestamp: Date.now()
            };
            this.dialogState.aiChatMessages.push(aiChatMessage);
            
        } catch (error) {
            this.dialogState.aiChatError = error instanceof Error ? error.message : "发送失败";
            console.error("AI 聊天发送失败:", error);
        } finally {
            this.dialogState.aiChatLoading = false;
            this.updateSidebarDialog();
        }
    }
    
    private async saveAIChatHistory() {
        if (this.dialogState.aiChatMessages.length === 0) return;
        
        // 生成聊天标题（使用第一条消息的内容）
        const firstMessage = this.dialogState.aiChatMessages[0];
        const chatTitle = firstMessage.content.substring(0, 30) + (firstMessage.content.length > 30 ? "..." : "");
        
        if (this.dialogState.currentAIChatId) {
            // 更新现有聊天历史
            const existingChatIndex = this.dialogState.aiChatHistory.findIndex(
                chat => chat.id === this.dialogState.currentAIChatId
            );
            
            if (existingChatIndex >= 0) {
                this.dialogState.aiChatHistory[existingChatIndex] = {
                    ...this.dialogState.aiChatHistory[existingChatIndex],
                    messages: [...this.dialogState.aiChatMessages],
                    updatedAt: Date.now()
                };
            }
        } else {
            // 创建新聊天历史
            const newChat: AIChatHistory = {
                id: `ai-chat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                title: chatTitle,
                messages: [...this.dialogState.aiChatMessages],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            
            this.dialogState.aiChatHistory.unshift(newChat);
            this.dialogState.currentAIChatId = newChat.id;
            
            // 限制聊天历史数量
            if (this.dialogState.aiChatHistory.length > 50) {
                this.dialogState.aiChatHistory = this.dialogState.aiChatHistory.slice(0, 50);
            }
        }
        
        // 保存到配置
        if (this.config) {
            this.config.aiChatHistory = this.dialogState.aiChatHistory;
            await this.saveConfig();
        }
    }
    
    private loadAIChatHistory(chatId: string) {
        const chatHistory = this.dialogState.aiChatHistory.find(chat => chat.id === chatId);
        if (chatHistory) {
            this.dialogState.aiChatMessages = [...chatHistory.messages];
            this.dialogState.currentAIChatId = chatId;
            this.updateSidebarDialog();
        }
    }
    
    private newAIChatSession() {
        this.dialogState.aiChatMessages = [];
        this.dialogState.aiChatInput = "";
        this.dialogState.currentAIChatId = null;
        this.dialogState.aiChatError = null;
        this.updateSidebarDialog();
    }
    
    private renderResultStep(element: Element) {
        if (this.dialogState.error) {
            element.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <h3 style="margin-top: 0;">请求失败</h3>
                    <div class="b3-label--error" style="margin-bottom: 16px;">
                        ${this.dialogState.error}
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="b3-button" id="back-to-send-btn">
                        <svg class="b3-button__icon"><use xlink:href="#iconBack"></use></svg>
                        <span>返回</span>
                    </button>
                    <button class="b3-button b3-button--primary" id="retry-btn">
                        <svg class="b3-button__icon"><use xlink:href="#iconRefresh"></use></svg>
                        <span>重试</span>
                    </button>
                </div>
            `;
            
            const backBtn = element.querySelector("#back-to-send-btn");
            if (backBtn) {
                backBtn.addEventListener("click", () => {
                    this.dialogState.step = "send";
                    this.updateSidebarDialog();
                });
            }
            
            const retryBtn = element.querySelector("#retry-btn");
            if (retryBtn) {
                retryBtn.addEventListener("click", async () => {
                    await this.sendRequestAndShowResult();
                });
            }
            
            return;
        }
        
        const formattedResponse = this.formatResponse(
            this.dialogState.responseData,
            this.dialogState.selectedMenu!,
            this.dialogState.selectedText
        );
        
        element.innerHTML = `
            <div style="margin-bottom: 16px;">
                <h3 style="margin-top: 0;">请求结果</h3>
                <div style="margin-bottom: 12px;">
                    <h4 style="margin-bottom: 8px;">响应数据</h4>
                    <div class="b3-label--info" style="padding: 12px; border-radius: 4px; white-space: pre-wrap; font-family: var(--b3-font-family-code); font-size: 12px; user-select: text;">${formattedResponse}</div>
                </div>
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button class="b3-button" id="back-to-prepare-btn">
                    <svg class="b3-button__icon"><use xlink:href="#iconBack"></use></svg>
                    <span>返回</span>
                </button>
                <button class="b3-button b3-button--primary" id="copy-btn">
                    <svg class="b3-button__icon"><use xlink:href="#iconCopy"></use></svg>
                    <span>复制结果</span>
                </button>
                <button class="b3-button b3-button--outline" id="send-to-ai-btn">
                    <svg class="b3-button__icon"><use xlink:href="#iconSend"></use></svg>
                    <span>发送到 AI 聊天</span>
                </button>
            </div>
        `;
        
        const backBtn = element.querySelector("#back-to-prepare-btn");
        if (backBtn) {
            backBtn.addEventListener("click", () => {
                this.dialogState.step = "prepare";
                this.updateSidebarDialog();
            });
        }
        
        const copyBtn = element.querySelector("#copy-btn");
        if (copyBtn) {
            copyBtn.addEventListener("click", () => {
                navigator.clipboard.writeText(formattedResponse).then(() => {
                    showMessage("结果已复制到剪贴板");
                }).catch(err => {
                    showMessage("复制失败，请手动选择复制");
                    console.error("复制失败:", err);
                });
            });
        }
        
        const sendToAIBtn = element.querySelector("#send-to-ai-btn");
        if (sendToAIBtn) {
            sendToAIBtn.addEventListener("click", () => {
                if (this.dialogState.selectedMenu && this.dialogState.responseData) {
                    const formattedRequest = JSON.stringify(this.dialogState.requestData, null, 2);
                    
                    const contextMessage = `📡 **${this.dialogState.selectedMenu.name} 请求**\n\n` +
                        `**请求数据:**\n\`\`\`json\n${formattedRequest}\n\`\`\`\n\n` +
                        `**响应数据:**\n\`\`\`json\n${formattedResponse}\n\`\`\``;
                    
                    // 添加到聊天记录
                    this.dialogState.aiChatMessages.push({
                        role: "user",
                        content: contextMessage,
                        timestamp: Date.now()
                    });
                    
                    // 切换到AI聊天界面
                    this.dialogState.step = "aiChat";
                    this.updateSidebarDialog();
                }
            });
        }
    }
    
    private renderAIChatStep(element: Element) {
        // 生成完整的聊天消息列表，包括装配报文和请求结果
        const allMessages = this.generateIntegratedMessages();
        
        // 构建基础HTML结构
        element.innerHTML = `
            <div style="display: flex; flex-direction: column; height: 100%; padding: 16px; box-sizing: border-box;">
                <!-- 聊天消息区域 -->
                <div id="chat-messages" style="flex: 1; overflow-y: auto; padding: 16px; border-radius: 8px; background-color: var(--b3-theme-surface); margin-bottom: 16px; gap: 12px; display: flex; flex-direction: column;">
                    ${allMessages.length > 0 ? 
                        allMessages.map((msg, index) => `
                            <div class="chat-message ${msg.role}" data-message-index="${index}" style="margin-bottom: 16px; display: flex; ${msg.role === 'user' || msg.role === 'request' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}">
                                <div style="${(msg.role === 'user' || msg.role === 'request') ? 'order: 2; margin-left: 12px;' : 'order: 1; margin-right: 12px;'}">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; ${msg.role === 'user' ? 'background-color: var(--b3-theme-primary); color: white;' : msg.role === 'request' ? 'background-color: var(--b3-theme-warning); color: white;' : msg.role === 'response' ? 'background-color: var(--b3-theme-success); color: white;' : 'background-color: var(--b3-theme-surface-light); color: var(--b3-theme-on-surface);'}">
                                        ${msg.role === "user" ? "👤" : msg.role === "request" ? "📡" : msg.role === "response" ? "📊" : "🤖"}
                                    </div>
                                </div>
                                <div style="flex: 1; max-width: 80%; ${(msg.role === 'user' || msg.role === 'request') ? 'order: 1;' : 'order: 2;'}">
                                    <div style="display: flex; align-items: center; margin-bottom: 4px;">
                                        <span style="font-size: 12px; font-weight: bold; ${msg.role === 'user' ? 'color: var(--b3-theme-primary);' : msg.role === 'request' ? 'color: var(--b3-theme-warning);' : msg.role === 'response' ? 'color: var(--b3-theme-success);' : 'color: var(--b3-theme-on-surface);'}">
                                            ${msg.role === "user" ? "你" : msg.role === "request" ? "装配报文" : msg.role === "response" ? "请求结果" : "AI"}
                                        </span>
                                        <span style="font-size: 10px; color: var(--b3-theme-on-surface-light); margin-left: 8px;">
                                            ${new Date(msg.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div style="padding: 12px; border-radius: 12px; line-height: 1.4; font-size: 14px; ${msg.role === 'user' ? 'background-color: var(--b3-theme-primary); color: white; border-bottom-right-radius: 4px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);' : msg.role === 'request' || msg.role === 'response' ? 'background-color: var(--b3-theme-surface); color: var(--b3-theme-on-surface); border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid var(--b3-theme-border); user-select: text;' : 'background-color: var(--b3-theme-background); color: var(--b3-theme-on-background); border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); border: 1px solid var(--b3-theme-border); user-select: text;'}" class="message-content"></div>
                                </div>
                            </div>
                        `).join("") : 
                        '<div style="text-align: center; padding: 48px 24px; color: var(--b3-theme-on-surface-light);">' +
                        '<div style="font-size: 32px; margin-bottom: 12px;">🤖</div>' +
                        '<div style="font-size: 16px; margin-bottom: 8px;">开始与 AI 聊天吧</div>' +
                        '<div style="font-size: 14px; line-height: 1.4;">你可以询问任何问题，获取帮助</div>' +
                        '</div>'
                    }
                    ${this.dialogState.aiChatLoading ? 
                        '<div class="chat-message assistant" style="margin-bottom: 16px; display: flex;">' +
                        '<div style="margin-right: 12px;">' +
                        '<div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; background-color: var(--b3-theme-surface-light); color: var(--b3-theme-on-surface);">🤖</div>' +
                        '</div>' +
                        '<div style="flex: 1; max-width: 80%;">' +
                        '<div style="display: flex; align-items: center; margin-bottom: 4px;">' +
                        '<span style="font-size: 12px; font-weight: bold; color: var(--b3-theme-on-surface);">AI</span>' +
                        '</div>' +
                        '<div style="padding: 12px; border-radius: 12px; background-color: var(--b3-theme-surface-light); color: var(--b3-theme-on-surface); border-bottom-left-radius: 4px;">' +
                        '<div class="b3-loading" style="margin: 8px 0;"></div>' +
                        '</div>' +
                        '</div>' +
                        '</div>' : ""
                    }
                    ${this.dialogState.aiChatError ? 
                        '<div class="chat-message error" style="margin-bottom: 16px; display: flex;">' +
                        '<div style="margin-right: 12px;">' +
                        '<div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; background-color: var(--b3-theme-error-light); color: var(--b3-theme-error);">⚠️</div>' +
                        '</div>' +
                        '<div style="flex: 1; max-width: 80%;">' +
                        '<div style="display: flex; align-items: center; margin-bottom: 4px;">' +
                        '<span style="font-size: 12px; font-weight: bold; color: var(--b3-theme-error);">错误</span>' +
                        '</div>' +
                        '<div style="padding: 12px; border-radius: 12px; background-color: var(--b3-theme-error-light); color: var(--b3-theme-error); border-bottom-left-radius: 4px; font-size: 14px; line-height: 1.4;">' +
                        this.dialogState.aiChatError +
                        '</div>' +
                        '</div>' +
                        '</div>' : ""
                    }
                </div>
                
                <!-- 输入区域 -->
                <div style="padding: 16px; background-color: var(--b3-theme-surface); border-radius: 8px; box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);">
                    ${this.dialogState.selectedMenu ? `
                        <div style="margin-bottom: 12px; display: flex; gap: 8px;">
                            <button class="b3-button b3-button--outline" id="send-request-btn" ${this.dialogState.loading ? "disabled" : ""}>
                                <svg class="b3-button__icon"><use xlink:href="#iconSend"></use></svg>
                                <span>发送 ${this.dialogState.selectedMenu.name} 请求</span>
                            </button>
                        </div>
                    ` : ""}
                    <div style="display: flex; gap: 12px;">
                        <textarea 
                            id="ai-chat-input" 
                            style="flex: 1; padding: 12px; border: 1px solid var(--b3-theme-border); border-radius: 8px; resize: none; min-height: 48px; max-height: 150px; font-size: 14px; font-family: var(--b3-font-family); background-color: var(--b3-theme-background); color: var(--b3-theme-on-background);"
                            placeholder="输入消息..."
                            ${this.dialogState.aiChatLoading ? "disabled" : ""}
                        ></textarea>
                        <button 
                            class="b3-button b3-button--primary" 
                            id="send-ai-chat-btn" 
                            ${this.dialogState.aiChatLoading ? "disabled" : ""}
                            style="padding: 0 20px; border-radius: 8px; font-size: 14px; font-weight: 500; min-width: 80px; display: flex; align-items: center; justify-content: center; gap: 4px;"
                        >
                            <svg class="b3-button__icon"><use xlink:href="#iconSend"></use></svg>
                            <span>发送</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // 设置消息内容，确保HTML标签被正确渲染
        const messageContents = element.querySelectorAll(".message-content");
        messageContents.forEach((contentElement, index) => {
            if (index < allMessages.length) {
                contentElement.innerHTML = allMessages[index].content;
            }
        });
        
        // 添加发送按钮事件
        const sendBtn = element.querySelector("#send-ai-chat-btn");
        if (sendBtn) {
            sendBtn.addEventListener("click", async () => {
                const chatInput = element.querySelector("#ai-chat-input") as HTMLTextAreaElement;
                if (chatInput) {
                    this.dialogState.aiChatInput = chatInput.value;
                }
                await this.sendAIChatMessage();
            });
        }
        
        // 添加发送请求按钮事件
        const sendRequestBtn = element.querySelector("#send-request-btn");
        if (sendRequestBtn) {
            sendRequestBtn.addEventListener("click", async () => {
                await this.sendRequestAndShowResult();
            });
        }
        
        // 添加输入框回车发送事件
        const chatInput = element.querySelector("#ai-chat-input") as HTMLTextAreaElement;
        if (chatInput) {
            chatInput.addEventListener("keydown", async (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    this.dialogState.aiChatInput = chatInput.value;
                    await this.sendAIChatMessage();
                }
            });
            
            // 自动调整输入框高度
            chatInput.addEventListener("input", () => {
                chatInput.style.height = "auto";
                chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + "px";
            });
        }
        
        // 滚动到底部
        const chatMessages = element.querySelector("#chat-messages");
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    private generateIntegratedMessages() {
        const allMessages = [];
        
        // 只添加AI聊天消息，包括装配报文和请求结果
        this.dialogState.aiChatMessages.forEach(msg => {
            allMessages.push(msg);
        });
        
        // 按时间排序
        allMessages.sort((a, b) => a.timestamp - b.timestamp);
        
        return allMessages;
    }
    
    private formatResponse(data: any, menu: MenuConfig, selectedText: string): string {
        const getValueByPath = (obj: any, path: string): any => {
            if (obj === null || obj === undefined) return undefined;
            
            const segments = path.split(/(?<!\\)\.|(?<!\\)\[(.*?)(?<!\\)\]/g)
                .filter(segment => segment && segment !== "[")
                .map(segment => segment.replace(/^['"]|['"]$/g, ""));
            
            let current = obj;
            for (const segment of segments) {
                if (current === null || current === undefined) return undefined;
                
                if (!isNaN(Number(segment))) {
                    const index = Number(segment);
                    if (Array.isArray(current) && index >= 0 && index < current.length) {
                        current = current[index];
                    } else {
                        return undefined;
                    }
                } else {
                    if (typeof current === "object" && segment in current) {
                        current = current[segment];
                    } else {
                        return undefined;
                    }
                }
            }
            return current;
        };
        
        const renderTemplate = (template: string, context: any): string => {
            // 处理数组循环
            const eachRegex = /\$\{each\(([^)]+)\s+as\s+([^}]+)\)\}\s*([\s\S]*?)\$\{end\}/g;
            
            let rendered = template.replace(eachRegex, (match, arrayPath, itemName, content) => {
                const array = getValueByPath(context, arrayPath.trim());
                if (!Array.isArray(array)) return match;
                
                return array.map((item: any) => {
                    // 为每个数组项创建新的上下文
                    const itemContext = {
                        ...context,
                        [itemName.trim()]: item
                    };
                    // 递归渲染数组项内容
                    return renderTemplate(content, itemContext);
                }).join("");
            });
            
            // 处理普通变量替换
            rendered = rendered.replace(/\$\{([^}]+)\}/g, (match, expression) => {
                expression = expression.trim();
                
                if (expression === "data") {
                    const dataStr = typeof context === "object" ? JSON.stringify(context, null, 2) : String(context);
                    return dataStr;
                } else if (expression === "selectText") {
                    return selectedText;
                }
                
                // 处理默认值语法：${path || defaultValue}
                const defaultValueMatch = expression.match(/^\s*([^|]+)\s*\|\|\s*(.+)$/);
                if (defaultValueMatch) {
                    const path = defaultValueMatch[1].trim();
                    const defaultValue = defaultValueMatch[2].trim();
                    
                    const value = getValueByPath(context, path);
                    if (value !== undefined && value !== null && value !== "") {
                        return String(value);
                    } else {
                        // 解析默认值，处理字符串引号
                        if ((defaultValue.startsWith('"') && defaultValue.endsWith('"')) || 
                            (defaultValue.startsWith("'") && defaultValue.endsWith("'"))) {
                            return defaultValue.substring(1, defaultValue.length - 1);
                        }
                        return defaultValue;
                    }
                }
                
                // 普通变量替换
                const value = getValueByPath(context, expression);
                return value !== undefined ? String(value) : match;
            });
            
            return rendered;
        };
        
        if (menu.template) {
            try {
                let rendered = renderTemplate(menu.template, data);
                rendered = rendered.replace(/\\n/g, "\n");
                return rendered;
            } catch (error) {
                console.error("Template rendering error:", error);
            }
        }
        
        return typeof data === "object" ? JSON.stringify(data, null, 2) : String(data);
    }
    
    private insertResultToDocument() {
        const content = this.formatResponse(
            this.dialogState.responseData,
            this.dialogState.selectedMenu!,
            this.dialogState.selectedText
        );
        
        const activeEditor = document.querySelector(".protyle-wysiwyg");
        if (activeEditor) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.collapse(false);
                
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = `<p>${content}</p>`;
                
                while (tempDiv.firstChild) {
                    range.insertNode(tempDiv.firstChild);
                }
                
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
                
                const inputEvent = new InputEvent("input", {
                    bubbles: true,
                    cancelable: true,
                    composed: true
                });
                activeEditor.dispatchEvent(inputEvent);
            }
        }
    }
    
    private showFloatingMenu(selectedText: string, selection: Selection) {
        // 清除之前的浮动菜单
        this.clearFloatingMenu();
        
        // 获取选中区域的位置
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // 过滤匹配的菜单
        const matchedMenus = this.config.menus.filter(menuConfig => {
            return this.isMenuMatch(menuConfig, selectedText);
        });
        
        // 创建浮动菜单元素
        const floatingMenu = document.createElement("div");
        floatingMenu.id = "click2fill-floating-menu";
        floatingMenu.style.position = "fixed";
        floatingMenu.style.left = `${rect.left}px`;
        floatingMenu.style.top = `${rect.bottom + 5}px`;
        floatingMenu.style.zIndex = "10000";
        floatingMenu.style.backgroundColor = "var(--b3-theme-background)";
        floatingMenu.style.border = "1px solid var(--b3-theme-border)";
        floatingMenu.style.borderRadius = "4px";
        floatingMenu.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15)";
        floatingMenu.style.padding = "4px";
        floatingMenu.style.display = "flex";
        floatingMenu.style.flexDirection = "column";
        floatingMenu.style.minWidth = "150px";
        floatingMenu.style.maxWidth = "300px";
        // 添加tabindex使其能够获得焦点
        floatingMenu.setAttribute("tabindex", "-1");
        
        // 确保菜单不会超出屏幕边界
        const menuWidth = 200; // 预估菜单宽度
        const viewportWidth = window.innerWidth;
        if (rect.left + menuWidth > viewportWidth) {
            floatingMenu.style.left = `${viewportWidth - menuWidth - 10}px`;
        }
        
        // 确保菜单不会超出屏幕底部
        const menuHeight = matchedMenus.length * 40 + 20; // 预估菜单高度
        const viewportHeight = window.innerHeight;
        if (rect.bottom + menuHeight > viewportHeight) {
            floatingMenu.style.top = `${rect.top - menuHeight - 5}px`;
        }
        
        if (matchedMenus.length > 0) {
            matchedMenus.forEach(menu => {
                const menuItem = document.createElement("div");
                menuItem.style.padding = "8px 12px";
                menuItem.style.cursor = "pointer";
                menuItem.style.borderRadius = "4px";
                menuItem.style.display = "flex";
                menuItem.style.alignItems = "center";
                menuItem.style.gap = "8px";
                menuItem.title = menu.name;
                
                menuItem.innerHTML = `
                    <svg class="b3-button__icon" style="width: 16px; height: 16px;"><use xlink:href="#${menu.icon}"></use></svg>
                    <span>${menu.name}</span>
                `;
                
                menuItem.addEventListener("mouseenter", () => {
                    menuItem.style.backgroundColor = "var(--b3-theme-surface)";
                });
                
                menuItem.addEventListener("mouseleave", () => {
                    menuItem.style.backgroundColor = "transparent";
                });
                
                menuItem.addEventListener("click", async () => {
                    this.clearFloatingMenu();
                    this.dialogState.selectedText = selectedText;
                    this.dialogState.selectedMenu = menu;
                    this.dialogState.step = "aiChat";
                    this.prepareRequestData();
                    // 添加装配报文到AI聊天
                    this.addAssemblyMessageToChat();
                    await this.showSidebarDialog();
                    // 延迟一下确保对话框已显示，然后自动发送请求
                    setTimeout(async () => {
                        await this.sendRequestAndShowResult();
                    }, 100);
                });
                
                floatingMenu.appendChild(menuItem);
            });
        } else {
            const noMatchItem = document.createElement("div");
            noMatchItem.style.padding = "8px 12px";
            noMatchItem.style.color = "var(--b3-theme-on-surface)";
            noMatchItem.style.fontSize = "12px";
            noMatchItem.textContent = "没有匹配的接口";
            floatingMenu.appendChild(noMatchItem);
        }
        
        // 添加到文档
        document.body.appendChild(floatingMenu);
        
        // 让菜单获得焦点，以便键盘事件能够被正确处理
        floatingMenu.focus();
        
        // 添加键盘事件处理，支持方向键选择
        this.setupKeyboardNavigation(floatingMenu, matchedMenus);
        
        // 点击其他地方关闭菜单
        const handleClickOutside = (event: MouseEvent) => {
            try {
                if (!floatingMenu.contains(event.target as Node)) {
                    this.clearFloatingMenu();
                }
            } catch (error) {
                console.error("Error in click outside handler:", error);
                // 发生错误时也清理菜单
                this.clearFloatingMenu();
            }
        };
        
        setTimeout(() => {
            document.addEventListener("click", handleClickOutside, { once: true });
        }, 100);
    }
    
    private clearFloatingMenu() {
        const existingMenu = document.getElementById("click2fill-floating-menu");
        if (existingMenu) {
            existingMenu.remove();
        }
    }
    
    private handleDocumentClick(event: MouseEvent) {
        try {
            const floatingMenu = document.getElementById("click2fill-floating-menu");
            if (floatingMenu && !floatingMenu.contains(event.target as Node)) {
                this.clearFloatingMenu();
            }
        } catch (error) {
            console.error("Error in handleDocumentClick:", error);
        }
    }
    
    private setupKeyboardNavigation(floatingMenu: HTMLElement, matchedMenus: MenuConfig[]) {
        if (matchedMenus.length === 0) return;
        
        const menuItems = floatingMenu.querySelectorAll("div[title]");
        let currentIndex = 0;
        
        // 高亮第一个菜单项
        if (menuItems.length > 0) {
            (menuItems[0] as HTMLElement).style.backgroundColor = "var(--b3-theme-surface)";
        }
        
        const handleKeydown = (event: KeyboardEvent) => {
            // 检查事件是否来自菜单或文档
            // 即使焦点在菜单上，也处理键盘事件
            switch (event.key) {
                case "ArrowDown":
                case "ArrowUp":
                case "Enter":
                case "Escape":
                    // 阻止所有相关按键的默认行为
                    event.preventDefault();
                    event.stopPropagation();
                    
                    switch (event.key) {
                        case "ArrowDown":
                            // 移除当前高亮
                            if (currentIndex < menuItems.length) {
                                (menuItems[currentIndex] as HTMLElement).style.backgroundColor = "transparent";
                            }
                            // 移动到下一个
                            currentIndex = (currentIndex + 1) % menuItems.length;
                            // 高亮新菜单项
                            (menuItems[currentIndex] as HTMLElement).style.backgroundColor = "var(--b3-theme-surface)";
                            // 滚动到可视区域
                            (menuItems[currentIndex] as HTMLElement).scrollIntoView({ behavior: "smooth", block: "nearest" });
                            break;
                        case "ArrowUp":
                            // 移除当前高亮
                            if (currentIndex < menuItems.length) {
                                (menuItems[currentIndex] as HTMLElement).style.backgroundColor = "transparent";
                            }
                            // 移动到上一个
                            currentIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
                            // 高亮新菜单项
                            (menuItems[currentIndex] as HTMLElement).style.backgroundColor = "var(--b3-theme-surface)";
                            // 滚动到可视区域
                            (menuItems[currentIndex] as HTMLElement).scrollIntoView({ behavior: "smooth", block: "nearest" });
                            break;
                        case "Enter":
                            // 触发当前菜单项的点击事件
                            if (currentIndex < menuItems.length) {
                                (menuItems[currentIndex] as HTMLElement).click();
                            }
                            break;
                        case "Escape":
                            // 关闭菜单
                            this.clearFloatingMenu();
                            break;
                    }
                    break;
            }
        };
        
        // 添加键盘事件监听器到文档，确保即使焦点不在菜单上也能捕获按键
        document.addEventListener("keydown", handleKeydown, { capture: true });
        
        // 清理事件监听器
        const cleanup = () => {
            document.removeEventListener("keydown", handleKeydown, { capture: true });
        };
        
        // 当菜单被移除时清理
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node === floatingMenu) {
                        cleanup();
                        observer.disconnect();
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true });
    }
    
    private async openConfigurePanel() {
        // 使用字符串拼接而不是模板字符串，避免解析占位符
        const htmlContent = 
            '<div class="plugin-click2fill__config-panel" style="padding: 20px; max-height: 600px; overflow-y: auto; background-color: var(--b3-theme-background); color: var(--b3-theme-on-surface);">' +
                '<h2 style="margin-top: 0; margin-bottom: 16px; color: var(--b3-theme-on-surface);">配置接口</h2>' +
                '<p style="margin-bottom: 20px; color: var(--b3-theme-on-surface-light);">添加和管理 Click2Fill 接口</p>' +
                '<div style="display: flex; gap: 8px; margin-bottom: 20px;">' +
                    '<button id="addMenu" class="b3-button b3-button--primary">' +
                        '<svg class="b3-button__icon"><use xlink:href="#iconAdd"></use></svg>' +
                        "<span>添加接口</span>" +
                    "</button>" +
                    '<button id="exportMenus" class="b3-button">' +
                        '<svg class="b3-button__icon"><use xlink:href="#iconDownload"></use></svg>' +
                        "<span>导出接口</span>" +
                    "</button>" +
                    '<button id="importMenus" class="b3-button">' +
                        '<svg class="b3-button__icon"><use xlink:href="#iconUpload"></use></svg>' +
                        "<span>导入接口</span>" +
                    "</button>" +
                "</div>" +
                '<div id="menusList" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;"></div>' +
                '<div id="menuEditor" style="display: none; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--b3-theme-border);"></div>' +
            "</div>";
        
        const dialog = new Dialog({
            title: "配置接口",
            content: htmlContent,
            width: "900px",
            height: "750px"
        });
        
        // 等待对话框显示，然后加载菜单列表
        setTimeout(async () => {
            const menusList = dialog.element.querySelector("#menusList");
            if (menusList) {
                await this.loadMenusList(menusList, dialog);
                
                const addMenuBtn = dialog.element.querySelector("#addMenu");
                if (addMenuBtn) {
                    addMenuBtn.addEventListener("click", async () => {
                        await this.addNewMenu();
                        const menusListElement = dialog.element.querySelector("#menusList");
                        if (menusListElement) {
                            await this.loadMenusList(menusListElement, dialog);
                        }
                    });
                }
                
                // 导出接口按钮事件
                const exportMenusBtn = dialog.element.querySelector("#exportMenus");
                if (exportMenusBtn) {
                    exportMenusBtn.addEventListener("click", async () => {
                        await this.exportMenus();
                    });
                }
                
                // 导入接口按钮事件
                const importMenusBtn = dialog.element.querySelector("#importMenus");
                if (importMenusBtn) {
                    importMenusBtn.addEventListener("click", async () => {
                        await this.importMenus(dialog);
                    });
                }
            }
        }, 100);
    }
    
    private async loadMenusList(container: Element, dialog: any) {
        container.innerHTML = "";
        
        if (!this.config || !Array.isArray(this.config.menus)) {
            await this.loadConfig();
        }
        
        if (this.config.menus.length === 0) {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--b3-theme-on-surface-light);">暂无配置的接口，请点击上方按钮添加</div>';
            return;
        }
        
        this.config.menus.forEach(menu => {
            const menuItem = document.createElement("div");
            menuItem.style.display = "flex";
            menuItem.style.alignItems = "center";
            menuItem.style.justifyContent = "space-between";
            menuItem.style.padding = "12px";
            menuItem.style.border = "1px solid var(--b3-theme-border)";
            menuItem.style.borderRadius = "6px";
            menuItem.style.backgroundColor = "var(--b3-theme-surface)";
            
            menuItem.innerHTML = 
                '<div style="display: flex; align-items: center; gap: 12px;">' +
                    '<svg class="b3-button__icon" style="width: 16px; height: 16px;"><use xlink:href="#' + menu.icon + '"></use></svg>' +
                    "<div>" +
                        '<h4 style="margin: 0; color: var(--b3-theme-on-surface);">' + menu.name + "</h4>" +
                        '<p style="margin: 4px 0 0 0; font-size: 12px; color: var(--b3-theme-on-surface-light);">' + menu.url + "</p>" +
                    "</div>" +
                "</div>" +
                '<div style="display: flex; gap: 8px;">' +
                    '<button class="b3-button b3-button--small edit-menu" data-id="' + menu.id + '">' +
                        '<svg class="b3-button__icon"><use xlink:href="#iconSettings"></use></svg>' +
                        "<span>编辑</span>" +
                    "</button>" +
                    '<button class="b3-button b3-button--small b3-button--warning delete-menu" data-id="' + menu.id + '">' +
                        '<svg class="b3-button__icon"><use xlink:href="#iconTrash"></use></svg>' +
                        "<span>删除</span>" +
                    "</button>" +
                "</div>";
            
            menuItem.querySelector(".edit-menu").addEventListener("click", async () => {
                const menuEditor = dialog.element.querySelector("#menuEditor");
                if (menuEditor) {
                    await this.showMenuEditor(menuEditor, menu);
                }
            });
            
            menuItem.querySelector(".delete-menu").addEventListener("click", async () => {
                await this.deleteMenu(menu.id);
                await this.loadMenusList(container, dialog);
            });
            
            container.appendChild(menuItem);
        });
    }
    
    private async showMenuEditor(container: Element, menu: MenuConfig) {
        // 使用字符串拼接而不是模板字符串，避免解析占位符
        const headersJson = JSON.stringify(menu.headers, null, 2).replace(/`/g, "\\`");
        // 为 Params 设置默认值，如果为空则使用默认 JSON
        let paramsJson = "";
        if (Object.keys(menu.params || {}).length === 0) {
            // 使用有效的 JSON 格式，确保 ${selectText} 作为字符串值
            paramsJson = '{"text": "${selectText}"}';
        } else {
            paramsJson = JSON.stringify(menu.params, null, 2);
        }
        const keywordValue = (menu.keyword || "").replace(/`/g, "\\`");
        const regexValue = (menu.regex || "").replace(/`/g, "\\`");
        // 确定匹配方式
        const matchType = menu.keyword ? "keyword" : (menu.regex ? "regex" : "none");
        
        // 构建HTML内容
        let htmlContent = "";
        htmlContent += '<h3 style="margin-top: 0; margin-bottom: 20px; color: var(--b3-theme-on-surface);">编辑接口: ' + menu.name + "</h3>";
        htmlContent += '<div style="margin-bottom: 16px;">';
        htmlContent += '<label style="display: block; margin-bottom: 8px; color: var(--b3-theme-on-surface);">名称: </label>';
        htmlContent += '<input type="text" value="' + menu.name + '" style="width: 100%; padding: 8px; border: 1px solid var(--b3-theme-border); border-radius: 4px; background-color: var(--b3-theme-surface-light); color: var(--b3-theme-on-surface);" class="menu-name" data-id="' + menu.id + '">';
        htmlContent += "</div>";
        htmlContent += '<div style="margin-bottom: 16px;">';
        htmlContent += '<label style="display: block; margin-bottom: 8px; color: var(--b3-theme-on-surface);">URL: </label>';
        htmlContent += '<input type="text" value="' + menu.url + '" style="width: 100%; padding: 8px; border: 1px solid var(--b3-theme-border); border-radius: 4px; background-color: var(--b3-theme-surface-light); color: var(--b3-theme-on-surface);" class="menu-url" data-id="' + menu.id + '">';
        htmlContent += "</div>";
        htmlContent += '<div style="margin-bottom: 16px;">';
        htmlContent += '<label style="display: block; margin-bottom: 8px; color: var(--b3-theme-on-surface);">Method: </label>';
        htmlContent += '<select style="width: 100%; padding: 8px; border: 1px solid var(--b3-theme-border); border-radius: 4px; background-color: var(--b3-theme-surface-light); color: var(--b3-theme-on-surface);" class="menu-method" data-id="' + menu.id + '">';
        htmlContent += '<option value="POST"' + (menu.method === "POST" ? " selected" : "") + ">POST</option>";
        htmlContent += '<option value="GET"' + (menu.method === "GET" ? " selected" : "") + ">GET</option>";
        htmlContent += "</select>";
        htmlContent += "</div>";
        htmlContent += '<div style="margin-bottom: 16px;">';
        htmlContent += '<label style="display: block; margin-bottom: 8px; color: var(--b3-theme-on-surface);">Params: </label>';
        htmlContent += '<textarea style="width: 100%; padding: 8px; border: 1px solid var(--b3-theme-border); border-radius: 4px; background-color: var(--b3-theme-surface-light); color: var(--b3-theme-on-surface); height: 100px;" class="menu-params" data-id="' + menu.id + '" placeholder="{\n  \"text\": \"\\${selectText}\",\n  \"type\": \"info\"\n}">' + paramsJson + "</textarea>";
        htmlContent += "</div>";
        htmlContent += "<!-- 高级选项 -->";
        htmlContent += '<div style="margin-top: 24px; margin-bottom: 16px; border-top: 1px solid var(--b3-theme-border); padding-top: 16px;">';
        htmlContent += '<div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" id="advancedOptionsToggle">';
        htmlContent += '<h4 style="margin: 0; color: var(--b3-theme-on-surface);">高级选项</h4>';
        htmlContent += '<svg class="b3-button__icon" style="width: 16px; height: 16px; transition: transform 0.2s;" id="advancedOptionsIcon"><use xlink:href="#iconExpand"></use></svg>';
        htmlContent += "</div>";
        htmlContent += '<div id="advancedOptionsContent" style="display: none; margin-top: 16px;">';
        htmlContent += '<div style="margin-bottom: 16px;">';
        htmlContent += '<label style="display: block; margin-bottom: 8px; color: var(--b3-theme-on-surface);">Headers: </label>';
        htmlContent += '<textarea style="width: 100%; padding: 8px; border: 1px solid var(--b3-theme-border); border-radius: 4px; background-color: var(--b3-theme-surface-light); color: var(--b3-theme-on-surface); height: 100px;" class="menu-headers" data-id="' + menu.id + '" placeholder="{\n  \"Content-Type\": \"application/json\",\n  \"Authorization\": \"Bearer token\"\n}">' + headersJson + "</textarea>";
        htmlContent += "</div>";
        htmlContent += '<div style="margin-bottom: 16px;">';
        htmlContent += '<label style="display: block; margin-bottom: 8px; color: var(--b3-theme-on-surface);">响应模板: </label>';
        htmlContent += '<textarea style="width: 100%; padding: 8px; border: 1px solid var(--b3-theme-border); border-radius: 4px; background-color: var(--b3-theme-surface-light); color: var(--b3-theme-on-surface); height: 120px;" class="menu-template" data-id="' + menu.id + '" placeholder="# 响应结果\n\n## 匹配列表\n\${each(matches.matchlist as item)}\n- \${item.content}\n\${end}\n\n## 原始响应\n\${data}">' + (menu.template || "") + "</textarea>";
        htmlContent += '<p style="margin-top: 4px; color: var(--b3-theme-on-surface-light); font-size: 12px;">使用模板定制化显示响应数据：</p>';
        htmlContent += '<ul style="margin-top: 4px; margin-bottom: 8px; color: var(--b3-theme-on-surface-light); font-size: 12px; padding-left: 20px;">';
        htmlContent += "<li>显示整个响应: \${data}</li>";
        htmlContent += "<li>显示选中的文本: \${selectText}</li>";
        htmlContent += "<li>显示单个字段: \${matches.message}</li>";
        htmlContent += "<li>显示数组元素: \${matches.matchlist[0].content}</li>";
        htmlContent += "<li>遍历数组: \${each(matches.matchlist as item)}\n- \${item.content}\n\${end}</li>";
        htmlContent += "</ul>";
        htmlContent += '<p style="margin-top: 4px; color: var(--b3-theme-on-surface-light); font-size: 12px;">示例：只显示匹配列表中的内容字段</p>';
        htmlContent += '<pre style="margin-top: 4px; margin-bottom: 4px; color: var(--b3-theme-on-surface-light); font-size: 12px; background-color: var(--b3-theme-surface-light); padding: 8px; border-radius: 4px;">\${each(matches.matchlist as item)}\n- \${item.content}\n\${end}</pre>';
        htmlContent += "</div>";

        htmlContent += '<p style="margin-bottom: 16px; color: var(--b3-theme-on-surface-light); font-size: 14px;">这些选项用于控制菜单何时显示：</p>';
        htmlContent += '<div style="margin-bottom: 16px;">';
        htmlContent += '<label style="display: block; margin-bottom: 8px; color: var(--b3-theme-on-surface);">匹配方式: </label>';
        htmlContent += '<select style="width: 100%; padding: 8px; border: 1px solid var(--b3-theme-border); border-radius: 4px; background-color: var(--b3-theme-surface-light); color: var(--b3-theme-on-surface);" class="menu-matchType" data-id="' + menu.id + '">';
        htmlContent += '<option value="none"' + (matchType === "none" ? " selected" : "") + ">无（始终显示）</option>";
        htmlContent += '<option value="keyword"' + (matchType === "keyword" ? " selected" : "") + ">关键字</option>";
        htmlContent += '<option value="regex"' + (matchType === "regex" ? " selected" : "") + ">正则表达式</option>";
        htmlContent += "</select>";
        htmlContent += "</div>";
        htmlContent += '<div id="keywordSection" style="margin-bottom: 16px;' + (matchType !== "keyword" ? " display: none;" : "") + '">';
        htmlContent += '<label style="display: block; margin-bottom: 8px; color: var(--b3-theme-on-surface);">关键字: </label>';
        htmlContent += '<input type="text" value="' + keywordValue + '" style="width: 100%; padding: 8px; border: 1px solid var(--b3-theme-border); border-radius: 4px; background-color: var(--b3-theme-surface-light); color: var(--b3-theme-on-surface);" class="menu-keyword" data-id="' + menu.id + '" placeholder="多个关键字用逗号分隔，例如：API,请求,数据">';
        htmlContent += '<p style="margin-top: 4px; color: var(--b3-theme-on-surface-light); font-size: 12px;">当选中的文本包含这些关键字时，菜单会显示</p>';
        htmlContent += "</div>";
        htmlContent += '<div id="regexSection" style="margin-bottom: 16px;' + (matchType !== "regex" ? " display: none;" : "") + '">';
        htmlContent += '<label style="display: block; margin-bottom: 8px; color: var(--b3-theme-on-surface);">正则表达式: </label>';
        htmlContent += '<input type="text" value="' + regexValue + '" style="width: 100%; padding: 8px; border: 1px solid var(--b3-theme-border); border-radius: 4px; background-color: var(--b3-theme-surface-light); color: var(--b3-theme-on-surface);" class="menu-regex" data-id="' + menu.id + '" placeholder="JavaScript 正则表达式，例如：^\\d+$ (匹配数字)">';
        htmlContent += '<p style="margin-top: 4px; color: var(--b3-theme-on-surface-light); font-size: 12px;">当选中的文本匹配此正则表达式时，菜单会显示</p>';
        htmlContent += "</div>";
        htmlContent += "</div>";
        htmlContent += "</div>";
        htmlContent += '<div style="display: flex; gap: 12px; margin-top: 24px;">';
        htmlContent += '<button class="b3-button" id="cancelEdit">';
        htmlContent += '<svg class="b3-button__icon"><use xlink:href="#iconBack"></use></svg>';
        htmlContent += "<span>返回列表</span>";
        htmlContent += "</button>";
        htmlContent += '<button class="b3-button b3-button--primary" id="saveMenu">';
        htmlContent += '<svg class="b3-button__icon"><use xlink:href="#iconSave"></use></svg>';
        htmlContent += "<span>保存接口</span>";
        htmlContent += "</button>";
        htmlContent += "</div>";
        
        container.innerHTML = htmlContent;
        
        // 显示编辑器
        container.style.display = "block";
        
        // 添加高级选项折叠功能
        const toggle = container.querySelector("#advancedOptionsToggle");
        const content = container.querySelector("#advancedOptionsContent");
        const icon = container.querySelector("#advancedOptionsIcon");
        
        if (toggle && content && icon) {
            toggle.addEventListener("click", () => {
                if (content.style.display === "none") {
                    content.style.display = "block";
                    icon.style.transform = "rotate(90deg)";
                } else {
                    content.style.display = "none";
                    icon.style.transform = "rotate(0deg)";
                }
            });
        }
        
        // 添加匹配方式切换功能
        const matchTypeSelect = container.querySelector(".menu-matchType") as HTMLSelectElement;
        const keywordSection = container.querySelector("#keywordSection");
        const regexSection = container.querySelector("#regexSection");
        
        if (matchTypeSelect && keywordSection && regexSection) {
            matchTypeSelect.addEventListener("change", () => {
                const selectedType = matchTypeSelect.value;
                if (selectedType === "keyword") {
                    keywordSection.style.display = "block";
                    regexSection.style.display = "none";
                } else if (selectedType === "regex") {
                    keywordSection.style.display = "none";
                    regexSection.style.display = "block";
                } else {
                    keywordSection.style.display = "none";
                    regexSection.style.display = "none";
                }
            });
        }
        
        // 添加事件监听器
        // 添加 blur 事件监听器，自动格式化 JSON
        const headersElement = container.querySelector(".menu-headers") as HTMLTextAreaElement;
        if (headersElement) {
            headersElement.addEventListener("blur", (e) => {
                try {
                    const value = (e.target as HTMLTextAreaElement).value;
                    if (value) {
                        const parsed = JSON.parse(value);
                        const formatted = JSON.stringify(parsed, null, 2);
                        (e.target as HTMLTextAreaElement).value = formatted;
                    }
                } catch (error) {
                    // 格式无效，不进行格式化
                }
            });
        }
        
        const paramsElement = container.querySelector(".menu-params") as HTMLTextAreaElement;
        paramsElement.addEventListener("blur", (e) => {
            try {
                const value = (e.target as HTMLTextAreaElement).value;
                if (value) {
                    const parsed = JSON.parse(value);
                    const formatted = JSON.stringify(parsed, null, 2);
                    (e.target as HTMLTextAreaElement).value = formatted;
                }
            } catch (error) {
                // 格式无效，不进行格式化
            }
        });
        
        // 保存按钮事件
        const saveBtn = container.querySelector("#saveMenu");
        if (saveBtn) {
            saveBtn.addEventListener("click", async () => {
                try {
                    // 保存所有字段
                    this.updateMenuProperty(menu.id, "name", (container.querySelector(".menu-name") as HTMLInputElement).value);
                    this.updateMenuProperty(menu.id, "url", (container.querySelector(".menu-url") as HTMLInputElement).value);
                    this.updateMenuProperty(menu.id, "method", (container.querySelector(".menu-method") as HTMLSelectElement).value);
                    
                    try {
                        const headersValue = headersElement ? headersElement.value : "{}";
                        this.updateMenuProperty(menu.id, "headers", JSON.parse(headersValue));
                    } catch (error) {
                        showMessage("无效的 Headers JSON 格式");
                        return;
                    }
                    
                    try {
                        this.updateMenuProperty(menu.id, "params", JSON.parse((container.querySelector(".menu-params") as HTMLTextAreaElement).value));
                    } catch (error) {
                        showMessage("无效的 Params JSON 格式");
                        return;
                    }
                    
                    // 保存模板
                    const templateElement = container.querySelector(".menu-template") as HTMLTextAreaElement;
                    if (templateElement) {
                        this.updateMenuProperty(menu.id, "template", templateElement.value);
                    }
                    
                    // 处理匹配方式
                    const selectedMatchType = (container.querySelector(".menu-matchType") as HTMLSelectElement).value;
                    if (selectedMatchType === "keyword") {
                        this.updateMenuProperty(menu.id, "keyword", (container.querySelector(".menu-keyword") as HTMLInputElement).value);
                        this.updateMenuProperty(menu.id, "regex", "");
                    } else if (selectedMatchType === "regex") {
                        this.updateMenuProperty(menu.id, "regex", (container.querySelector(".menu-regex") as HTMLInputElement).value);
                        this.updateMenuProperty(menu.id, "keyword", "");
                    } else {
                        this.updateMenuProperty(menu.id, "keyword", "");
                        this.updateMenuProperty(menu.id, "regex", "");
                    }
                    
                    showMessage("接口配置已保存");
                    // 保存成功后，自动返回到接口列表
                    container.style.display = "none";
                } catch (error) {
                    showMessage("保存失败，请检查输入格式");
                }
            });
        }
        
        // 取消按钮事件
        const cancelBtn = container.querySelector("#cancelEdit");
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => {
                container.style.display = "none";
            });
        }
    }
    
    private async addNewMenu() {
        const menuId = `menu-${Date.now()}`;
        const newMenu = {
            id: menuId,
            name: "新接口",
            icon: "iconFace",
            url: "",
            method: "POST",
            headers: {},
            params: {},
            responseType: "json",
            template: "",
            keyword: "",
            regex: "",
            insertionMethod: "current"
        };
        
        if (!this.config) {
            this.config = {
                menus: [],
                defaultMenu: "",
                knowledge: []
            };
        }
        
        this.config.menus.push(newMenu);
        await this.saveConfig();
    }
    
    private async deleteMenu(menuId: string) {
        if (!this.config || !Array.isArray(this.config.menus)) {
            return;
        }
        
        this.config.menus = this.config.menus.filter(menu => menu.id !== menuId);
        await this.saveConfig();
    }
    
    private async exportMenus() {
        try {
            // 准备导出的数据
            const exportData = {
                version: "1.0",
                exportTime: new Date().toISOString(),
                menus: this.config.menus
            };
            
            // 将数据转换为 JSON 字符串
            const jsonString = JSON.stringify(exportData, null, 2);
            
            // 创建 Blob 对象
            const blob = new Blob([jsonString], { type: "application/json" });
            
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `click2fill-export-${new Date().toISOString().split("T")[0]}.json`;
            
            // 触发下载
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // 释放 URL 对象
            URL.revokeObjectURL(url);
            
            showMessage("接口配置导出成功");
        } catch (error) {
            console.error("导出接口失败:", error);
            showMessage("导出接口失败，请检查控制台错误");
        }
    }
    
    private async importMenus(dialog: any) {
        try {
            // 创建文件输入元素
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json";
            
            // 监听文件选择事件
            input.addEventListener("change", async (e) => {
                const target = e.target as HTMLInputElement;
                if (!target.files || target.files.length === 0) {
                    return;
                }
                
                const file = target.files[0];
                
                // 读取文件内容
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const result = event.target?.result as string;
                        const importData = JSON.parse(result);
                        
                        // 验证导入数据格式
                        if (!importData.menus || !Array.isArray(importData.menus)) {
                            showMessage("无效的导入文件格式，缺少 menus 数组");
                            return;
                        }
                        
                        // 导入菜单配置
                        // 为每个导入的菜单生成新的 ID，避免冲突
                        const importedMenus = importData.menus.map((menu: any) => ({
                            ...menu,
                            id: `menu-${Date.now()}-${Math.floor(Math.random() * 1000)}`
                        }));
                        
                        // 添加到当前配置
                        this.config.menus.push(...importedMenus);
                        await this.saveConfig();
                        
                        // 重新加载菜单列表
                        const menusList = dialog.element.querySelector("#menusList");
                        if (menusList) {
                            await this.loadMenusList(menusList, dialog);
                        }
                        
                        showMessage(`成功导入 ${importedMenus.length} 个接口配置`);
                    } catch (error) {
                        console.error("解析导入文件失败:", error);
                        showMessage("解析导入文件失败，请确保文件是有效的 JSON 格式");
                    }
                };
                reader.onerror = () => {
                    showMessage("读取文件失败");
                };
                reader.readAsText(file);
            });
            
            // 触发文件选择对话框
            input.click();
        } catch (error) {
            console.error("导入接口失败:", error);
            showMessage("导入接口失败，请检查控制台错误");
        }
    }
    
    private updateMenuProperty(menuId: string, property: string, value: any) {
        if (!this.config || !Array.isArray(this.config.menus)) {
            return;
        }
        
        const menu = this.config.menus.find(menu => menu.id === menuId);
        if (menu) {
            (menu as any)[property] = value;
            this.saveConfig().catch(error => {
                console.error("Failed to save menu property:", error);
            });
        }
    }
}