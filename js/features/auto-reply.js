/* ============================================
 * 互相评论回复模块 - auto-reply.js
 * 独立模块，不影响其他功能
 * ============================================ */
(function() {
    'use strict';

    var originalSubmit = window.submitMomentComment;
    window.submitMomentComment = function(momentId) {
        originalSubmit(momentId);
        setTimeout(function() {
            var comment = (typeof window._getRandomComment === 'function') ? window._getRandomComment() : '赞！';
            var partnerName = (typeof settings !== 'undefined' && settings.partnerName) ? settings.partnerName : '梦角';
            var moment = JSON.parse(localStorage.getItem('moments_data') || '[]').find(function(m) { return m.id === momentId; });
            if (!moment) return;
            moment.comments.push({
                id: 'mc_' + Date.now(),
                author: partnerName,
                text: comment,
                timestamp: Date.now()
            });
            localStorage.setItem('moments_data', JSON.stringify(JSON.parse(localStorage.getItem('moments_data') || '[]').map(function(m) {
                return m.id === momentId ? moment : m;
            })));
            if (typeof window._renderMomentsList === 'function') window._renderMomentsList();
            else if (typeof window.openMomentsMainModal === 'function') {
                var modal = document.getElementById('moments-main-overlay');
                if (modal) { modal.remove(); window.openMomentsMainModal(); }
            }
        }, 2000 + Math.random() * 3000);
    };

    console.log('💬 互相评论模块已加载');
})();
