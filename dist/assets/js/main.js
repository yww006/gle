/**
 * GLE 个人知识库 - 核心脚本 v2.0
 * 功能：主题切换、文章加载/筛选/排序、背景图切换、粒子效果、精选文章、每日一句、分类导航、标签云、热门阅读、JSON-LD
 */

(function() {
  'use strict';

  // ===== 配置 =====
  const CONFIG = {
    postsPerPage: 10,
    backgroundImages: [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1920&q=80',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80',
      'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=1920&q=80',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1920&q=80',
      'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1920&q=80',
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1920&q=80',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80',
    ],
    particleCount: 30,
    bgChangeInterval: 30000,
    quotes: [
      { text: "代码是给人看的，顺便能在机器上运行。", author: "Donald Knuth" },
      { text: "过早优化是万恶之源。", author: "Donald Knuth" },
      { text: "简单是可靠的前提。", author: "Edsger Dijkstra" },
      { text: "程序必须写给人读，只能顺便让机器执行。", author: "Harold Abelson" },
      { text: "最好的代码是不写代码。", author: "Jeff Atwood" },
      { text: "先让它跑起来，再让它跑得快。", author: "Kent Beck" },
      { text: "编程不是打字，而是思考。", author: "Rich Hickey" },
      { text: "读代码的时间是写代码的 10 倍。", author: "Robert C. Martin" },
      { text: "保持简单，保持愚蠢。", author: "Steve Jobs" },
      { text: "完成比完美重要。", author: "Mark Zuckerberg" },
      { text: "不要重复造轮子，除非你能造出更好的轮子。", author: "未知" },
      { text: "技术是手段，解决问题是目的。", author: "未知" },
    ],
    categories: [
      { id: 'tech', name: '技术', icon: 'code', desc: '编程、架构、工具' },
      { id: 'reading', name: '读书', icon: 'book', desc: '笔记、心得、推荐' },
      { id: 'life', name: '生活', icon: 'heart', desc: '感悟、随笔、记录' },
      { id: 'thinking', name: '思考', icon: 'brain', desc: '模型、决策、复盘' },
    ],
    friends: [
      { name: 'GitHub', url: 'https://github.com/yww006', desc: '代码托管平台', avatar: 'GH' },
      { name: 'Unsplash', url: 'https://unsplash.com', desc: '高质量免费图片', avatar: 'UN' },
    ],
  };

  // ===== 状态 =====
  let currentBgIndex = 0;
  let postsData = [];
  let filteredPosts = [];
  let currentPage = 1;
  let currentFilter = 'all';
  let currentSort = 'date-desc';
  let currentView = 'grid';
  let isArticlePage = false;

  // ===== DOM 元素 =====
  const elements = {
    bgLayer: null,
    particlesContainer: null,
    postsGrid: null,
    loadingEl: null,
    themeToggle: null,
    sortSelect: null,
    viewToggle: null,
    filterBtns: [],
    pagination: null,
    prevPage: null,
    nextPage: null,
    pageNumbers: null,
    loadMoreBtn: null,
    quoteText: null,
    quoteAuthor: null,
    featuredGrid: null,
    categoriesGrid: null,
    tagCloud: null,
    popularList: null,
    friendsGrid: null,
    jsonLd: null,
    statEls: {
      totalPosts: null,
      totalTags: null,
      totalCategories: null,
      daysRunning: null,
    },
  };

  // ===== 初始化 =====
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheElements();
    detectPageType();
    initTheme();
    initBackground();
    initParticles();
    loadPosts();
    startBgRotation();
    bindEvents();
    if (!isArticlePage) {
      renderDailyQuote();
      renderCategories();
      renderJsonLd();
    }
  }

  function cacheElements() {
    elements.bgLayer = document.querySelector('.bg-layer');
    elements.particlesContainer = document.querySelector('.particles');
    elements.postsGrid = document.querySelector('.posts-grid');
    elements.loadingEl = document.querySelector('.loading');
    elements.themeToggle = document.getElementById('themeToggle');
    elements.sortSelect = document.getElementById('sortSelect');
    elements.viewToggle = document.getElementById('viewToggle');
    elements.filterBtns = document.querySelectorAll('.filter-btn');
    elements.pagination = document.getElementById('pagination');
    elements.prevPage = document.getElementById('prevPage');
    elements.nextPage = document.getElementById('nextPage');
    elements.pageNumbers = document.getElementById('pageNumbers');
    elements.loadMoreBtn = document.getElementById('loadMoreBtn');
    elements.quoteText = document.getElementById('quoteText');
    elements.quoteAuthor = document.getElementById('quoteAuthor');
    elements.featuredGrid = document.getElementById('featuredGrid');
    elements.categoriesGrid = document.getElementById('categoriesGrid');
    elements.tagCloud = document.getElementById('tagCloud');
    elements.popularList = document.getElementById('popularList');
    elements.friendsGrid = document.getElementById('friendsGrid');
    elements.jsonLd = document.getElementById('json-ld');
    elements.statEls = {
      totalPosts: document.getElementById('totalPosts'),
      totalTags: document.getElementById('totalTags'),
      totalCategories: document.getElementById('totalCategories'),
      daysRunning: document.getElementById('daysRunning'),
    };
  }

  function detectPageType() {
    isArticlePage = document.body.classList.contains('article-page');
  }

  // ===== 主题系统 =====
  function initTheme() {
    if (!elements.themeToggle) return;
    const saved = localStorage.getItem('gle-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);

    elements.themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('gle-theme', next);
    });

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('gle-theme')) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (elements.themeToggle) {
      elements.themeToggle.setAttribute('aria-label', theme === 'dark' ? '切换到浅色模式' : '切换到深色模式');
    }
  }

  // ===== 背景图系统 =====
  function initBackground() {
    if (!elements.bgLayer) return;
    setBackground(0);
  }

  function setBackground(index) {
    if (!elements.bgLayer || !CONFIG.backgroundImages[index]) return;
    currentBgIndex = index;
    const url = CONFIG.backgroundImages[index];

    const img = new Image();
    img.onload = () => {
      elements.bgLayer.style.backgroundImage = 'url("' + url + '")';
      elements.bgLayer.style.opacity = '0.12';
    };
    img.src = url;
  }

  function nextBackground() {
    const next = (currentBgIndex + 1) % CONFIG.backgroundImages.length;
    setBackground(next);
  }

  function startBgRotation() {
    setInterval(nextBackground, CONFIG.bgChangeInterval);
  }

  // ===== 粒子效果 =====
  function initParticles() {
    if (!elements.particlesContainer) return;

    for (let i = 0; i < CONFIG.particleCount; i++) {
      createParticle(i);
    }
  }

  function createParticle(index) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const size = Math.random() * 3 + 2;
    const left = Math.random() * 100;
    const duration = Math.random() * 15 + 15;
    const delay = Math.random() * 20;

    particle.style.cssText =
      'width: ' + size + 'px;' +
      'height: ' + size + 'px;' +
      'left: ' + left + '%;' +
      'animation-duration: ' + duration + 's;' +
      'animation-delay: ' + delay + 's;' +
      'opacity: 0;';

    elements.particlesContainer.appendChild(particle);
  }

  // ===== 文章加载与渲染 =====
  async function loadPosts() {
    if (isArticlePage) {
      loadArticle();
      return;
    }

    try {
      showLoading(true);
      const response = await fetch('posts/index.json');
      if (!response.ok) throw new Error('Failed to load posts index');
      postsData = await response.json();
      filteredPosts = [...postsData];
      updateStats();
      applyFilterAndSort();
      renderFeatured();
      renderTags();
      renderPopular();
      renderFriends();
      showLoading(false);
    } catch (error) {
      console.error('Load posts error:', error);
      showEmptyState();
      showLoading(false);
    }
  }

  function showLoading(show) {
    if (elements.loadingEl) {
      elements.loadingEl.style.display = show ? 'flex' : 'none';
    }
    if (elements.postsGrid) {
      elements.postsGrid.style.opacity = show ? '0.3' : '1';
    }
  }

  function updateStats() {
    const tags = new Set();
    const categories = new Set();
    let firstDate = null;

    postsData.forEach(post => {
      if (post.tags) post.tags.forEach(t => tags.add(t));
      if (post.category) categories.add(post.category);
      const d = new Date(post.date);
      if (!isNaN(d.getTime()) && (!firstDate || d < firstDate)) firstDate = d;
    });

    if (elements.statEls.totalPosts) elements.statEls.totalPosts.textContent = postsData.length;
    if (elements.statEls.totalTags) elements.statEls.totalTags.textContent = tags.size;
    if (elements.statEls.totalCategories) elements.statEls.totalCategories.textContent = categories.size;
    if (elements.statEls.daysRunning && firstDate) {
      const diff = Math.floor((Date.now() - firstDate.getTime()) / 86400000) + 1;
      elements.statEls.daysRunning.textContent = diff;
    }
  }

  // ===== 筛选与排序 =====
  function applyFilterAndSort() {
    // 筛选
    if (currentFilter === 'featured') {
      filteredPosts = postsData.filter(p => p.featured);
    } else {
      filteredPosts = [...postsData];
    }

    // 排序
    filteredPosts.sort((a, b) => {
      switch (currentSort) {
        case 'date-asc': return new Date(a.date) - new Date(b.date);
        case 'title-az': return a.title.localeCompare(b.title, 'zh-CN');
        case 'readTime-asc': return (a.readTime || 0) - (b.readTime || 0);
        case 'date-desc':
        default: return new Date(b.date) - new Date(a.date);
      }
    });

    currentPage = 1;
    renderPosts();
    renderPagination();
  }

  function renderPosts() {
    if (!elements.postsGrid) return;

    const start = (currentPage - 1) * CONFIG.postsPerPage;
    const pagePosts = filteredPosts.slice(start, start + CONFIG.postsPerPage);

    if (pagePosts.length === 0) {
      showEmptyState();
      return;
    }

    elements.postsGrid.innerHTML = pagePosts
      .map((post, i) => createPostCard(post, start + i))
      .join('');

    requestAnimationFrame(() => {
      document.querySelectorAll('.post-card').forEach((card, i) => {
        card.style.animationDelay = (i * 0.08) + 's';
        card.classList.add('animate-in');
      });
    });
  }

  function createPostCard(post, index) {
    const date = formatDate(post.date);
    const excerpt = post.excerpt || truncate(post.content || '', 160);
    const tags = post.tags ? post.tags.slice(0, 3).map(function(t) {
      return '<span class="tag">#' + escapeHtml(t) + '</span>';
    }).join('') : '';
    const bgImage = post.coverImage || getRandomBgImage();
    const delayClass = 'delay-' + ((index % 6) + 1);

    return '' +
      '<article class="post-card animate-in ' + delayClass + '" data-slug="' + escapeHtml(post.slug) + '">' +
        '<a href="posts/' + escapeHtml(post.slug) + '.html" class="post-thumb" style="background-image: url(\'' + bgImage + '\')" aria-label="阅读《' + escapeHtml(post.title) + '》">' +
          '<span class="post-category">' + escapeHtml(post.category || '随笔') + '</span>' +
          '<time class="post-date" datetime="' + escapeHtml(post.date) + '">' + date + '</time>' +
        '</a>' +
        '<div class="post-content">' +
          '<h2 class="post-title">' +
            '<a href="posts/' + escapeHtml(post.slug) + '.html" style="color: inherit; text-decoration: none;">' + escapeHtml(post.title) + '</a>' +
          '</h2>' +
          '<p class="post-excerpt">' + escapeHtml(excerpt) + '</p>' +
          '<div class="post-meta">' +
            '<div class="post-tags">' + tags + '</div>' +
            '<a href="posts/' + escapeHtml(post.slug) + '.html" class="read-more">阅读全文</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function showEmptyState() {
    if (!elements.postsGrid) return;
    elements.postsGrid.innerHTML = '' +
      '<div class="empty-state animate-in">' +
        '<div class="empty-icon">📚</div>' +
        '<h3 class="empty-title">暂无文章</h3>' +
        '<p>明天见，第一篇将自动生成</p>' +
      '</div>';
  }

  // ===== 分页 =====
  function renderPagination() {
    if (!elements.pagination || !elements.pageNumbers) return;

    const totalPages = Math.ceil(filteredPosts.length / CONFIG.postsPerPage);

    if (totalPages <= 1) {
      elements.pagination.hidden = true;
      if (elements.loadMoreBtn) elements.loadMoreBtn.parentElement.hidden = true;
      return;
    }

    elements.pagination.hidden = false;

    // Prev/Next
    if (elements.prevPage) elements.prevPage.disabled = currentPage === 1;
    if (elements.nextPage) elements.nextPage.disabled = currentPage === totalPages;

    // Page numbers
    let html = '';
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      html += '<a href="#" class="page-num" data-page="1">1</a>';
      if (start > 2) html += '<span class="page-num" style="cursor:default;color:var(--text-muted);">…</span>';
    }

    for (let i = start; i <= end; i++) {
      html += '<a href="#" class="page-num' + (i === currentPage ? ' active' : '') + '" data-page="' + i + '">' + i + '</a>';
    }

    if (end < totalPages) {
      if (end < totalPages - 1) html += '<span class="page-num" style="cursor:default;color:var(--text-muted);">…</span>';
      html += '<a href="#" class="page-num" data-page="' + totalPages + '">' + totalPages + '</a>';
    }

    elements.pageNumbers.innerHTML = html;
  }

  function goToPage(page) {
    const totalPages = Math.ceil(filteredPosts.length / CONFIG.postsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderPosts();
    renderPagination();
    window.scrollTo({ top: elements.postsGrid.offsetTop - 100, behavior: 'smooth' });
  }

  // ===== 精选文章 =====
  function renderFeatured() {
    if (!elements.featuredGrid) return;
    const featured = postsData.filter(p => p.featured).slice(0, 3);
    if (featured.length === 0) {
      document.getElementById('featuredSection').hidden = true;
      return;
    }
    document.getElementById('featuredSection').hidden = false;

    elements.featuredGrid.innerHTML = featured.map(post => {
      const date = formatDate(post.date, true);
      const excerpt = post.excerpt || truncate(post.content || '', 180);
      const bgImage = post.coverImage || getRandomBgImage();

      return '' +
        '<article class="featured-card animate-in">' +
          '<a href="posts/' + escapeHtml(post.slug) + '.html" class="featured-thumb" style="background-image: url(\'' + bgImage + '\')" aria-label="阅读《' + escapeHtml(post.title) + '》"></a>' +
          '<div class="featured-content">' +
            '<div class="featured-meta">' +
              '<span class="featured-category">' + escapeHtml(post.category || '随笔') + '</span>' +
              '<time class="featured-date">' + date + '</time>' +
            '</div>' +
            '<h3 class="featured-title"><a href="posts/' + escapeHtml(post.slug) + '.html" style="color: inherit; text-decoration: none;">' + escapeHtml(post.title) + '</a></h3>' +
            '<p class="featured-excerpt">' + escapeHtml(excerpt) + '</p>' +
            '<a href="posts/' + escapeHtml(post.slug) + '.html" class="featured-link">阅读全文 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  // ===== 每日一句 =====
  function renderDailyQuote() {
    if (!elements.quoteText || !elements.quoteAuthor) return;
    const today = new Date().toDateString();
    const saved = localStorage.getItem('gle-daily-quote');
    let quote;

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date === today) {
          quote = parsed.quote;
        }
      } catch (e) {}
    }

    if (!quote) {
      quote = CONFIG.quotes[Math.floor(Math.random() * CONFIG.quotes.length)];
      localStorage.setItem('gle-daily-quote', JSON.stringify({ date: today, quote }));
    }

    elements.quoteText.textContent = quote.text;
    elements.quoteAuthor.textContent = '— ' + quote.author;
  }

  // ===== 分类导航 =====
  function renderCategories() {
    if (!elements.categoriesGrid) return;

    // 统计每分类文章数
    const counts = {};
    postsData.forEach(p => {
      const cat = p.category || '随笔';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    elements.categoriesGrid.innerHTML = CONFIG.categories.map(cat => {
      const count = counts[cat.name] || 0;
      const iconSvg = getCategoryIcon(cat.icon);

      return '' +
        '<a href="archive.html?category=' + encodeURIComponent(cat.name) + '" class="category-card">' +
          '<div class="category-icon">' + iconSvg + '</div>' +
          '<div class="category-name">' + escapeHtml(cat.name) + '</div>' +
          '<div class="category-count">' + count + ' 篇</div>' +
        '</a>';
    }).join('');

    document.getElementById('categoriesSection').hidden = false;
  }

  function getCategoryIcon(name) {
    const icons = {
      code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
      book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
      heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
      brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M9 17h6"/><path d="M9 13h6"/><path d="M9 9h6"/></svg>',
    };
    return icons[name] || icons.code;
  }

  // ===== 标签云 =====
  function renderTags() {
    if (!elements.tagCloud) return;

    const tagCounts = {};
    postsData.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    if (sortedTags.length === 0) {
      document.getElementById('tagsSection').hidden = true;
      return;
    }

    document.getElementById('tagsSection').hidden = false;

    elements.tagCloud.innerHTML = sortedTags.map(([tag, count]) => {
      const size = Math.min(13 + count * 1.5, 22);
      return '<span class="tag" style="font-size:' + size + 'px;" data-tag="' + escapeHtml(tag) + '">#' + escapeHtml(tag) + ' <small style="font-weight:400;opacity:0.6;">(' + count + ')</small></span>';
    }).join('');

    // 点击标签跳转
    elements.tagCloud.querySelectorAll('.tag').forEach(el => {
      el.addEventListener('click', () => {
        window.location.href = 'tags.html?tag=' + encodeURIComponent(el.dataset.tag);
      });
    });
  }

  // ===== 热门阅读 =====
  function renderPopular() {
    if (!elements.popularList) return;

    // 模拟阅读量（实际可从统计获取）
    const popular = postsData
      .map(p => ({ ...p, views: p.views || Math.floor(Math.random() * 1000) + 100 }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    if (popular.length === 0) {
      document.getElementById('popularSection').hidden = true;
      return;
    }

    document.getElementById('popularSection').hidden = false;

    elements.popularList.innerHTML = popular.map((post, i) => {
      const date = formatDate(post.date);
      return '' +
        '<a href="posts/' + escapeHtml(post.slug) + '.html" class="popular-item">' +
          '<span class="popular-rank">' + (i + 1) + '</span>' +
          '<div class="popular-info">' +
            '<div class="popular-item-title">' + escapeHtml(post.title) + '</div>' +
            '<div class="popular-item-meta">' +
              '<time>' + date + '</time>' +
              '<span class="popular-views">' + formatNumber(post.views) + ' 阅读</span>' +
            '</div>' +
          '</div>' +
        '</a>';
    }).join('');
  }

  function formatNumber(num) {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  }

  // ===== 友情链接 =====
  function renderFriends() {
    if (!elements.friendsGrid) return;

    elements.friendsGrid.innerHTML = CONFIG.friends.map(f => {
      return '' +
        '<a href="' + escapeHtml(f.url) + '" class="friend-card" target="_blank" rel="noopener">' +
          '<div class="friend-avatar">' + escapeHtml(f.avatar) + '</div>' +
          '<div class="friend-name">' + escapeHtml(f.name) + '</div>' +
          '<div class="friend-desc">' + escapeHtml(f.desc) + '</div>' +
        '</a>';
    }).join('');

    document.getElementById('friendsSection').hidden = false;
  }

  // ===== JSON-LD 结构化数据 =====
  function renderJsonLd() {
    if (!elements.jsonLd) return;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'GLE · 个人知识库',
      url: 'https://yww006.github.io/gle/',
      description: '每日一篇，记录成长。技术笔记、读书心得、生活感悟——在这里沉淀，随时回顾。',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://yww006.github.io/gle/tags.html?tag={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    };

    elements.jsonLd.textContent = JSON.stringify(schema);
  }

  // ===== 文章详情页 =====
  async function loadArticle() {
    const slug = getSlugFromPath();
    if (!slug) return;

    try {
      const response = await fetch('posts/' + slug + '.json');
      if (!response.ok) throw new Error('Article not found');
      const article = await response.json();
      renderArticle(article);
    } catch (error) {
      console.error('Load article error:', error);
      document.body.innerHTML = '' +
        '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:20px;">' +
          '<div>' +
            '<h1 style="font-size:32px;margin-bottom:16px;">文章未找到</h1>' +
            '<a href="./" class="back-link" style="display:inline-flex;margin-top:24px;">← 返回首页</a>' +
          '</div>' +
        '</div>';
    }
  }

  function renderArticle(article) {
    document.title = article.title + ' · GLE';

    const date = formatDate(article.date, true);
    const tags = article.tags ? article.tags.map(function(t) {
      return '<a href="./tags.html?tag=' + encodeURIComponent(t) + '" class="tag" style="text-decoration:none;">#' + escapeHtml(t) + '</a>';
    }).join('') : '';

    const articleHtml = '' +
      '<a href="./" class="back-link">← 返回首页</a>' +
      '<header class="article-header animate-in">' +
        '<span class="article-category">' + escapeHtml(article.category || '随笔') + '</span>' +
        '<h1 class="article-title">' + escapeHtml(article.title) + '</h1>' +
        '<div class="article-meta">' +
          '<time datetime="' + escapeHtml(article.date) + '">📅 ' + date + '</time>' +
          (article.readTime ? '<span>⏱️ ' + article.readTime + ' 分钟阅读</span>' : '') +
        '</div>' +
      '</header>' +
      '<div class="article-content">' +
        '<article class="article-body animate-in delay-1">' +
          (article.html || markdownToHtml(article.content || '')) +
        '</article>' +
        (tags ? '<div class="article-tags" style="margin-top:32px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">' + tags + '</div>' : '') +
      '</div>';

    const main = document.querySelector('.main');
    if (main) main.innerHTML = articleHtml;

    if (article.coverImage && elements.bgLayer) {
      elements.bgLayer.style.backgroundImage = 'url("' + article.coverImage + '")';
    }
  }

  function getSlugFromPath() {
    const path = window.location.pathname;
    const match = path.match(/\/posts\/([^\/]+)\.html$/);
    return match ? match[1] : null;
  }

  // ===== 工具函数 =====
  function formatDate(dateStr, full) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const options = full
      ? { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
      : { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('zh-CN', options);
  }

  function truncate(str, len) {
    if (str.length <= len) return str;
    return str.slice(0, len).replace(/\s+\S*$/, '') + '…';
  }

  function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&apos;');
    }

  function getRandomBgImage() {
    return CONFIG.backgroundImages[Math.floor(Math.random() * CONFIG.backgroundImages.length)];
  }

  function markdownToHtml(md) {
    return md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" loading="lazy">')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<h[1-6]>)/g, '$1')
      .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
      .replace(/<p>(<ul>)/g, '$1')
      .replace(/(<\/ul>)<\/p>/g, '$1')
      .replace(/<p>(<blockquote>)/g, '$1')
      .replace(/(<\/blockquote>)<\/p>/g, '$1')
      .replace(/<p>(<pre>)/g, '$1')
      .replace(/(<\/pre>)<\/p>/g, '$1');
  }

  // ===== 事件绑定 =====
  function bindEvents() {
    // 平滑锚点跳转
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a[href^="#"]');
      if (link) {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }
    });

    // 筛选按钮
    elements.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.filterBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        currentFilter = btn.dataset.filter;
        applyFilterAndSort();
      });
    });

    // 排序选择
    if (elements.sortSelect) {
      elements.sortSelect.addEventListener('change', () => {
        currentSort = elements.sortSelect.value;
        applyFilterAndSort();
      });
    }

    // 视图切换
    if (elements.viewToggle) {
      elements.viewToggle.addEventListener('click', () => {
        const main = document.querySelector('.main');
        if (main.classList.contains('list-view')) {
          main.classList.remove('list-view');
          elements.viewToggle.setAttribute('aria-label', '切换到列表视图');
        } else {
          main.classList.add('list-view');
          elements.viewToggle.setAttribute('aria-label', '切换到网格视图');
        }
        currentView = main.classList.contains('list-view') ? 'list' : 'grid';
        localStorage.setItem('gle-view', currentView);
      });
    }

    // 恢复视图偏好
    const savedView = localStorage.getItem('gle-view');
    if (savedView === 'list') {
      document.querySelector('.main').classList.add('list-view');
      if (elements.viewToggle) {
        elements.viewToggle.querySelector('.icon-grid').style.display = 'none';
        elements.viewToggle.querySelector('.icon-list').style.display = 'block';
      }
    }

    // 分页
    if (elements.prevPage) {
      elements.prevPage.addEventListener('click', () => goToPage(currentPage - 1));
    }
    if (elements.nextPage) {
      elements.nextPage.addEventListener('click', () => goToPage(currentPage + 1));
    }
    if (elements.pageNumbers) {
      elements.pageNumbers.addEventListener('click', (e) => {
        const link = e.target.closest('.page-num[data-page]');
        if (link) {
          e.preventDefault();
          goToPage(parseInt(link.dataset.page, 10));
        }
      });
    }

    // 加载更多（备选）
    if (elements.loadMoreBtn) {
      elements.loadMoreBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredPosts.length / CONFIG.postsPerPage);
        if (currentPage < totalPages) {
          goToPage(currentPage + 1);
        }
      });
    }

    // 键盘导航
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') goToPage(currentPage - 1);
      if (e.key === 'ArrowRight') goToPage(currentPage + 1);
    });
  }

  // ===== 公开 API =====
  window.GLE = {
    setBackground: setBackground,
    nextBackground: nextBackground,
    loadPosts: loadPosts,
    formatDate: formatDate,
    applyTheme: applyTheme,
  };

})();