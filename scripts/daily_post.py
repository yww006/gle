#!/usr/bin/env python3
"""
每日自动生成文章脚本
用法：
  python scripts/daily_post.py                    # 生成今天的文章模板
  python scripts/daily_post.py --date 2025-01-20  # 生成指定日期的文章
  python scripts/daily_post.py --topic "Python异步编程" --category "技术"
"""

import argparse
import json
import os
import random
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).parent.parent
POSTS_DIR = ROOT / 'posts'
IMAGES_DIR = ROOT / 'images'

# 预设的背景图（Unsplash 精选）
BACKGROUND_IMAGES = [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',  # 星空
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1920&q=80',  # 山脉
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80',  # 森林
    'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=1920&q=80',  # 湖泊
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1920&q=80',  # 瀑布
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1920&q=80',  # 沙漠
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80',  # 极光
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80',  # 海岸
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80',  # 云海
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1920&q=80',  # 树林
]

CATEGORIES = ['技术', '读书', '生活', '思考', '项目', '随笔']

# 文章模板
TEMPLATES = {
    '技术': '''# {title}

> {subtitle}

## 背景

{background}

## 核心内容

### 要点 1

{point1}

### 要点 2

{point2}

### 要点 3

{point3}

## 代码示例

```python
# 示例代码
def example():
    pass
```

## 总结

{summary}

## 参考资料

- [链接 1](url)
- [链接 2](url)
''',
    '读书': '''# {title}

> {subtitle}

## 书籍信息

- **书名**：{book_title}
- **作者**：{author}
- **阅读进度**：{progress}

## 核心观点

{core_ideas}

## 金句摘录

> {quote1}

> {quote2}

## 个人感悟

{reflection}

## 行动计划

- [ ] 行动 1
- [ ] 行动 2
- [ ] 行动 3
''',
    '生活': '''# {title}

> {subtitle}

## 今日记录

{record}

## 感悟

{insight}

## 明天计划

- [ ] 计划 1
- [ ] 计划 2
- [ ] 计划 3
''',
    '思考': '''# {title}

> {subtitle}

## 触发点

{trigger}

## 思考过程

{thinking}

## 结论

{conclusion}

## 后续行动

{actions}
''',
    '项目': '''# {title}

> {subtitle}

## 项目进度

{progress}

## 今日完成

- 完成项 1
- 完成项 2

## 遇到的问题

{problems}

## 解决方案

{solutions}

## 下一步计划

{next_steps}
''',
}

DEFAULT_TEMPLATE = '''# {title}

> {subtitle}

## 正文

{content}

## 小结

{summary}
'''

def slugify(text):
    """生成 URL 友好的 slug"""
    import re
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def get_random_bg():
    return random.choice(BACKGROUND_IMAGES)

def load_index():
    index_path = POSTS_DIR / 'index.json'
    if index_path.exists():
        with open(index_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_index(posts):
    index_path = POSTS_DIR / 'index.json'
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)

def generate_post(date, topic=None, category=None):
    """生成文章"""
    date_str = date.strftime('%Y-%m-%d')
    weekday = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][date.weekday()]
    
    if not topic:
        topics = [
            '今天学到了什么新知识',
            '一个值得分享的技巧',
            '最近在思考的问题',
            '读书笔记分享',
            '项目进度更新',
            '生活中的小确幸',
        ]
        topic = random.choice(topics)
    
    if not category:
        category = random.choice(CATEGORIES)
    
    slug = slugify(f"{date_str}-{topic}")
    
    # 选择模板
    template = TEMPLATES.get(category, DEFAULT_TEMPLATE)
    
    # 生成内容
    content = template.format(
        title=topic,
        subtitle=f'{date_str} {weekday} · {category}',
        background='待补充背景...',
        point1='待补充要点 1...',
        point2='待补充要点 2...',
        point3='待补充要点 3...',
        summary='待补充总结...',
        book_title='待补充书名...',
        author='待补充作者...',
        progress='待补充进度...',
        core_ideas='待补充核心观点...',
        quote1='待补充金句...',
        quote2='待补充金句...',
        reflection='待补充感悟...',
        record='待补充记录...',
        insight='待补充感悟...',
        trigger='待补充触发点...',
        thinking='待补充思考过程...',
        conclusion='待补充结论...',
        actions='待补充行动...',
        progress='待补充进度...',
        problems='待补充问题...',
        solutions='待补充方案...',
        next_steps='待补充计划...',
    )
    
    # 计算阅读时间
    chinese_chars = len([c for c in content if '\u4e00' <= c <= '\u9fff'])
    english_words = len([w for w in content.split() if not ('\u4e00' <= w[0] <= '\u9fff' if w else False)])
    read_time = max(1, round((chinese_chars / 300 + english_words / 200)))
    
    post = {
        'slug': slug,
        'title': topic,
        'date': date_str,
        'category': category,
        'tags': [category, weekday],
        'coverImage': get_random_bg(),
        'excerpt': f'{date_str} {weekday} · {category} | {topic[:50]}...' if len(topic) > 50 else f'{date_str} {weekday} · {category} | {topic}',
        'readTime': read_time,
        'content': content,
    }
    
    # 保存文章 JSON
    post_path = POSTS_DIR / f'{slug}.json'
    with open(post_path, 'w', encoding='utf-8') as f:
        json.dump(post, f, ensure_ascii=False, indent=2)
    
    # 更新索引（插入到开头）
    posts = load_index()
    posts.insert(0, {
        'slug': slug,
        'title': topic,
        'date': date_str,
        'category': category,
        'tags': [category, weekday],
        'coverImage': post['coverImage'],
        'excerpt': post['excerpt'],
        'readTime': read_time,
    })
    save_index(posts)
    
    print(f"✅ 已生成文章: {slug}")
    print(f"   标题: {topic}")
    print(f"   分类: {category}")
    print(f"   日期: {date_str} {weekday}")
    print(f"   文件: {post_path}")
    
    return post

def main():
    parser = argparse.ArgumentParser(description='生成每日文章')
    parser.add_argument('--date', help='指定日期 (YYYY-MM-DD)，默认今天')
    parser.add_argument('--topic', help='文章主题')
    parser.add_argument('--category', choices=CATEGORIES, help='文章分类')
    parser.add_argument('--count', type=int, default=1, help='生成数量（用于补齐历史）')
    args = parser.parse_args()
    
    if args.date:
        base_date = datetime.strptime(args.date, '%Y-%m-%d')
    else:
        base_date = datetime.now()
    
    for i in range(args.count):
        date = base_date - timedelta(days=i)
        generate_post(date, args.topic, args.category)
    
    print(f"\n🎉 完成！共生成 {args.count} 篇文章")
    print("💡 运行 python scripts/build.py 构建站点预览")

if __name__ == '__main__':
    main()