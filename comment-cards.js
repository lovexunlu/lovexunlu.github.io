/* ============================================
 * 评论字卡库模块 - comment-cards.js
 * 独立模块，不影响其他功能
 * ============================================ */
(function() {
    'use strict';

    const STORAGE_KEY = 'comment_cards_library';
    let commentCards = [];

    function init() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            commentCards = saved ? JSON.parse(saved) : [];
        } catch(e) { commentCards = []; }
    }

    function save() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(commentCards)); } catch(e) {}
    }

    function getRandomComment() {
        if (commentCards.length === 0) return '赞！';
        return commentCards[Math.floor(Math.random() * commentCards.length)].text;
    }

    function openManager() {
        const modal = document.createElement('div');
        modal.className = 'moments-card-picker-overlay';
        modal.id = 'comment-cards-manager-overlay';
        modal.innerHTML = `<div class="moments-card-picker" style="max-width:500px;"><div class="moments-card-picker-header"><span>💬 评论字卡库</span><button onclick="document.getElementById('comment-cards-manager-overlay').remove()"><i class="fas fa-times"></i></button></div><div style="display:flex;gap:8px;padding:12px;"><input type="text" id="new-comment-card-input" placeholder="输入评论内容..." style="flex:1;padding:10px;border:1px solid var(--border-color);border-radius:8px;font-size:13px;background:var(--primary-bg);color:var(--text-primary);outline:none;"><button onclick="window._addCommentCard()" style="padding:10px 16px;background:var(--accent-color);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;">添加</button></div><div class="moments-card-picker-grid">${commentCards.map(c => `<div class="moments-card-picker-item" style="display:flex;justify-content:space-between;align-items:center;"><span>${c.text}</span><button onclick="window._removeCommentCard('${c.id}')" style="background:none;border:none;color:#ff5050;cursor:pointer;">×</button></div>`).join('')}</div></div>`;
        modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    }

    window._addCommentCard = function() {
        var input = document.getElementById('new-comment-card-input');
        if (!input || !input.value.trim()) return;
        commentCards.push({ id: 'cc_' + Date.now(), text: input.value.trim() });
        save();
        var overlay = document.getElementById('comment-cards-manager-overlay');
        if (overlay) { overlay.remove(); openManager(); }
    };

    window._removeCommentCard = function(id) {
        commentCards = commentCards.filter(function(c) { return c.id !== id; });
        save();
        var overlay = document.getElementById('comment-cards-manager-overlay');
        if (overlay) { overlay.remove(); openManager(); }
    };

    window._getRandomComment = getRandomComment;
    window.openCommentCardsManager = openManager;

    init();
    console.log('💬 评论字卡库已加载');
})();
