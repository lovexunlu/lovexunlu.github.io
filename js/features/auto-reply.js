/* ============================================
 * 互相评论回复模块 - auto-reply.js
 * 独立模块，不影响其他功能
 * ============================================ */
(function() {
    'use strict';

    var originalSubmit = window.submitMomentComment;
    window.submitMomentComment = function(momentId) {
        originalSubmit(momentId);
                    localStorage.setItem('pending_reply', JSON.stringify({
                momentId: momentId,
                partnerName: (typeof settings !== 'undefined' && settings.partnerName) ? settings.partnerName : '梦角',
                comment: (typeof window._getRandomComment === 'function') ? window._getRandomComment() : '赞！',
                replyTime: Date.now() + 120000 + Math.floor(Math.random() * 180000)
            }));
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
        }, 120000 + Math.random() * 180000);
    };
    function checkPendingReply() {
        var pending = localStorage.getItem('pending_reply');
        if (!pending) return;
        var data = JSON.parse(pending);
        if (Date.now() < data.replyTime) return;
        var moment = JSON.parse(localStorage.getItem('moments_data') || '[]').find(function(m) { return m.id === data.momentId; });
        if (!moment) { localStorage.removeItem('pending_reply'); return; }
        moment.comments.push({
            id: 'mc_' + Date.now(),
            author: data.partnerName,
            text: data.comment,
            timestamp: Date.now()
        });
        localStorage.setItem('moments_data', JSON.stringify(JSON.parse(localStorage.getItem('moments_data') || '[]').map(function(m) {
            return m.id === data.momentId ? moment : m;
        })));
        localStorage.removeItem('pending_reply');
    }
    checkPendingReply();
    console.log('💬 互相评论模块已加载');
})();
