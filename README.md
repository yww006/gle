# GLE · 个人知识库

> 每日一篇，记录成长。技术、思考、生活。

![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Last Commit](https://img.shields.io/github/last-commit/yww006/gle)

## ✨ 特性

- 📝 **每日一篇** —— GitHub Actions 定时触发，自动生成文章模板
- 🎨 **每日换肤** —— 首页背景图每 30 秒自动切换（Unsplash 高清大图）
- ⚡ **零依赖** —— 纯 HTML/CSS/JS，无框架，首屏 < 50KB
- 📱 **响应式** —— 手机、平板、桌面完美适配
- 🔍 **全文检索** —— 支持标签筛选、归档浏览、RSS 订阅
- 🌙 **深色主题** —— 护眼配色，代码高亮，打印友好
- 🚀 **免费部署** —— GitHub Pages + Actions，零成本

## 📁 项目结构

```
gle/
├── index.html              # 首页（动态加载文章列表）
├── archive.html            # 文章归档页（构建时生成）
├── tags.html               # 标签云页（构建时生成）
├── about.html              # 关于页
├── rss.xml                 # RSS 订阅（构建时生成）
├── assets/
│   ├── css/style.css       # 样式表
│   └── js/main.js          # 核心脚本（背景轮播、文章加载、粒子特效）
├── posts/
│   ├── index.json          # 文章索引（标题、日期、标签、摘要）
│   ├── *.json              # 单篇文章详情（含完整内容）
│   └── article.html        # 文章页模板
├── scripts/
│   ├── build.py            # 静态站点构建脚本
│   ├── daily_post.py       # 每日文章生成脚本
│   └── requirements.txt    # Python 依赖
└── .github/workflows/
    └── deploy.yml          # GitHub Actions 部署流程
```

## 🚀 快速开始

### 1. 克隆并配置

```bash
git clone https://github.com/yww006/gle.git
cd gle
```

### 2. 本地预览

```bash
# 构建站点
python scripts/build.py

# 启动本地服务器
cd dist && python -m http.server 8080
# 打开 http://localhost:8080
```

### 3. 生成新文章

```bash
# 生成今天的文章（交互式填写主题/分类）
python scripts/daily_post.py

# 指定主题和分类
python scripts/daily_post.py --topic "Python异步编程实战" --category 技术

# 补齐历史文章（最近 7 天）
python scripts/daily_post.py --count 7
```

### 4. 部署到 GitHub Pages

1. 仓库 Settings → Pages → Source 选择 "GitHub Actions"
2. 推送到 main 分支，或手动触发 Actions
3. 访问 `https://yww006.github.io/gle/`

## ⚙️ 自动化流程

### 每日自动更新 (`.github/workflows/deploy.yml`)

- **触发时间**：每天 UTC 0:00（北京时间 8:00）
- **执行步骤**：
  1. Checkout 代码
  2. 运行 `scripts/daily_post.py` 生成今日文章模板
  3. 运行 `scripts/build.py` 构建静态站点
  4. 部署到 GitHub Pages

### 手动触发

- Actions 标签页 → Daily Build & Deploy → Run workflow
- 或推送到 main 分支

## 🎨 自定义配置

### 修改背景图

编辑 `assets/js/main.js` 中的 `CONFIG.backgroundImages` 数组：

```js
backgroundImages: [
  'https://your-image-url-1.jpg',
  'https://your-image-url-2.jpg',
  // ...
]
```

### 调整主题色

编辑 `assets/css/style.css` 中的 CSS 变量：

```css
:root {
  --accent: #ffd740;        // 主题色（金色）
  --bg-primary: #0f0f12;    // 主背景
  --bg-secondary: #1a1a20;  // 次背景
  // ...
}
```

### 修改站点信息

- `index.html`：站点标题、描述、Hero 区文案
- `about.html`：关于页面内容
- `scripts/build.py`：RSS 链接、站点 URL

## 📝 文章格式

每篇文章为一个 JSON 文件（`posts/xxx.json`）：

```json
{
  "slug": "article-slug",
  "title": "文章标题",
  "date": "2025-01-15",
  "category": "技术",
  "tags": ["Python", "异步", "教程"],
  "coverImage": "https://images.unsplash.com/...",
  "excerpt": "文章摘要，首页卡片显示",
  "readTime": 5,
  "content": "# Markdown 内容\n\n正文...",
  "html": "<h1>预渲染 HTML（可选）</h1>"
}
```

- `content`：Markdown 源码，构建时转 HTML
- `html`：可选，预渲染的 HTML，优先使用

## 🛠️ 开发指南

### 添加新页面

1. 在根目录创建 `new-page.html`
2. 引用 `assets/css/style.css` 和 `assets/js/main.js`
3. 在 `scripts/build.py` 中添加复制逻辑

### 扩展构建脚本

`scripts/build.py` 使用纯标准库，可直接修改：
- `generate_archive_page()`：自定义归档页
- `generate_tags_page()`：自定义标签页
- `generate_rss()`：自定义 RSS 格式
- `markdown_to_html()`：增强 Markdown 支持

### 本地开发调试

```bash
# 监听文件变化自动重建（需安装 entr）
ls *.html assets/** posts/** | entr -r python scripts/build.py
```

## 📄 许可证

MIT License - 可自由使用、修改、分发

## 🙏 致谢

- [Unsplash](https://unsplash.com) 提供精美背景图
- [GitHub Pages](https://pages.github.com) 提供免费托管
- [GitHub Actions](https://github.com/features/actions) 提供自动化 CI/CD

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/yww006">yww006</a></sub>
</div>