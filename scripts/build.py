#!/usr/bin/env python3
"""
GLE 静态站点构建脚本
功能：
1. 读取 posts/index.json
2. 为每篇文章生成独立的 HTML 页面
3. 生成首页（已存在 index.html，由 JS 动态加载）
4. 生成归档页、标签页、RSS
"""

import json
import os
import shutil
from pathlib import Path
from datetime import datetime
from string import Template

ROOT = Path(__file__).parent.parent
POSTS_DIR = ROOT / 'posts'
ASSETS_DIR = ROOT / 'assets'
DIST_DIR = ROOT / 'dist'

BASE_HREF = '/gle/'

def load_posts_index():
    """加载文章索引"""
    index_path = POSTS_DIR / 'index.json'
    with open(index_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_post(slug):
    """加载单篇文章详情"""
    post_path = POSTS_DIR / f'{slug}.json'
    with open(post_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def read_template(path):
    """读取模板文件"""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def markdown_to_html(md):
    """简单的 Markdown 转 HTML（复用前端逻辑）"""
    import re
    html = md
    html = re.sub(r'^### (.*$)', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*$)', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^# (.*$)', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.+?)\*', r'<em>\1</em>', html)
    html = re.sub(r'`(.+?)`', r'<code>\1</code>', html)
    html = re.sub(r'```(\w+)?\n([\s\S]*?)```', r'<pre><code class="language-\1">\2</code></pre>', html)
    html = re.sub(r'^> (.*$)', r'<blockquote>\1</blockquote>', html, flags=re.MULTILINE)
    html = re.sub(r'^\- (.*$)', r'<li>\1</li>', html, flags=re.MULTILINE)
    html = re.sub(r'^\d+\. (.*$)', r'<li>\1</li>', html, flags=re.MULTILINE)
    html = re.sub(r'(<li>.*</li>)', r'<ul>\1</ul>', html, flags=re.DOTALL)
    html = re.sub(r'\[(.+?)\]\((.+?)\)', r'<a href="\2" target="_blank" rel="noopener">\1</a>', html)
    html = re.sub(r'!\[(.+?)\]\((.+?)\)', r'<img src="\2" alt="\1" loading="lazy">', html)
    html = re.sub(r'\n\n', '</p><p>', html)
    html = re.sub(r'^(.+)$', r'<p>\1</p>', html, flags=re.MULTILINE)
    html = re.sub(r'<p></p>', '', html)
    html = re.sub(r'<p>(<h[1-6]>)', r'\1', html)
    html = re.sub(r'(</h[1-6]>)<p>', r'\1', html)
    html = re.sub(r'<p>(<ul>)', r'\1', html)
    html = re.sub(r'(</ul>)<p>', r'\1', html)
    html = re.sub(r'<p>(<blockquote>)', r'\1', html)
    html = re.sub(r'(</blockquote>)<p>', r'\1', html)
    html = re.sub(r'<p>(<pre>)', r'\1', html)
    html = re.sub(r'(</pre>)<p>', r'\1', html)
    return html

def format_date(date_str, full=False):
    """格式化日期"""
    try:
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        if full:
            return dt.strftime('%Y年%B%d日 %A')
        return dt.strftime('%Y年%m月%d日')
    except:
        return date_str

def escape_html(s):
    """HTML 转义"""
    return str(s).replace('&', '&').replace('<', '<').replace('>', '>').replace('"', '"').replace("'", '')

def generate_article_page(post, template):
    """生成文章页面"""
    # 计算阅读时间（中文按 300 字/分钟，英文按 200 词/分钟）
    content = post.get('content', '')
    chinese_chars = len([c for c in content if '\u4e00' <= c <= '\u9fff'])
    english_words = len([w for w in content.split() if not ('\u4e00' <= w[0] <= '\u9fff' if w else False)])
    read_time = max(1, round((chinese_chars / 300 + english_words / 200)))
    
    tags_html = ''
    if post.get('tags'):
        tags_html = ''.join(
            f'<a href="?tag={escape_html(t)}" class="tag" style="text-decoration:none;">#{escape_html(t)}</a>'
            for t in post['tags']
        )
    
    article_html = post.get('html') or markdown_to_html(content)
    
    page = template.replace('{{TITLE}}', escape_html(post['title']))
    page = page.replace('{{DESCRIPTION}}', escape_html(post.get('excerpt', '')[:160]))
    page = page.replace('{{CATEGORY}}', escape_html(post.get('category', '随笔')))
    page = page.replace('{{ARTICLE_TITLE}}', escape_html(post['title']))
    page = page.replace('{{DATE}}', format_date(post['date'], full=True))
    page = page.replace('{{READ_TIME}}', str(read_time))
    page = page.replace('{{TAGS}}', tags_html)
    page = page.replace('{{CONTENT}}', article_html)
    page = page.replace('{{COVER_IMAGE}}', post.get('coverImage', ''))
    
    return page

def generate_archive_page(posts):
    """生成归档页"""
    # 按年月分组
    from collections import defaultdict
    grouped = defaultdict(list)
    for post in posts:
        try:
            dt = datetime.fromisoformat(post['date'].replace('Z', '+00:00'))
            key = dt.strftime('%Y年%m月')
        except:
            key = '未知'
        grouped[key].append(post)
    
    # 生成 HTML
    items = []
    for month in sorted(grouped.keys(), reverse=True):
        items.append(f'<h3 style="margin:32px 0 16px;color:var(--accent);border-bottom:1px solid var(--border);padding-bottom:8px;">{escape_html(month)}</h3>')
        items.append('<ul style="list-style:none;padding:0;">')
        for post in grouped[month]:
            date = format_date(post['date'])
            items.append(f'''
                <li style="padding:12px 0;border-bottom:1px solid var(--border);display:flex;gap:16px;align-items:center;">
                    <time style="min-width:100px;color:var(--text-muted);font-family:var(--font-mono);font-size:13px;">{date}</time>
                    <a href="posts/{escape_html(post['slug'])}.html" style="flex:1;font-weight:600;color:var(--text-primary);text-decoration:none;">{escape_html(post['title'])}</a>
                    <span style="color:var(--text-muted);font-size:12px;">{escape_html(post.get('category', '随笔'))}</span>
                </li>
            ''')
        items.append('</ul>')
    
    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>文章归档 · GLE</title>
<base href="{BASE_HREF}" />
<link rel="stylesheet" href="assets/css/style.css" />
</head>
<body>
<div class="bg-layer"></div>
<div class="particles"></div>
<header class="header">
  <a href="./" class="logo">GLE<span class="logo-sub">Personal Knowledge Base</span></a>
  <nav class="nav">
    <a href="./" class="nav-link">首页</a>
    <a href="archive.html" class="nav-link active">归档</a>
    <a href="tags.html" class="nav-link">标签</a>
    <a href="about.html" class="nav-link">关于</a>
  </nav>
</header>
<main class="main">
  <header style="text-align:center;padding:60px 20px;">
    <h1 style="font-size:40px;font-weight:900;margin-bottom:12px;background:linear-gradient(135deg,#fff,var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;">文章归档</h1>
    <p style="color:var(--text-secondary);font-size:18px;">共 {len(posts)} 篇文章，按时间倒序排列</p>
  </header>
  <div style="max-width:800px;margin:0 auto;padding:0 20px 80px;">
    {''.join(items)}
  </div>
</main>
<footer class="footer"><p>© 2025 GLE</p></footer>
<script src="assets/js/main.js"></script>
</body>
</html>'''
    
    return html

def generate_tags_page(posts):
    """生成标签页"""
    from collections import Counter
    all_tags = []
    for post in posts:
        all_tags.extend(post.get('tags', []))
    tag_counts = Counter(all_tags)
    
    tags_html = []
    for tag, count in tag_counts.most_common():
        tags_html.append(f'''
            <a href="?tag={escape_html(tag)}" class="tag" style="font-size:14px;padding:8px 16px;text-decoration:none;display:inline-flex;align-items:center;gap:8px;">
                #{escape_html(tag)} <span style="background:var(--bg-primary);padding:2px 8px;border-radius:100px;font-size:12px;">{count}</span>
            </a>
        ''')
    
    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>标签 · GLE</title>
<base href="{BASE_HREF}" />
<link rel="stylesheet" href="assets/css/style.css" />
</head>
<body>
<div class="bg-layer"></div>
<div class="particles"></div>
<header class="header">
  <a href="./" class="logo">GLE<span class="logo-sub">Personal Knowledge Base</span></a>
  <nav class="nav">
    <a href="./" class="nav-link">首页</a>
    <a href="archive.html" class="nav-link">归档</a>
    <a href="tags.html" class="nav-link active">标签</a>
    <a href="about.html" class="nav-link">关于</a>
  </nav>
</header>
<main class="main">
  <header style="text-align:center;padding:60px 20px;">
    <h1 style="font-size:40px;font-weight:900;margin-bottom:12px;background:linear-gradient(135deg,#fff,var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;">标签云</h1>
    <p style="color:var(--text-secondary);font-size:18px;">共 {len(tag_counts)} 个标签</p>
  </header>
  <div style="max-width:800px;margin:0 auto;padding:0 20px 80px;text-align:center;">
    <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;">
      {''.join(tags_html)}
    </div>
  </div>
</main>
<footer class="footer"><p>© 2025 GLE</p></footer>
<script src="assets/js/main.js"></script>
</body>
</html>'''
    
    return html

def generate_rss(posts):
    """生成 RSS 订阅"""
    items = []
    for post in posts[:20]:  # 只包含最新 20 篇
        dt = datetime.fromisoformat(post['date'].replace('Z', '+00:00'))
        pub_date = dt.strftime('%a, %d %b %Y %H:%M:%S %z')
        link = f"https://yww006.github.io/gle/posts/{post['slug']}.html"
        description = escape_html(post.get('excerpt', post.get('content', '')[:200]))
        
        items.append(f'''    <item>
      <title>{escape_html(post['title'])}</title>
      <link>{link}</link>
      <guid>{link}</guid>
      <pubDate>{pub_date}</pubDate>
      <description><![CDATA[{description}]]></description>
    </item>''')
    
    rss = f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>GLE 个人知识库</title>
    <link>https://yww006.github.io/gle/</link>
    <description>每日一篇，记录成长。技术、思考、生活。</description>
    <language>zh-CN</language>
    <lastBuildDate>{datetime.now().strftime('%a, %d %b %Y %H:%M:%S %z')}</lastBuildDate>
    <atom:link href="https://yww006.github.io/gle/rss.xml" rel="self" type="application/rss+xml"/>
{''.join(items)}
  </channel>
</rss>'''
    
    return rss

def copy_assets():
    """复制静态资源到 dist"""
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir(parents=True)
    
    # 复制 assets
    shutil.copytree(ASSETS_DIR, DIST_DIR / 'assets')
    
    # 复制 posts JSON 文件（用于前端动态加载）
    shutil.copytree(POSTS_DIR, DIST_DIR / 'posts')

def main():
    print("🚀 开始构建 GLE 静态站点...")
    
    # 1. 加载文章索引
    posts = load_posts_index()
    print(f"📚 共 {len(posts)} 篇文章")
    
    # 2. 读取文章模板
    article_template = read_template(POSTS_DIR / 'article.html')
    
    # 3. 复制静态资源
    copy_assets()
    print("📦 静态资源已复制")
    
    # 4. 生成每篇文章的 HTML 页面
    posts_dist = DIST_DIR / 'posts'
    for post_meta in posts:
        post = load_post(post_meta['slug'])
        html = generate_article_page(post, article_template)
        output_path = posts_dist / f"{post['slug']}.html"
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html)
    print(f"📝 生成了 {len(posts)} 篇文章页面")
    
    # 5. 生成归档页
    archive_html = generate_archive_page(posts)
    with open(DIST_DIR / 'archive.html', 'w', encoding='utf-8') as f:
        f.write(archive_html)
    print("📁 生成归档页")
    
    # 6. 生成标签页
    tags_html = generate_tags_page(posts)
    with open(DIST_DIR / 'tags.html', 'w', encoding='utf-8') as f:
        f.write(tags_html)
    print("🏷️ 生成标签页")
    
    # 7. 生成 RSS
    rss = generate_rss(posts)
    with open(DIST_DIR / 'rss.xml', 'w', encoding='utf-8') as f:
        f.write(rss)
    print("📡 生成 RSS 订阅")
    
    # 8. 复制首页
    shutil.copy2(ROOT / 'index.html', DIST_DIR / 'index.html')
    print("🏠 首页已复制")
    
    # 9. 生成 about 页
    about_html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>关于 · GLE</title>
<base href="{BASE_HREF}" />
<link rel="stylesheet" href="assets/css/style.css" />
</head>
<body>
<div class="bg-layer"></div>
<div class="particles"></div>
<header class="header">
  <a href="./" class="logo">GLE<span class="logo-sub">Personal Knowledge Base</span></a>
  <nav class="nav">
    <a href="./" class="nav-link">首页</a>
    <a href="archive.html" class="nav-link">归档</a>
    <a href="tags.html" class="nav-link">标签</a>
    <a href="about.html" class="nav-link active">关于</a>
  </nav>
</header>
<main class="main">
  <article class="article-body" style="max-width:800px;margin:0 auto;padding:40px 20px 80px;">
    <h1 style="font-size:36px;font-weight:900;margin-bottom:24px;text-align:center;">关于 GLE</h1>
    <p style="font-size:18px;color:var(--text-secondary);text-align:center;margin-bottom:40px;">每日一篇，记录成长</p>
    
    <h2>📖 这是什么？</h2>
    <p>GLE 是一个个人知识库，采用「每日一篇」的节奏更新。这里记录技术笔记、读书心得、生活感悟、项目复盘——凡是值得记住的，都会在这里留下痕迹。</p>
    
    <h2>🎯 设计初衷</h2>
    <ul>
      <li><strong>强制输出</strong>：写作是最好的思考方式，逼自己理清思路</li>
      <li><strong>长期复利</strong>：知识像利息一样复利增长，时间是朋友</li>
      <li><strong>留存痕迹</strong>：翻看旧文，能看到清晰的成长曲线</li>
    </ul>
    
    <h2>⚙️ 技术栈</h2>
    <ul>
      <li>纯静态站点：HTML + CSS + JavaScript（无框架，零依赖）</li>
      <li>部署：GitHub Pages（免费、免维护、全球 CDN）</li>
      <li>自动化：GitHub Actions 定时构建（每天 UTC 0:00）</li>
      <li>背景图：Unsplash Source（高质量、免版权）</li>
      <li>源码托管：GitHub（版本控制、Issue 追踪）</li>
    </ul>
    
    <h2>📬 联系方式</h2>
    <p>GitHub: <a href="https://github.com/yww006" target="_blank" rel="noopener">@yww006</a></p>
    <p>仓库: <a href="https://github.com/yww006/gle" target="_blank" rel="noopener">yww006/gle</a></p>
    
    <hr style="margin:40px 0;border-color:var(--border);" />
    <p style="text-align:center;color:var(--text-muted);font-size:14px;">© 2025 GLE · 个人知识库 · 由 <a href="https://pages.github.com/" target="_blank" rel="noopener">GitHub Pages</a> 强力驱动</p>
  </article>
</main>
<footer class="footer"><p>© 2025 GLE</p></footer>
<script src="assets/js/main.js"></script>
</body>
</html>'''
    with open(DIST_DIR / 'about.html', 'w', encoding='utf-8') as f:
        f.write(about_html)
    print("ℹ️ 生成关于页")
    
    print("\n✅ 构建完成！输出目录: dist/")
    print("🌐 本地预览: cd dist && python3 -m http.server 8080")

if __name__ == '__main__':
    main()