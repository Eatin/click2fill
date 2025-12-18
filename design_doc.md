# Click2Fill 插件功能设计

## 1. 功能概述

Click2Fill 插件旨在帮助用户在软件开发过程中，通过简单的操作快速补充设计文档中的各种信息，如数据库表结构、API服务信息等。用户可以选中文本（如表名、服务名），点击插件图标，然后选择要补充的信息类型，插件会自动发起请求获取相关数据并插入到文档中。

## 2. 核心功能

### 2.1 文本选择与快速补充
- 用户选中文本（如表名、服务名）
- 点击工具栏图标或使用快捷键
- 选择要补充的信息类型（表结构、服务信息等）
- 插件自动发起请求获取数据并插入到文档中

### 2.2 动态菜单配置
- 用户可以自定义菜单选项（增加、编辑、删除）
- 每个菜单选项对应一个API请求配置
- 支持多种请求类型（GET、POST等）
- 支持自定义请求头和参数

### 2.3 配置管理
- 可视化配置界面
- 支持导入/导出配置
- 配置数据持久化存储

## 3. 系统架构

### 3.1 插件结构
```
click2fill/
├── src/
│   ├── index.ts          # 主入口文件
│   ├── index.scss        # 样式文件
│   ├── i18n/             # 国际化文件
│   │   ├── en_US.json
│   │   └── zh_CN.json
│   ├── components/       # 组件
│   │   ├── ConfigPanel.tsx  # 配置面板组件
│   │   └── MenuManager.tsx  # 菜单管理组件
│   └── utils/            # 工具函数
│       ├── api.ts        # API请求工具
│       └── storage.ts    # 存储工具
├── plugin.json           # 插件配置文件
└── design_doc.md         # 设计文档
```

### 3.2 核心模块

#### 3.2.1 菜单管理器 (MenuManager)
- 动态生成工具栏菜单
- 处理菜单点击事件
- 管理菜单配置

#### 3.2.2 配置面板 (ConfigPanel)
- 可视化配置界面
- 支持增加、编辑、删除配置项
- 导入/导出配置

#### 3.2.3 API请求工具 (api.ts)
- 封装HTTP请求
- 处理请求错误
- 格式化响应数据

#### 3.2.4 存储工具 (storage.ts)
- 持久化存储配置数据
- 读取配置数据
- 数据校验

## 4. 数据结构

### 4.1 配置数据结构
```typescript
interface MenuConfig {
    id: string;          // 唯一标识符
    name: string;        // 菜单名称
    icon: string;        // 菜单图标
    url: string;         // API地址
    method: string;      // 请求方法 (GET/POST)
    headers: Record<string, string>;  // 请求头
    params: Record<string, string>;   // 请求参数
    responseType: string;  // 响应类型 (json/markdown/plain)
    template: string;    // 数据插入模板
}

interface PluginConfig {
    menus: MenuConfig[];  // 菜单配置列表
    defaultMenu: string;  // 默认菜单ID
}
```

### 4.2 示例配置
```json
{
  "menus": [
    {
      "id": "table-structure",
      "name": "表结构",
      "icon": "iconTable",
      "url": "http://localhost:8080/api/table/{text}",
      "method": "GET",
      "headers": {
        "Content-Type": "application/json"
      },
      "params": {},
      "responseType": "markdown",
      "template": "### {name} 表结构\n\n{response}\n"
    },
    {
      "id": "api-info",
      "name": "API信息",
      "icon": "iconApi",
      "url": "http://localhost:8080/api/service/{text}",
      "method": "GET",
      "headers": {
        "Content-Type": "application/json"
      },
      "params": {},
      "responseType": "markdown",
      "template": "### {name} API信息\n\n{response}\n"
    }
  ],
  "defaultMenu": "table-structure"
}
```

## 5. 功能实现

### 5.1 工具栏集成

在 `updateProtyleToolbar` 方法中添加插件图标，点击后显示动态菜单：

```typescript
updateProtyleToolbar(toolbar: Array<string | IMenuItem>) {
    toolbar.push("|");
    toolbar.push({
        name: "click2fill",
        icon: "iconFill",
        hotkey: "⇧⌘F",
        tipPosition: "n",
        tip: this.i18n.click2fill,
        click: (protyle: Protyle) => {
            // 获取选中的文本
            const selectedText = window.getSelection().toString().trim();
            if (!selectedText) {
                showMessage(this.i18n.selectTextFirst);
                return;
            }
            // 显示动态菜单
            this.showDynamicMenu(protyle, selectedText);
        }
    });
    return toolbar;
}
```

### 5.2 动态菜单生成

```typescript
private showDynamicMenu(protyle: Protyle, selectedText: string) {
    const menu = new Menu("click2fill", () => {
        console.log("Menu closed");
    });
    
    // 从配置中加载菜单
    this.config.menus.forEach(menuConfig => {
        menu.addItem({
            id: menuConfig.id,
            iconHTML: `<svg><use xlink:href="#${menuConfig.icon}"></use></svg>`,
            label: menuConfig.name,
            click: () => {
                this.fillContent(protyle, selectedText, menuConfig);
            }
        });
    });
    
    // 添加配置菜单
    menu.addItem({
        iconHTML: "<svg><use xlink:href='#iconSettings'></use></svg>",
        label: this.i18n.configure,
        click: () => {
            this.openConfigPanel();
        }
    });
    
    // 显示菜单
    const rect = document.querySelector("#barPlugins").getBoundingClientRect();
    menu.open({x: rect.left, y: rect.bottom});
}
```

### 5.3 内容填充

```typescript
private async fillContent(protyle: Protyle, selectedText: string, menuConfig: MenuConfig) {
    try {
        // 构建请求URL（替换{text}占位符）
        const url = menuConfig.url.replace("{text}", encodeURIComponent(selectedText));
        
        // 发起请求
        const response = await this.apiRequest({
            url,
            method: menuConfig.method,
            headers: menuConfig.headers,
            params: menuConfig.params
        });
        
        // 格式化响应数据
        let formattedContent = response;
        if (menuConfig.responseType === "json") {
            formattedContent = this.formatJsonToMarkdown(response);
        }
        
        // 应用模板
        const content = menuConfig.template
            .replace("{name}", selectedText)
            .replace("{response}", formattedContent);
        
        // 插入到文档中
        protyle.insert(content);
        showMessage(this.i18n.contentInserted);
    } catch (error) {
        showMessage(`${this.i18n.requestFailed}: ${error.message}`);
    }
}
```

### 5.4 配置面板

```typescript
private openConfigPanel() {
    const dialog = new Dialog({
        title: this.i18n.configure,
        content: `<div id="click2fill-config"></div>`,
        width: "800px",
        height: "600px"
    });
    
    // 初始化配置面板组件
    const configPanel = new ConfigPanel({
        container: dialog.element.querySelector("#click2fill-config"),
        config: this.config,
        onSave: (newConfig) => {
            this.config = newConfig;
            this.saveConfig();
            dialog.destroy();
            showMessage(this.i18n.configSaved);
        },
        onCancel: () => {
            dialog.destroy();
        }
    });
    
    configPanel.render();
}
```

## 6. 用户界面

### 6.1 工具栏图标
- 位置：SiYuan 编辑器工具栏
- 图标：填充颜色的魔术棒图标
- 提示：点击补充选中文本的相关信息

### 6.2 动态菜单
- 显示用户配置的所有信息类型选项
- 每个选项显示图标和名称
- 底部包含配置选项

### 6.3 配置界面
- 菜单列表：显示所有配置的菜单
- 操作按钮：增加、编辑、删除
- 导入/导出按钮
- 表单：配置菜单的详细信息

## 7. 技术实现细节

### 7.1 数据持久化
- 使用 SiYuan 插件的 `saveData` 和 `loadData` API
- 配置数据以 JSON 格式存储

### 7.2 API请求
- 使用 SiYuan 提供的 `fetchPost` 和 `fetchGet` API
- 支持自定义请求头和参数
- 错误处理和重试机制

### 7.3 国际化支持
- 使用 SiYuan 插件的 i18n 机制
- 支持中英文切换

### 7.4 模板引擎
- 支持简单的模板替换（{name}, {response}）
- 支持自定义模板格式

## 8. 配置示例

### 8.1 数据库表结构配置
```json
{
  "id": "table-structure",
  "name": "表结构",
  "icon": "iconTable",
  "url": "http://localhost:3306/api/tables/{text}",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer token123"
  },
  "params": {},
  "responseType": "json",
  "template": "### {name} 表结构\n\n| 字段名 | 类型 | 长度 | 允许空 | 主键 | 描述 |\n| --- | --- | --- | --- | --- | --- |\n{{#each fields}}| {{name}} | {{type}} | {{length}} | {{nullable}} | {{primaryKey}} | {{description}} |\n{{/each}}\n"
}
```

### 8.2 API服务信息配置
```json
{
  "id": "api-service",
  "name": "API服务",
  "icon": "iconApi",
  "url": "http://localhost:8080/api/services/{text}",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer token123"
  },
  "params": {
    "format": "markdown"
  },
  "responseType": "markdown",
  "template": "### {name} API服务\n\n{response}\n"
}
```

## 9. 扩展功能

### 9.1 数据格式转换
- JSON 转 Markdown 表格
- 支持自定义转换器

### 9.2 批量操作
- 支持同时补充多个文本的信息
- 支持批量导入配置

### 9.3 快捷键支持
- 为每个菜单配置自定义快捷键
- 支持全局快捷键

### 9.4 模板市场
- 提供常用模板库
- 支持用户分享模板

## 10. 开发计划

### 阶段一：基础功能实现
- ✅ 插件框架搭建
- ✅ 文本选择与菜单显示
- ✅ 基本配置界面
- ✅ API请求与内容插入

### 阶段二：功能增强
- ⏳ 动态菜单配置
- ⏳ 高级模板支持
- ⏳ 数据格式转换
- ⏳ 快捷键支持

### 阶段三：扩展功能
- ⏳ 批量操作
- ⏳ 模板市场
- ⏳ 导入/导出配置

## 11. 注意事项

1. **安全性**：
   - API请求可能包含敏感信息，请确保配置的安全性
   - 建议使用HTTPS协议
   - 避免在配置中存储明文密码

2. **性能**：
   - 大量API请求可能影响性能
   - 建议添加请求缓存机制
   - 限制并发请求数量

3. **兼容性**：
   - 确保兼容不同版本的SiYuan
   - 支持不同的前端环境（桌面、移动端）

4. **用户体验**：
   - 提供清晰的错误提示
   - 操作过程中显示加载状态
   - 支持撤销操作

## 12. 总结

Click2Fill 插件通过简单的操作流程，帮助用户快速补充设计文档中的各种信息，提高开发效率。插件采用模块化设计，支持高度自定义，用户可以根据自己的需求配置各种信息补充选项。通过合理的架构设计和技术实现，插件具有良好的扩展性和维护性，为后续功能扩展打下了坚实的基础。