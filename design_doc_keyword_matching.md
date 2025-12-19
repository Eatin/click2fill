# Click2Fill 关键字/正则表达式匹配菜单设计

## 1. 功能需求

随着用户配置的菜单越来越多，选择合适的菜单变得越来越麻烦。因此，需要实现一个功能，根据用户选中文字的关键字或正则表达式匹配来显示对应的菜单，而不是显示所有菜单。

## 2. 设计思路

### 2.1 核心功能

1. **菜单匹配规则**：为每个菜单添加关键字和正则表达式字段
2. **智能菜单过滤**：根据选中文字自动过滤匹配的菜单
3. **灵活配置**：用户可以为每个菜单配置关键字、正则表达式或两者都配置
4. **优先级处理**：正则表达式匹配优先级高于关键字匹配
5. **默认显示**：如果没有匹配的菜单，显示所有菜单或提示用户

### 2.2 技术实现

1. **修改 MenuConfig 接口**：添加 `keyword` 和 `regex` 字段
2. **更新菜单配置面板**：添加关键字和正则表达式输入框
3. **优化 showDynamicMenu 方法**：实现菜单匹配逻辑
4. **更新国际化文件**：添加新字段的翻译

## 3. 详细设计

### 3.1 数据结构修改

修改 `MenuConfig` 接口，添加两个新字段：

```typescript
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
    keyword?: string; // 新增：关键字匹配
    regex?: string; // 新增：正则表达式匹配
}
```

### 3.2 菜单匹配逻辑

在 `showDynamicMenu` 方法中实现菜单匹配逻辑：

1. 获取选中文字
2. 遍历所有菜单，检查是否匹配
3. 匹配规则：
   - 如果菜单配置了正则表达式，使用正则表达式匹配
   - 如果菜单配置了关键字，使用关键字匹配
   - 如果两者都配置，正则表达式匹配优先
   - 如果两者都不配置，默认匹配
4. 只显示匹配的菜单
5. 如果没有匹配的菜单，显示所有菜单

### 3.3 配置面板更新

在菜单编辑对话框中添加关键字和正则表达式输入框：

```html
<div class="plugin-click2fill__form-item">
    <label>${this.i18n.keyword}</label>
    <input type="text" id="plugin-click2fill__menu-keyword" class="b3-text-field" value="${menu?.keyword || ""}" placeholder="${this.i18n.keywordPlaceholder}">
</div>
<div class="plugin-click2fill__form-item">
    <label>${this.i18n.regex}</label>
    <input type="text" id="plugin-click2fill__menu-regex" class="b3-text-field" value="${menu?.regex || ""}" placeholder="${this.i18n.regexPlaceholder}">
</div>
```

### 3.4 国际化更新

在 `en_US.json` 和 `zh_CN.json` 中添加新字段的翻译：

```json
{
    "keyword": "Keyword",
    "regex": "Regular Expression",
    "keywordPlaceholder": "Separate multiple keywords with commas",
    "regexPlaceholder": "JavaScript regular expression pattern"
}
```

## 4. 实现步骤

1. 修改 `src/index.ts` 中的 `MenuConfig` 接口
2. 更新 `showDynamicMenu` 方法，实现菜单匹配逻辑
3. 修改 `openMenuEditDialog` 方法，添加关键字和正则表达式输入框
4. 修改 `saveMenu` 方法，保存关键字和正则表达式
5. 更新国际化文件
6. 测试功能

## 5. 预期效果

1. 用户可以为每个菜单配置关键字和正则表达式
2. 当用户选中文字时，只有匹配的菜单会显示
3. 匹配逻辑优先使用正则表达式，然后是关键字
4. 如果没有匹配的菜单，显示所有菜单
5. 配置面板中可以方便地配置关键字和正则表达式

## 6. 兼容性考虑

1. 向后兼容：现有菜单配置无需修改，默认匹配所有文字
2. 正则表达式语法：使用 JavaScript 正则表达式语法，需要提供清晰的提示
3. 关键字匹配：支持逗号分隔的多个关键字

## 7. 代码优化

1. 提取匹配逻辑为单独的方法，提高代码可维护性
2. 添加正则表达式验证，避免无效的正则表达式
3. 优化匹配算法，提高性能

## 8. 测试用例

1. 测试关键字匹配：配置菜单关键字为 "test"，选中文字包含 "test" 时显示该菜单
2. 测试正则表达式匹配：配置菜单正则表达式为 "^test"，选中文字以 "test" 开头时显示该菜单
3. 测试两者都配置：正则表达式匹配优先
4. 测试没有匹配的菜单：显示所有菜单
5. 测试多个关键字：使用逗号分隔的多个关键字

## 9. 未来扩展

1. 支持更复杂的匹配规则，如 AND/OR 逻辑
2. 支持匹配模式选择（如精确匹配、模糊匹配）
3. 支持菜单分组，同一组内的菜单共享匹配规则
4. 添加匹配规则测试功能，让用户可以测试匹配效果

## 10. 总结

通过实现关键字和正则表达式匹配菜单功能，可以让用户在配置大量菜单时，更快速地找到合适的菜单，提高插件的使用效率和用户体验。该设计方案考虑了向后兼容性、灵活性和易用性，能够满足用户的需求。