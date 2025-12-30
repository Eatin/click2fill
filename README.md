[中文](https://github.com/Eatin/click2fill/blob/main/README_zh_CN.md)

# Click2Fill

## Overview

Click2Fill is a powerful plugin for SiYuan that allows you to select text, send it to a configured API endpoint, and automatically append the response to your document.

## Features

* **Text Selection**: Select any text in your document
* **API Integration**: Send selected text to custom API endpoints
* **Dynamic Menus**: Configure multiple API endpoints with custom names and icons
* **Smart Menu Display**: Only shows relevant menus based on selected text, solving the problem of too many configurations being displayed
* **Keyboard Shortcut**: Quick access using `⇧⌘I` (Shift+Command+I)
* **Append Content**: Results are added after selected text, not replacing it
* **URL Validation**: Automatic protocol prefix addition for URLs
* **Custom Templates**: Format API responses using simple templates
* **Menu Display Methods**: Choose to always display, or only show based on keyword/regex matching
* **Advanced Settings Panel**: Headers and params configuration in collapsible advanced section
* **API Request Result Rendering**: Customize how API responses are formatted
* **Default Template Values**: Pre-configured templates for quick setup
* **Placeholder Support**: Use `${selectText}` in request parameters to include selected text
* **Default Request Method**: POST method set as default for better compatibility
* **Simplified Request Methods**: Only GET and POST options for easier configuration
* **Subdocument Insertion**: Option to insert API responses into newly created "配套知识" (Supplementary Knowledge) subdocuments
* **Smart Subdocument Rendering**: Template support for subdocuments without duplicate rendering
* **Robust Reference Association**: Reliable subdocument reference linking even with async delays

## Installation

1. Download the plugin from the SiYuan marketplace
2. Enable the plugin in the marketplace settings
3. Configure your API endpoints (see Configuration section)

## Usage

1. Select text in your document
2. Press `⇧⌘I` (Shift+Command+I)
3. Choose the API endpoint from the dynamic menu
4. The API response will be automatically appended to your selected text

## Configuration

1. Select text in your document
2. Press `⇧⌘I` (Shift+Command+I)
3. Click the "Configure" option in the menu
4. Add API endpoints with:
   - **Name**: Menu item display name
   - **Icon**: Icon ID from SiYuan's icon set
   - **URL**: API endpoint URL
   - **Method**: HTTP method (GET/POST)
   - **Headers**: Custom headers (JSON format)
   - **Params**: Custom parameters (JSON format)
   - **Response Type**: How to parse the response
   - **Template**: Optional template for formatting response

## Development

### Prerequisites

* Node.js (v16+)
* pnpm
* SiYuan (v3.1.3+)

### Setup

1. Clone the repository to your local machine
2. Navigate to the project directory
3. Install dependencies: `pnpm i`
4. Start development server: `pnpm run dev`
5. The plugin will be compiled and ready for use in SiYuan

### Build for Production

```bash
pnpm run build
```

### Project Structure

```
click2fill/
├── src/
│   ├── i18n/            # Internationalization files
│   │   ├── en_US.json
│   │   └── zh_CN.json
│   ├── index.scss       # Plugin styles
│   └── index.ts         # Main plugin logic
├── icon.png             # Plugin icon (160*160)
├── plugin.json          # Plugin configuration
├── README.md            # English documentation
├── README_zh_CN.md      # Chinese documentation
└── CHANGELOG.md         # Version history
```

## Keyboard Shortcut

* **Open Click2Fill menu**: `⇧⌘I` (Shift+Command+I)

## Examples

### Basic Usage

1. Select text: "Get weather for New York"
2. Open Click2Fill menu
3. Choose your weather API endpoint
4. Result is appended: "Get weather for New York
Temperature: 22°C, Conditions: Sunny"

### Using Templates

If you configure a template like:
```
Temperature: ${temp}°C, Conditions: ${conditions}
```

And your API returns:
```json
{"temp": 22, "conditions": "Sunny"}
```

The result will be formatted as:
```
Temperature: 22°C, Conditions: Sunny
```

## Troubleshooting

### API Requests Fail

1. Check your API URL configuration
2. Ensure URL has proper protocol (http:// or https://)
3. Verify API endpoint is accessible
4. Check browser console for detailed error messages

### Menu Doesn't Appear

1. Ensure text is selected before pressing the shortcut
2. Check plugin is enabled in SiYuan marketplace
3. Verify keyboard shortcut is not conflicting

## Changelog

See [CHANGELOG.md](https://github.com/Eatin/click2fill/blob/main/CHANGELOG.md) for version history.

## License

MIT License