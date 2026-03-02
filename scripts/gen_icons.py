"""生成微信小程序 TabBar 图标（PNG格式，81x81px）"""
from PIL import Image, ImageDraw, ImageFont
import os

ICON_SIZE = 81
ICONS_DIR = r'd:\MYSOFTWAREOFtechnology\GeminiCliFile\项目\我要做规划\assets\icons'
os.makedirs(ICONS_DIR, exist_ok=True)

def draw_home(draw, color):
    # 房子图标
    c = ICON_SIZE // 2
    s = 28
    # 屋顶三角
    draw.polygon([(c, c-s), (c-s, c-2), (c+s, c-2)], fill=color)
    # 墙体
    draw.rectangle([(c-s+8, c-2), (c+s-8, c+s-4)], fill=color)
    # 门
    draw.rectangle([(c-6, c+8), (c+6, c+s-4)], fill='white')

def draw_calendar(draw, color):
    c = ICON_SIZE // 2
    s = 24
    # 日历主体
    draw.rounded_rectangle([(c-s, c-s+6), (c+s, c+s)], radius=4, fill=color)
    # 顶部条
    draw.rectangle([(c-s, c-s+6), (c+s, c-s+16)], fill=color)
    # 吊环
    draw.rectangle([(c-12, c-s), (c-8, c-s+10)], fill=color)
    draw.rectangle([(c+8, c-s), (c+12, c-s+10)], fill=color)
    # 内容区域
    draw.rectangle([(c-s+4, c-s+20), (c+s-4, c+s-4)], fill='white')
    # 网格点
    for i in range(3):
        for j in range(3):
            x = c - 14 + i * 14
            y = c - 2 + j * 10
            draw.rectangle([(x-3, y-2), (x+3, y+2)], fill=color)

def draw_ai(draw, color):
    c = ICON_SIZE // 2
    # 大脑/AI 闪电图标
    # 圆形背景
    draw.ellipse([(c-26, c-26), (c+26, c+26)], fill=color)
    # 闪电
    points = [(c-4, c-18), (c+10, c-2), (c+2, c-2), (c+6, c+18), (c-10, c+2), (c-2, c+2)]
    draw.polygon(points, fill='white')

def draw_stats(draw, color):
    c = ICON_SIZE // 2
    s = 24
    # 柱状图
    bar_w = 10
    bars = [
        (c-20, 16),
        (c-6, 28),
        (c+8, 22),
    ]
    for (x, h) in bars:
        draw.rounded_rectangle([(x, c+s-h), (x+bar_w, c+s)], radius=3, fill=color)
    # 趋势线
    draw.line([(c-24, c-4), (c-10, c-14), (c+4, c-8), (c+24, c-20)], fill=color, width=3)
    # 圆点
    for (px, py) in [(c-24, c-4), (c-10, c-14), (c+4, c-8), (c+24, c-20)]:
        draw.ellipse([(px-3, py-3), (px+3, py+3)], fill=color)

def draw_profile(draw, color):
    c = ICON_SIZE // 2
    # 头像
    draw.ellipse([(c-12, c-24), (c+12, c)], fill=color)
    # 身体
    draw.ellipse([(c-24, c+4), (c+24, c+36)], fill=color)

INACTIVE_COLOR = '#999999'
ACTIVE_COLOR = '#4F7CFF'

icon_draws = {
    'home': draw_home,
    'calendar': draw_calendar,
    'ai': draw_ai,
    'stats': draw_stats,
    'profile': draw_profile,
}

for name, draw_func in icon_draws.items():
    for suffix, color in [('', INACTIVE_COLOR), ('-active', ACTIVE_COLOR)]:
        img = Image.new('RGBA', (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        draw_func(draw, color)
        filepath = os.path.join(ICONS_DIR, f'{name}{suffix}.png')
        img.save(filepath)
        print(f'Created: {filepath}')

print('All icons generated!')
