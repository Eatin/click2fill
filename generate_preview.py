#!/usr/bin/env python3
"""
Generate a preview image for Click2Fill plugin
Requirements: 1024x768, <200KB, PNG format
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import textwrap
import math

def create_preview():
    # Create image with 1024x768 dimensions
    width, height = 1024, 768
    
    # Create gradient background for better design
    image = Image.new('RGB', (width, height), color='#ffffff')
    draw = ImageDraw.Draw(image)
    
    # Draw gradient background
    for y in range(height):
        r = int(255 - (y / height) * 20)
        g = int(255 - (y / height) * 20)
        b = int(255 - (y / height) * 40)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Try different fonts with fallbacks (prioritize Chinese-compatible fonts)
    try:
        title_font = ImageFont.truetype('PingFang SC', 48)
        subtitle_font = ImageFont.truetype('PingFang SC', 32)
        text_font = ImageFont.truetype('PingFang SC', 24)
        feature_font = ImageFont.truetype('PingFang SC', 20)
    except IOError:
        try:
            title_font = ImageFont.truetype('/System/Library/Fonts/PingFang.ttc', 48)
            subtitle_font = ImageFont.truetype('/System/Library/Fonts/PingFang.ttc', 32)
            text_font = ImageFont.truetype('/System/Library/Fonts/PingFang.ttc', 24)
            feature_font = ImageFont.truetype('/System/Library/Fonts/PingFang.ttc', 20)
        except IOError:
            try:
                title_font = ImageFont.truetype('Arial Unicode MS', 48)
                subtitle_font = ImageFont.truetype('Arial Unicode MS', 32)
                text_font = ImageFont.truetype('Arial Unicode MS', 24)
                feature_font = ImageFont.truetype('Arial Unicode MS', 20)
            except IOError:
                # Use default font if none are available
                title_font = ImageFont.load_default()
                subtitle_font = ImageFont.load_default()
                text_font = ImageFont.load_default()
                feature_font = ImageFont.load_default()
    
    # Draw plugin title
    title = "Click2Fill"
    bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width, title_height = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((width - title_width) // 2, 50), title, font=title_font, fill='#2c3e50')
    
    # Draw subtitle
    subtitle = "文本填充助手"
    bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
    subtitle_width, subtitle_height = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((width - subtitle_width) // 2, 120), subtitle, font=subtitle_font, fill='#34495e')
    
    # Draw separator line
    draw.line([(width//4, 200), (width*3//4, 200)], fill='#bdc3c7', width=2)
    
    # Draw main feature description
    main_text = "Select text, send to API, automatically append response to your document"
    lines = textwrap.wrap(main_text, width=60)
    y_text = 250
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=text_font)
        line_width, line_height = bbox[2] - bbox[0], bbox[3] - bbox[1]
        draw.text(((width - line_width) // 2, y_text), line, font=text_font, fill='#555555')
        y_text += line_height + 10
    
    # Draw feature list with better icons (no numbers)
    features = [
        "文本选择: 在文档中选择任意文本",
        "API 集成: 发送到自定义 API 端点",
        "动态菜单: 支持多个 API 端点和自定义名称",
        "快捷键: 使用 Shift+Command+I 快速访问",
        "内容追加: 结果自动添加到所选文本之后",
        "URL 验证: 自动添加协议前缀"
    ]
    
    y_features = 400
    feature_icon_size = 40
    feature_spacing = 70
    
    # Icon styles (using different shapes and colors)
    icon_styles = [
        ('\u270e', '#3498db'),  # Pencil icon
        ('\u2192', '#e74c3c'),   # Right arrow
        ('\u2630', '#2ecc71'),   # Menu icon
        ('\u2328', '#f39c12'),   # Keyboard icon
        ('\u2795', '#9b59b6'),   # Plus icon
        ('\u1f4c1', '#1abc9c')   # Document icon
    ]
    
    for i, feature in enumerate(features):
        # Draw icon (using Unicode symbols instead of numbers)
        icon_x = 150
        icon_y = y_features + i * feature_spacing
        
        # Draw icon background
        draw.rounded_rectangle([icon_x, icon_y, icon_x + feature_icon_size, icon_y + feature_icon_size], 
                             radius=8, fill=icon_styles[i][1])
        
        # Draw icon symbol
        icon_font = ImageFont.truetype('Arial Unicode MS', 28) if 'Arial Unicode MS' in str(title_font) else text_font
        bbox = draw.textbbox((0, 0), icon_styles[i][0], font=icon_font)
        symbol_width, symbol_height = bbox[2] - bbox[0], bbox[3] - bbox[1]
        symbol_x = icon_x + (feature_icon_size - symbol_width) // 2
        symbol_y = icon_y + (feature_icon_size - symbol_height) // 2
        draw.text((symbol_x, symbol_y), icon_styles[i][0], font=icon_font, fill='#ffffff')
        
        # Draw feature text with better styling
        text_x = 220
        text_y = icon_y + 5
        feature_lines = textwrap.wrap(feature, width=70)
        
        for j, feature_line in enumerate(feature_lines):
            draw.text((text_x, text_y + j * 25), feature_line, font=feature_font, fill='#2c3e50')
    
    # Draw improved keyboard shortcut illustration
    shortcut_box = [(width - 700) // 2, height - 220, (width + 700) // 2, height - 80]
    
    # Draw rounded rectangle with shadow effect
    shadow_offset = 5
    draw.rounded_rectangle([shortcut_box[0] + shadow_offset, shortcut_box[1] + shadow_offset, 
                           shortcut_box[2] + shadow_offset, shortcut_box[3] + shadow_offset], 
                          radius=15, fill='#dddddd')
    draw.rounded_rectangle(shortcut_box, radius=15, fill='#ffffff')
    draw.rounded_rectangle(shortcut_box, radius=15, outline='#3498db', width=3)
    
    shortcut_text = "✨ 快捷键: Shift + Command + I ✨"
    bbox = draw.textbbox((0, 0), shortcut_text, font=text_font)
    shortcut_width, shortcut_height = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((width - shortcut_width) // 2, height - 160), shortcut_text, font=text_font, fill='#e74c3c')
    
    # Save the image with compression to ensure file size <200KB
    image.save('preview_new.png', format='PNG', optimize=True, quality=80)
    
    print("Preview image generated: preview_new.png")
    print(f"Dimensions: {image.width}x{image.height}")

if __name__ == "__main__":
    create_preview()