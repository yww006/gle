/**
 * GLE 个人知识库 - 核心脚本
 * 功能：文章加载、背景图切换、粒子效果、主题适配
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
  };

  // ===== 状态 =====
  let currentBgIndex = 0;
  let postsData = [];
  let isArticlePage = false;

  // ===== DOM 元素 =====
  const elements = {
    bgLayer: null,
    particlesContainer: null,
    postsGrid: null,
    loadingEl: null,
  };

  // ===== 初始化 =====
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheElements();
    detectPageType();
    initBackground();
    initParticles();
    loadPosts();
    startBgRotation();
    bindEvents();
  }

  function cacheElements() {
    elements.bgLayer = document.querySelector('.bg-layer');
    elements.particlesContainer = document.querySelector('.particles');
    elements.postsGrid = document.querySelector('.posts-grid');
    elements.loadingEl = document.querySelector('.loading');
  }

  function detectPageType() {
    isArticlePage = document.body.classList.contains('article-page');
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

  // ===== 文章加载 =====
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
      renderPosts(postsData);
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

  function renderPosts(posts) {
    if (!elements.postsGrid) return;
    
    if (!posts || posts.length === 0) {
      showEmptyState();
      return;
    }

    elements.postsGrid.innerHTML = posts
      .slice(0, CONFIG.postsPerPage)
      .map((post, i) => createPostCard(post, i))
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
            '<a href="/" class="back-link" style="display:inline-flex;margin-top:24px;">← 返回首页</a>' +
          '</div>' +
        '</div>';
    }
  }

  function renderArticle(article) {
    document.title = article.title + ' · GLE';
    
    const date = formatDate(article.date, true);
    const tags = article.tags ? article.tags.map(function(t) {
      return '<a href="/?tag=' + encodeURIComponent(t) + '" class="tag" style="text-decoration:none;">#' + escapeHtml(t) + '</a>';
    }).join('') : '';
    
    const articleHtml = '' +
      '<a href="/" class="back-link">← 返回首页</a>' +
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
      .replace(/'/g, '\'')
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
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
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
    document.addEventListener('click', function(e) {
      const link = e.target.closest('a[href^="#"]');
      if (link) {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // ===== 公开 API =====
  window.GLE = {
    setBackground: setBackground,
    nextBackground: nextBackground,
    loadPosts: loadPosts,
    formatDate: formatDate,
  };

})();