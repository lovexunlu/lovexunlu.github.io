/* ============================================
 * 朋友圈功能模块 - moments.js (自动版)
 * 功能：发朋友圈 / 点赞 / 评论 / 字卡库 / 图片库
 * 新增：梦角自动发朋友圈、自动互动、时间设置
 * ============================================ */

(function() {
    'use strict';

    const STORAGE_KEY_MOMENTS = 'moments_data';
    const STORAGE_KEY_MOMENT_CARDS = 'moment_cards_library';
    const STORAGE_KEY_MOMENT_IMAGES = 'moment_images_library';
    const STORAGE_KEY_AUTO_SETTINGS = 'moments_auto_settings';
    const CURRENT_USER = '我';
    const PARTNER_USER = '梦角';

    let momentsData = [];
    let momentCardsLibrary = [];
    let momentImagesLibrary = [];
    let autoTimers = [];
const MAX_MOMENTS = 50;
    let autoSettings = {
        enabled: true,
        postInterval: 30,
        commentInterval: 5,
        likeChance: 70,
        commentChance: 50
    };

    function initMomentsData() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_MOMENTS);
            momentsData = saved ? JSON.parse(saved) : [];
        } catch(e) { momentsData = []; }
        try {
            const cards = localStorage.getItem(STORAGE_KEY_MOMENT_CARDS);
            momentCardsLibrary = cards ? JSON.parse(cards) : getDefaultMomentCards();
        } catch(e) { momentCardsLibrary = getDefaultMomentCards(); }
        try {
            const imgs = localStorage.getItem(STORAGE_KEY_MOMENT_IMAGES);
            momentImagesLibrary = imgs ? JSON.parse(imgs) : [];
        } catch(e) { momentImagesLibrary = []; }
        try {
            const savedSettings = localStorage.getItem(STORAGE_KEY_AUTO_SETTINGS);
            if (savedSettings) autoSettings = JSON.parse(savedSettings);
        } catch(e) {}
    }

       function saveMomentsData() {
        if (momentsData.length > 50) {
            momentsData = momentsData.slice(0, 50);
        }
        try { localStorage.setItem(STORAGE_KEY_MOMENTS, JSON.stringify(momentsData)); } catch(e) {}
    }
    function saveMomentCardsLibrary() {
        try { localStorage.setItem(STORAGE_KEY_MOMENT_CARDS, JSON.stringify(momentCardsLibrary)); } catch(e) {}
    }
    function saveMomentImagesLibrary() {
        try { localStorage.setItem(STORAGE_KEY_MOMENT_IMAGES, JSON.stringify(momentImagesLibrary)); } catch(e) {}
    }
    function saveAutoSettings() {
        try { localStorage.setItem(STORAGE_KEY_AUTO_SETTINGS, JSON.stringify(autoSettings)); } catch(e) {}
    }

    function getDefaultMomentCards() {
        return [
            { id: 'mc_1', text: '早安，今天也要开心 ☀️' },
            { id: 'mc_2', text: '晚安，好梦 🌙' },
            { id: 'mc_3', text: '今天天气真好' },
            { id: 'mc_4', text: '想你了 ❤️' },
            { id: 'mc_5', text: '加油！你是最棒的 💪' },
            { id: 'mc_6', text: '今天的我很开心~' },
            { id: 'mc_7', text: '分享一首好听的歌 🎵' },
            { id: 'mc_8', text: '生活需要一点甜 🍬' }
        ];
    }

    function generateId() {
        return 'moment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return minutes + '分钟前';
        if (hours < 24) return hours + '小时前';
        if (days < 3) return days + '天前';
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours().toString().padStart(2, '0');
        const min = date.getMinutes().toString().padStart(2, '0');
        return month + '月' + day + '日 ' + hour + ':' + min;
    }

    function compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let width = img.width, height = img.height;
                    const maxSize = 800;if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = Math.round(height * maxSize / width);
                            width = maxSize;
                        } else {
                            width = Math.round(width * maxSize / height);
                            height = maxSize;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function getRandomCardText() {
        if (momentCardsLibrary.length === 0) return '';
        return momentCardsLibrary[Math.floor(Math.random() * momentCardsLibrary.length)].text;
    }

    function getRandomImage() {
        if (momentImagesLibrary.length === 0) return [];
        const img = momentImagesLibrary[Math.floor(Math.random() * momentImagesLibrary.length)];
        return [img.dataUrl];
    }

    function getRandomText() {
        const texts = [
            '今天心情不错~', '分享美好的一天 ✨', '生活需要仪式感', '好久不见，甚是想念',
            '今天的晚霞很美 🌅', '记录一下此刻', '有你真好 ❤️', '每一天都值得被记住',
            '简单的快乐', '做一个温柔的人', '不负好时光', '今天也是元气满满的一天！'
        ];
        return '';
    }

    async function autoPostMoment() {
        if (!autoSettings.enabled) return;
        const text = getRandomCardText() || getRandomText();
        const images = getRandomImage();
        const imageFiles = [];
        for (const dataUrl of images) {
            try {
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                imageFiles.push(new File([blob], 'image.jpg', { type: 'image/jpeg' }));
            } catch(e) {}
        }
        await publishMoment(text, imageFiles, null, PARTNER_USER);
    }

    function autoInteract() {
        if (!autoSettings.enabled) return;
        if (momentsData.length === 0) return;
        const myName = (typeof settings !== 'undefined' && settings.myName) ? settings.myName : '我';
        const myMoments = momentsData.filter(m => m.author === CURRENT_USER || m.author === myName);
        if (myMoments.length === 0) return;
        const target = myMoments[Math.floor(Math.random() * myMoments.length)];
        if (Math.random() * 100 < autoSettings.likeChance) {
            const partnerName = (typeof settings !== 'undefined' && settings.partnerName) ? settings.partnerName : '梦角';
            if (!target.likes.includes(partnerName)) {
                target.likes.push(partnerName);
                saveMomentsData();
            }
        }
        if (Math.random() * 100 < autoSettings.commentChance) {
            const comments = ['真好看！😊', '好棒呀~', '喜欢 ❤️', '太美了！', '我也想你~', '哈哈哈', '说得好！', '支持！', '好温馨~', '加油！', '每天都要开心哦~', '一起努力！'];
            const comment = comments[Math.floor(Math.random() * comments.length)];
            const partnerName = (typeof settings !== 'undefined' && settings.partnerName) ? settings.partnerName : '梦角';
            addComment(target.id, partnerName, comment, true);
        }
        renderMomentsList();
    }

    function startAutoTimers() {
        stopAutoTimers();
        if (!autoSettings.enabled) return;
        const randomDelay = (Math.floor(Math.random() * (autoSettings.postInterval - 60)) + 60) * 60 * 1000;
        const postTimer = setInterval(() => { autoPostMoment(); }, randomDelay);
        autoTimers.push(postTimer);
        const interactTimer = setInterval(() => { autoInteract(); }, autoSettings.commentInterval * 60 * 1000);
        autoTimers.push(interactTimer);
    }
    function stopAutoTimers() {
        autoTimers.forEach(t => clearInterval(t));
        autoTimers = [];
    }

    function updateAutoSettings(newSettings) {
        Object.assign(autoSettings, newSettings);
        saveAutoSettings();
        startAutoTimers();
    }
    // ========== 发布 ==========
    async function publishMoment(content, images, cardId, author) {
        if (!content.trim() && images.length === 0) {
            if (typeof showNotification === 'function') showNotification('请输入文字或选择图片', 'warning');
            return false;
        }
        const compressedImages = [];
        for (const img of images) {
            try {
                const compressed = await compressImage(img);
                compressedImages.push(compressed);
            } catch(e) {
                if (typeof showNotification === 'function') showNotification('图片处理失败', 'error');
                return false;
            }
        }
        const moment = {
            id: generateId(),
            author: author || CURRENT_USER,
            content: content.trim(),
            images: compressedImages,
            cardId: cardId || null,
            timestamp: Date.now(),
            likes: [],
            comments: []
        };
        momentsData.unshift(moment);
        saveMomentsData();
        renderMomentsList();
        return true;
    }

    function toggleLike(momentId, userName) {
        const moment = momentsData.find(m => m.id === momentId);
        if (!moment) return;
        const index = moment.likes.indexOf(userName);
        if (index > -1) { moment.likes.splice(index, 1); }
        else { moment.likes.push(userName); }
        saveMomentsData();
        renderMomentsList();
    }

    function addComment(momentId, author, text, skipRender) {
        if (!text.trim()) return;
        const moment = momentsData.find(m => m.id === momentId);
        if (!moment) return;
        moment.comments.push({
            id: generateId(),
            author: author,
            text: text.trim(),
            timestamp: Date.now()
        });
        saveMomentsData();
        if (!skipRender) renderMomentsList();
    }

    function deleteMoment(momentId) {
        if (!confirm('确定要删除这条朋友圈吗？')) return;
        momentsData = momentsData.filter(m => m.id !== momentId);
        saveMomentsData();
        renderMomentsList();
    }
    function deleteMomentComment(momentId, commentId) {
        if (!confirm('删除这条评论？')) return;
        var moment = momentsData.find(function(m) { return m.id === momentId; });
        if (!moment) return;
        moment.comments = moment.comments.filter(function(c) { return c.id !== commentId; });
        saveMomentsData();
        renderMomentsList();
    }
    window.deleteMomentComment = deleteMomentComment;
    function addMomentCard(text) {
        if (!text.trim()) return;
        momentCardsLibrary.push({ id: 'mc_' + Date.now(), text: text.trim() });
        saveMomentCardsLibrary();
    }

    function removeMomentCard(cardId) {
        momentCardsLibrary = momentCardsLibrary.filter(c => c.id !== cardId);
        saveMomentCardsLibrary();
    }

    async function addMomentImage(file) {
        try {
            const dataUrl = await compressImage(file);
            momentImagesLibrary.push({ id: 'mi_' + Date.now(), dataUrl: dataUrl, name: file.name, timestamp: Date.now() });
            saveMomentImagesLibrary();
            return true;
        } catch(e) { return false; }
    }

    function removeMomentImage(imageId) {
        momentImagesLibrary = momentImagesLibrary.filter(img => img.id !== imageId);
        saveMomentImagesLibrary();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }

    // ========== 渲染 ==========
    function renderMomentsList() {
        const container = document.getElementById('moments-list');
        if (!container) return;
        if (momentsData.length === 0) {
            container.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--text-secondary);"><i class="fas fa-camera-retro" style="font-size:48px;opacity:0.3;display:block;margin-bottom:16px;"></i><p style="font-size:14px;">还没有朋友圈动态</p><p style="font-size:12px;opacity:0.6;">梦角会在5秒后发布第一条~ ✦</p></div>`;
            return;
        }
        const myName = (typeof settings !== 'undefined' && settings.myName) ? settings.myName : '我';
        const partnerName = (typeof settings !== 'undefined' && settings.partnerName) ? settings.partnerName : '梦角';

        container.innerHTML = momentsData.map(moment => {
            const isMine = moment.author === CURRENT_USER || moment.author === myName;
            const authorDisplay = moment.author === CURRENT_USER ? myName : (moment.author === PARTNER_USER ? partnerName : moment.author);
            const likeCount = moment.likes.length;
            const hasLiked = moment.likes.includes(myName);
            let cardText = '';
            if (moment.cardId) {
                const card = momentCardsLibrary.find(c => c.id === moment.cardId);
                if (card) cardText = card.text;
            }
            let imagesHtml = '';
            if (moment.images && moment.images.length > 0) {
                const imgCount = moment.images.length;
                const gridClass = imgCount === 1 ? 'moments-img-grid-1' : imgCount <= 3 ? 'moments-img-grid-3' : imgCount <= 6 ? 'moments-img-grid-6' : 'moments-img-grid-9';
                imagesHtml = `<div class="moments-img-grid ${gridClass}">` + moment.images.map((img, idx) => `<div class="moments-img-item" onclick="window.viewMomentImage('${moment.id}', ${idx})"><img src="${img}" alt="图片${idx+1}" loading="lazy"></div>`).join('') + `</div>`;
            }
            let commentsHtml = '';
            if (moment.comments.length > 0) {
                commentsHtml = `<div class="moments-comments-area">` + moment.comments.map(c => {
                    const cAuthorDisplay = c.author === CURRENT_USER ? myName : (c.author === PARTNER_USER ? partnerName : c.author);
                   return `<div class="moments-comment-item"><span class="moments-comment-author">${cAuthorDisplay}:</span> <span class="moments-comment-text">${c.text}</span> <button onclick="event.stopPropagation();window.deleteMomentComment('${moment.id}','${c.id}')" style="background:none;border:none;color:#ff5050;cursor:pointer;font-size:10px;opacity:0.4;margin-left:12px;">🗑</button></div>`;
                }).join('') + `</div>`;
            }
            return `<div class="moments-item">
                <div class="moments-item-header">
                   <div class="moments-avatar ${isMine ? 'moments-avatar-mine' : 'moments-avatar-partner'}" style="background-image:url(${getMomentAvatar(isMine ? 'me' : 'partner') || ''});background-size:cover;cursor:pointer;" onclick="event.stopPropagation();uploadMomentAvatar('${isMine ? 'me' : 'partner'}')">${getMomentAvatar(isMine ? 'me' : 'partner') ? '' : '<i class="fas fa-user"></i>'}</div>
                    <div class="moments-user-info"><div class="moments-user-name">${authorDisplay}</div><div class="moments-time">${formatTime(moment.timestamp)}</div></div>
                                      <button class="moments-delete-btn" onclick="window.deleteMomentById('${moment.id}')"><i class="fas fa-trash-alt"></i></button>
                </div>
                ${cardText ? `<div class="moments-card-tag">📝 ${cardText}</div>` : ''}
                ${moment.content ? `<div class="moments-content">${escapeHtml(moment.content)}</div>` : ''}
                ${imagesHtml}
                <div class="moments-actions">
                    <div class="moments-action-row">
                        <button class="moments-action-btn ${hasLiked ? 'liked' : ''}" onclick="window.toggleMomentLike('${moment.id}')"><i class="fas fa-heart"></i> ${likeCount > 0 ? likeCount : '赞'}</button>
                        <button class="moments-action-btn" onclick="window.toggleCommentInput('${moment.id}')"><i class="fas fa-comment-dots"></i> ${moment.comments.length > 0 ? moment.comments.length : '评论'}</button>
                    </div>
                    ${likeCount > 0 ? `<div class="moments-likes-preview">❤️ ${moment.likes.map(n => n === CURRENT_USER ? myName : (n === PARTNER_USER ? partnerName : n)).join('、')}</div>` : ''}
                </div>
                ${commentsHtml}
                <div class="moments-comment-input-area" id="comment-input-${moment.id}" style="display:none;">
                    <input type="text" class="moments-comment-input" id="comment-text-${moment.id}" placeholder="写评论..." maxlength="200">
                    <button class="moments-comment-send-btn" onclick="window.submitMomentComment('${moment.id}')"><i class="fas fa-paper-plane"></i></button>
                    <button class="moments-comment-card-btn" onclick="window.openCardPickerForComment('${moment.id}')"><i class="fas fa-comment-dots"></i></button>
                </div>
            </div>`;
        }).join('');
    }
    // ========== 图片查看 ==========
    function viewMomentImage(momentId, index) {
        const moment = momentsData.find(m => m.id === momentId);
        if (!moment || !moment.images[index]) return;
        const overlay = document.createElement('div');
        overlay.className = 'moments-image-overlay';
        overlay.innerHTML = `<div class="moments-image-viewer"><button class="moments-image-close" onclick="this.closest('.moments-image-overlay').remove()"><i class="fas fa-times"></i></button><img src="${moment.images[index]}" alt="图片"></div>`;
        overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
        document.body.appendChild(overlay);
    }

    function toggleCommentInput(momentId) {
        const area = document.getElementById('comment-input-' + momentId);
        if (!area) return;
        area.style.display = area.style.display === 'none' ? 'flex' : 'none';
        if (area.style.display === 'flex') {
            const input = document.getElementById('comment-text-' + momentId);
            if (input) setTimeout(() => input.focus(), 100);
        }
    }

    function submitMomentComment(momentId) {
        const input = document.getElementById('comment-text-' + momentId);
        if (!input || !input.value.trim()) return;
        const myName = (typeof settings !== 'undefined' && settings.myName) ? settings.myName : '我';
        addComment(momentId, myName, input.value.trim());
        input.value = '';
    }

    function openCardPickerForComment(momentId) {
        const picker = document.createElement('div');
        picker.className = 'moments-card-picker-overlay';
        picker.innerHTML = `<div class="moments-card-picker"><div class="moments-card-picker-header"><span>选择字卡</span><button onclick="this.closest('.moments-card-picker-overlay').remove()"><i class="fas fa-times"></i></button></div><div class="moments-card-picker-grid">${momentCardsLibrary.map(card => `<div class="moments-card-picker-item" onclick="window.pickCardForComment('${momentId}', '${card.id}', this.closest('.moments-card-picker-overlay'))">${card.text}</div>`).join('')}</div></div>`;
        picker.onclick = function(e) { if (e.target === picker) picker.remove(); };
        document.body.appendChild(picker);
    }

    function pickCardForComment(momentId, cardId, overlay) {
        const card = momentCardsLibrary.find(c => c.id === cardId);
        if (!card) return;
        const input = document.getElementById('comment-text-' + momentId);
        if (input) input.value = card.text;
        if (overlay) overlay.remove();
    }

    // ========== 发布弹窗 ==========
    function openPublishMomentModal() {
        const modal = document.createElement('div');
        modal.className = 'moments-publish-overlay';
        modal.id = 'moments-publish-overlay';
        modal._publishImages = [];
        modal.innerHTML = `<div class="moments-publish-modal"><div class="moments-publish-header"><span>发布朋友圈</span><button onclick="document.getElementById('moments-publish-overlay').remove()"><i class="fas fa-times"></i></button></div><div class="moments-publish-body"><div class="moments-publish-user-select"><label>发布身份：</label><select id="moments-publish-author"><option value="我">我</option><option value="梦角">梦角</option></select></div><textarea id="moments-publish-text" placeholder="分享你的想法..." maxlength="1000"></textarea><div class="moments-publish-images-preview" id="moments-publish-images-preview"></div><div class="moments-publish-toolbar"><button onclick="document.getElementById('moments-image-input').click()"><i class="fas fa-image"></i> 图片</button><button onclick="window.openCardPickerForPublish()"><i class="fas fa-comment-dots"></i> 字卡</button><button onclick="window.openImageLibraryForPublish()"><i class="fas fa-images"></i> 图片库</button><span style="font-size:11px;color:var(--text-secondary);">最多9张</span></div><input type="file" id="moments-image-input" accept="image/*" multiple style="display:none;" onchange="window.handlePublishImages(this)"></div><div class="moments-publish-footer"><button class="moments-publish-cancel" onclick="document.getElementById('moments-publish-overlay').remove()">取消</button><button class="moments-publish-submit" onclick="window.submitPublishMoment()"><i class="fas fa-paper-plane"></i> 发布</button></div></div>`;
        modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    }

    function handlePublishImages(input) {
        const overlay = document.getElementById('moments-publish-overlay');
        if (!overlay) return;
        const files = Array.from(input.files);
        const currentCount = (overlay._publishImages || []).length;
        if (files.length + currentCount > 9) {
            if (typeof showNotification === 'function') showNotification('最多9张图片', 'warning');
            input.value = ''; return;
        }
        overlay._publishImages = (overlay._publishImages || []).concat(files);
        const preview = document.getElementById('moments-publish-images-preview');
        if (preview) {
            preview.innerHTML = overlay._publishImages.map((file, index) => {
                const url = URL.createObjectURL(file);
                return `<div class="moments-publish-image-item"><img src="${url}"><button onclick="window.removePublishImage(${index})">×</button></div>`;
            }).join('');
        }
        input.value = '';
    }

    function removePublishImage(index) {
        const overlay = document.getElementById('moments-publish-overlay');
        if (!overlay || !overlay._publishImages) return;
        overlay._publishImages.splice(index, 1);
        handlePublishImages({ files: [] });
    }

    function openCardPickerForPublish() {
        const picker = document.createElement('div');
        picker.className = 'moments-card-picker-overlay';
        picker.innerHTML = `<div class="moments-card-picker"><div class="moments-card-picker-header"><span>选择字卡</span><button onclick="this.closest('.moments-card-picker-overlay').remove()"><i class="fas fa-times"></i></button></div><div class="moments-card-picker-grid">${momentCardsLibrary.map(card => `<div class="moments-card-picker-item" onclick="window.pickCardForPublish('${card.id}', this.closest('.moments-card-picker-overlay'))">${card.text}</div>`).join('')}</div></div>`;
        picker.onclick = function(e) { if (e.target === picker) picker.remove(); };
        document.body.appendChild(picker);
    }

    function pickCardForPublish(cardId, overlay) {
        const card = momentCardsLibrary.find(c => c.id === cardId);
        if (!card) return;
        const textarea = document.getElementById('moments-publish-text');
        if (textarea) textarea.value = (textarea.value + ' ' + card.text).trim();
        if (overlay) overlay.remove();
    }

    function openImageLibraryForPublish() {
        const picker = document.createElement('div');
        picker.className = 'moments-card-picker-overlay';
        picker.innerHTML = `<div class="moments-card-picker" style="max-width:500px;"><div class="moments-card-picker-header"><span>从图片库选择</span><button onclick="this.closest('.moments-card-picker-overlay').remove()"><i class="fas fa-times"></i></button></div><div class="moments-image-library-grid">${momentImagesLibrary.map(img => `<div class="moments-image-library-item" onclick="window.pickImageForPublish('${img.id}', this.closest('.moments-card-picker-overlay'))"><img src="${img.dataUrl}" alt="${img.name}"></div>`).join('')}${momentImagesLibrary.length === 0 ? '<p style="text-align:center;padding:20px;grid-column:1/-1;">图片库为空</p>' : ''}</div></div>`;
        picker.onclick = function(e) { if (e.target === picker) picker.remove(); };
        document.body.appendChild(picker);
    }

    function pickImageForPublish(imageId, overlay) {
        const img = momentImagesLibrary.find(i => i.id === imageId);
        if (!img) return;
        fetch(img.dataUrl).then(res => res.blob()).then(blob => {
            const file = new File([blob], img.name || 'image.jpg', { type: 'image/jpeg' });
            const overlayEl = document.getElementById('moments-publish-overlay');
            if (overlayEl) {
                if ((overlayEl._publishImages || []).length >= 9) {
                    if (typeof showNotification === 'function') showNotification('最多9张', 'warning'); return;
                }
                overlayEl._publishImages = (overlayEl._publishImages || []).concat([file]);
                handlePublishImages({ files: [] });
            }
        });
        if (overlay) overlay.remove();
    }

    async function submitPublishMoment() {
        const overlay = document.getElementById('moments-publish-overlay');
        if (!overlay) return;
        const text = document.getElementById('moments-publish-text').value;
        const author = document.getElementById('moments-publish-author').value;
        const images = overlay._publishImages || [];
        if (!text.trim() && images.length === 0) {
            if (typeof showNotification === 'function') showNotification('请输入文字或选择图片', 'warning'); return;
        }
        const success = await publishMoment(text, images, null, author);
        if (success) {
            overlay.remove();
            if (typeof showNotification === 'function') showNotification('发布成功！✨', 'success');
        }
    }

    // ========== 主弹窗 ==========
    function openMomentsMainModal() {
        initMomentsData();
        const existing = document.getElementById('moments-main-overlay');
        if (existing) existing.remove();
        const modal = document.createElement('div');
        modal.className = 'moments-main-overlay';
        modal.id = 'moments-main-overlay';
        modal.innerHTML = `<div class="moments-main-modal"><div class="moments-main-header"><div class="moments-main-title"><i class="fas fa-globe-americas"></i><span>朋友圈</span></div><div class="moments-main-header-actions"><button class="moments-header-btn" onclick="window.openAutoSettingsModal()" title="自动设置"><i class="fas fa-robot"></i></button><button class="moments-header-btn" onclick="window.openMomentCardsManager()" title="字卡库"><i class="fas fa-comment-dots"></i></button><button class="moments-header-btn" onclick="window.openCommentCardsManager()" title="评论库"><i class="fas fa-comment-medical"></i></button><button class="moments-header-btn" onclick="window.openMomentImagesManager()" title="图片库"><i class="fas fa-images"></i></button><button class="moments-header-btn" onclick="document.getElementById('moments-main-overlay').remove()"><i class="fas fa-times"></i></button></div></div><div class="moments-main-body" id="moments-list"><div style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin"></i></div></div><div class="moments-main-footer"><button class="moments-publish-btn" onclick="window.openPublishMomentModal()"><i class="fas fa-plus-circle"></i> 发布朋友圈</button></div></div>`;
        modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
        renderMomentsList();
        startAutoTimers();
    }
    // ========== 头像上传 ==========
    function uploadMomentAvatar(type) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(ev) {
                localStorage.setItem('moment_avatar_' + type, ev.target.result);
                renderMomentsList();
                if (typeof showNotification === 'function') showNotification('头像已更新！✨', 'success');
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }

    function getMomentAvatar(user) {
        return localStorage.getItem('moment_avatar_' + user) || null;
    }

    window.uploadMomentAvatar = uploadMomentAvatar;

    // ========== 自动设置弹窗 ==========
    function openAutoSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'moments-card-picker-overlay';
        modal.id = 'auto-settings-overlay';
        modal.innerHTML = `<div class="moments-card-picker" style="max-width:420px;"><div class="moments-card-picker-header"><span>🤖 梦角自动设置</span><button onclick="document.getElementById('auto-settings-overlay').remove()"><i class="fas fa-times"></i></button></div><div style="padding:16px;overflow-y:auto;"><div style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;"><span>启用自动功能 <span id="auto-status-text" style="font-size:11px;font-weight:700;color:${autoSettings.enabled?'var(--accent-color)':'#999'};">${autoSettings.enabled?'🟢 已开启':'⚫ 已关闭'}</span></span><label style="position:relative;display:inline-block;width:44px;height:24px;"><input type="checkbox" id="auto-enabled" ${autoSettings.enabled?'checked':''} onchange="window.updateAutoSetting('enabled', this.checked)" style="opacity:0;width:0;height:0;"><span style="position:absolute;cursor:pointer;inset:0;background:${autoSettings.enabled?'var(--accent-color)':'#ccc'};border-radius:24px;transition:.3s;"></span></label></div><div style="margin-bottom:12px;"><label style="font-size:12px;color:var(--text-secondary);">发朋友圈间隔：<span id="post-val">${autoSettings.postInterval}</span>分钟</label><input type="range" min="5" max="10080" value="${autoSettings.postInterval}" oninput="document.getElementById('post-val').textContent=this.value;window.updateAutoSetting('postInterval', parseInt(this.value))" style="width:100%;accent-color:var(--accent-color);"></div><div style="margin-bottom:12px;"><label style="font-size:12px;color:var(--text-secondary);">评论/点赞间隔：<span id="comment-val">${autoSettings.commentInterval}</span>分钟</label><input type="range" min="1" max="60" value="${autoSettings.commentInterval}" oninput="document.getElementById('comment-val').textContent=this.value;window.updateAutoSetting('commentInterval', parseInt(this.value))" style="width:100%;accent-color:var(--accent-color);"></div><div style="margin-bottom:12px;"><label style="font-size:12px;color:var(--text-secondary);">点赞概率：<span id="like-val">${autoSettings.likeChance}</span>%</label><input type="range" min="0" max="100" value="${autoSettings.likeChance}" oninput="document.getElementById('like-val').textContent=this.value;window.updateAutoSetting('likeChance', parseInt(this.value))" style="width:100%;accent-color:var(--accent-color);"></div><div style="margin-bottom:12px;"><label style="font-size:12px;color:var(--text-secondary);">评论概率：<span id="comment-chance-val">${autoSettings.commentChance}</span>%</label><input type="range" min="0" max="100" value="${autoSettings.commentChance}" oninput="document.getElementById('comment-chance-val').textContent=this.value;window.updateAutoSetting('commentChance', parseInt(this.value))" style="width:100%;accent-color:var(--accent-color);"></div></div></div>`;
        modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    }

    window.updateAutoSetting = function(key, value) {
        autoSettings[key] = value;
        saveAutoSettings();
        startAutoTimers();
        const valEl = document.getElementById(key === 'postInterval' ? 'post-val' : key === 'commentInterval' ? 'comment-val' : key === 'likeChance' ? 'like-val' : 'comment-chance-val');
        if (valEl) valEl.textContent = value;
                const statusEl = document.getElementById('auto-status-text');
        if (statusEl && key === 'enabled') {
            statusEl.textContent = value ? '🟢 已开启' : '⚫ 已关闭';
            statusEl.style.color = value ? 'var(--accent-color)' : '#999';
        }
    };

    // ========== 字卡/图片管理 ==========
    function openMomentCardsManager() {
        const modal = document.createElement('div');
        modal.className = 'moments-card-picker-overlay';
        modal.id = 'moments-cards-manager-overlay';
        modal.innerHTML = `<div class="moments-card-picker" style="max-width:500px;"><div class="moments-card-picker-header"><span>📝 朋友圈字卡库</span><button onclick="document.getElementById('moments-cards-manager-overlay').remove()"><i class="fas fa-times"></i></button></div><div style="display:flex;gap:8px;padding:12px;"><input type="text" id="new-moment-card-input" placeholder="输入新字卡内容..." style="flex:1;padding:10px;border:1px solid var(--border-color);border-radius:8px;font-size:13px;background:var(--primary-bg);color:var(--text-primary);outline:none;"><button onclick="window.addMomentCardAndRefresh()" style="padding:10px 16px;background:var(--accent-color);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;">添加</button></div><div class="moments-card-picker-grid" id="moments-cards-manager-list">${momentCardsLibrary.map(card => `<div class="moments-card-picker-item" style="display:flex;justify-content:space-between;align-items:center;"><span>${card.text}</span><button onclick="window.removeMomentCardAndRefresh('${card.id}')" style="background:none;border:none;color:#ff5050;cursor:pointer;">×</button></div>`).join('')}</div></div>`;
        modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    }

    function addMomentCardAndRefresh() {
        const input = document.getElementById('new-moment-card-input');
        if (!input || !input.value.trim()) return;
        addMomentCard(input.value.trim());
        const overlay = document.getElementById('moments-cards-manager-overlay');
        if (overlay) { overlay.remove(); openMomentCardsManager(); }
    }

    function removeMomentCardAndRefresh(cardId) {
        removeMomentCard(cardId);
        const overlay = document.getElementById('moments-cards-manager-overlay');
        if (overlay) { overlay.remove(); openMomentCardsManager(); }
    }

    function openMomentImagesManager() {
        const modal = document.createElement('div');
        modal.className = 'moments-card-picker-overlay';
        modal.id = 'moments-images-manager-overlay';
        modal.innerHTML = `<div class="moments-card-picker" style="max-width:560px;"><div class="moments-card-picker-header"><span>🖼️ 朋友圈图片库</span><button onclick="document.getElementById('moments-images-manager-overlay').remove()"><i class="fas fa-times"></i></button></div><div style="padding:12px;"><button onclick="document.getElementById('moment-image-upload-input').click()" style="width:100%;padding:12px;border:2px dashed var(--border-color);border-radius:10px;background:transparent;cursor:pointer;"><i class="fas fa-cloud-upload-alt"></i> 点击上传图片到图库</button><input type="file" id="moment-image-upload-input" accept="image/*" multiple style="display:none;" onchange="window.uploadMomentImages(this)"></div><div class="moments-image-library-grid">${momentImagesLibrary.map(img => `<div class="moments-image-library-item" style="position:relative;"><img src="${img.dataUrl}"><button onclick="window.removeMomentImageAndRefresh('${img.id}')" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;">×</button></div>`).join('')}${momentImagesLibrary.length === 0 ? '<p style="text-align:center;padding:20px;grid-column:1/-1;">图片库为空</p>' : ''}</div></div>`;
        modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    }

    async function uploadMomentImages(input) {
        for (const file of Array.from(input.files)) { await addMomentImage(file); }
        input.value = '';
        const overlay = document.getElementById('moments-images-manager-overlay');
        if (overlay) { overlay.remove(); openMomentImagesManager(); }
    }

    function removeMomentImageAndRefresh(imageId) {
        removeMomentImage(imageId);
        const overlay = document.getElementById('moments-images-manager-overlay');
        if (overlay) { overlay.remove(); openMomentImagesManager(); }
    }

    // ========== 暴露全局方法 ==========
    window.openMomentsMainModal = openMomentsMainModal;
    window.openPublishMomentModal = openPublishMomentModal;
    window.handlePublishImages = handlePublishImages;
    window.removePublishImage = removePublishImage;
    window.openCardPickerForPublish = openCardPickerForPublish;
    window.pickCardForPublish = pickCardForPublish;
    window.openImageLibraryForPublish = openImageLibraryForPublish;
    window.pickImageForPublish = pickImageForPublish;
    window.submitPublishMoment = submitPublishMoment;
    window.toggleMomentLike = toggleLike;
    window.toggleCommentInput = toggleCommentInput;
    window.submitMomentComment = submitMomentComment;
    window.openCardPickerForComment = openCardPickerForComment;
    window.pickCardForComment = pickCardForComment;
    window.deleteMomentById = deleteMoment;
    window.viewMomentImage = viewMomentImage;
    window.openAutoSettingsModal = openAutoSettingsModal;
    window.openMomentCardsManager = openMomentCardsManager;
    window.openMomentImagesManager = openMomentImagesManager;
    window.addMomentCardAndRefresh = addMomentCardAndRefresh;
    window.removeMomentCardAndRefresh = removeMomentCardAndRefresh;
    window.uploadMomentImages = uploadMomentImages;
    window.removeMomentImageAndRefresh = removeMomentImageAndRefresh;

    initMomentsData();
    console.log('📱 朋友圈模块已加载（自动版）');
    // ========== 决策助手 ==========
    function openDecisionModal() {
        const modal = document.createElement('div');
        modal.className = 'moments-card-picker-overlay';
        modal.id = 'decision-overlay';
        modal.innerHTML = `<div class="moments-card-picker" style="max-width:420px;"><div class="moments-card-picker-header"><span>🎯 决策助手</span><button onclick="document.getElementById('decision-overlay').remove()"><i class="fas fa-times"></i></button></div><div style="padding:16px;"><div style="margin-bottom:12px;"><label style="font-size:13px;font-weight:600;color:var(--text-primary);">输入你的问题</label><input type="text" id="decision-question" placeholder="比如：我今天要不要出门？" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:10px;margin-top:6px;font-size:14px;background:var(--primary-bg);color:var(--text-primary);outline:none;box-sizing:border-box;"></div><div style="margin-bottom:12px;"><label style="font-size:13px;font-weight:600;color:var(--text-primary);">选项（每行一个，留空则是/否）</label><textarea id="decision-options" placeholder="选项1&#10;选项2&#10;选项3" rows="4" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:10px;margin-top:6px;font-size:14px;background:var(--primary-bg);color:var(--text-primary);outline:none;resize:none;box-sizing:border-box;"></textarea></div><button onclick="window.doDecision()" style="width:100%;padding:12px;background:var(--accent-color);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;">🎲 帮我决定</button><div id="decision-result" style="text-align:center;margin-top:14px;font-size:20px;font-weight:700;color:var(--accent-color);min-height:30px;"></div></div></div>`;
        modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    }
    function doDecision() {
        const question = document.getElementById('decision-question').value.trim();
        const optionsText = document.getElementById('decision-options').value.trim();
        const resultEl = document.getElementById('decision-result');
        resultEl.innerHTML = '<div style="font-size:18px;color:var(--accent-color);">🤔 思考中...</div>';
        const delay = 3000 + Math.floor(Math.random() * 2000);
        setTimeout(function() {
            if (optionsText) {
                const options = optionsText.split('\n').filter(o => o.trim());
                if (options.length === 0) { resultEl.textContent = '请至少输入一个选项'; return; }
                const result = options[Math.floor(Math.random() * options.length)];
                resultEl.innerHTML = `<div style="font-size:13px;color:var(--text-secondary);">${question || '决策结果'}</div><div style="font-size:24px;margin-top:6px;">👉 ${result}</div>`;
            } else {
                const answers = ['是 ✅', '否 ❌'];
                const result = answers[Math.floor(Math.random() * answers.length)];
                resultEl.innerHTML = `<div style="font-size:13px;color:var(--text-secondary);">${question || '决策结果'}</div><div style="font-size:28px;margin-top:6px;">${result}</div>`;
            }
        }, delay);
    }
    // ========== 表情包独立备份 ==========
    function exportStickersFromChat() {
        try {
            const backup = localStorage.getItem('BACKUP_V1_critical');
            if (!backup) {
                if (typeof showNotification === 'function') showNotification('暂无备份数据', 'warning');
                return;
            }
            const data = JSON.parse(backup);
            const stickers = [];
            JSON.stringify(data, (key, value) => {
                if (key === 'src' && typeof value === 'string' && value.startsWith('data:image')) {
                    stickers.push(value);
                }
                return value;
            });
            if (stickers.length === 0) {
                if (typeof showNotification === 'function') showNotification('未找到表情包', 'warning');
                return;
            }
            const exportData = { type: 'stickers_backup', stickers: stickers, count: stickers.length, date: new Date().toISOString() };
            const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '表情包备份_' + new Date().toISOString().slice(0,10) + '.json';
            a.click();
            URL.revokeObjectURL(url);
            if (typeof showNotification === 'function') showNotification('已导出 ' + stickers.length + ' 个表情包！✨', 'success');
        } catch(e) {
            if (typeof showNotification === 'function') showNotification('导出失败', 'error');
        }
    }

       function importStickersToChat() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.zip';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            if (file.name.endsWith('.zip')) {
                if (typeof JSZip === 'undefined') {
                    if (typeof showNotification === 'function') showNotification('正在准备解压工具，请稍后再点一次导入', 'warning');
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                    script.onload = () => importStickersToChat();
                    document.head.appendChild(script);
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(ev) {
                    JSZip.loadAsync(ev.target.result).then(function(zip) {
                        const promises = [];
                        const stickers = [];
                        zip.forEach(function(relativePath, zipEntry) {
                            if (!zipEntry.dir && /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(relativePath)) {
                                promises.push(
                                    zipEntry.async('base64').then(function(base64) {
                                        const ext = relativePath.split('.').pop().toLowerCase();
                                        const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
                                        stickers.push('data:image/' + mime + ';base64,' + base64);
                                    })
                                );
                            }
                        });
                        Promise.all(promises).then(function() {
                            if (stickers.length === 0) {
                                if (typeof showNotification === 'function') showNotification('压缩包中没有图片', 'warning');
                                return;
                            }
                            importStickersArray(stickers);
                        });
                    }).catch(function() {
                        if (typeof showNotification === 'function') showNotification('解压失败', 'error');
                    });
                };
                reader.readAsArrayBuffer(file);
                return;
            }
            const reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (!data.stickers || data.type !== 'stickers_backup') throw new Error('格式错误');
                    importStickersArray(data.stickers);
                } catch(err) {
                    if (typeof showNotification === 'function') showNotification('文件格式错误', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function importStickersArray(stickers) {
        const myName = (typeof settings !== 'undefined' && settings.myName) ? settings.myName : '我';
        const chatKey = Object.keys(localStorage).find(k => k.startsWith('session_') || k === 'chatData');
        const chatData = chatKey ? JSON.parse(localStorage.getItem(chatKey) || '{}') : {};
        const sessions = Object.keys(chatData);
        const targetSession = sessions[0] || 'default';
        if (!chatData[targetSession]) chatData[targetSession] = [];
        stickers.forEach(src => {
            chatData[targetSession].push({
                type: 'sticker',
                sender: myName,
                src: src,
                timestamp: Date.now()
            });
        });
        localStorage.setItem(chatKey || 'chatData', JSON.stringify(chatData));
        if (typeof showNotification === 'function') showNotification('已导入 ' + stickers.length + ' 个表情包！刷新后生效 ✨', 'success');
    }
       window.exportStickersFromChat = exportStickersFromChat;
    window.importStickersToChat = importStickersToChat;
    window.openDecisionModal = openDecisionModal;
    window.doDecision = doDecision;
    document.openMomentsMainModal = openMomentsMainModal;
    document.openPublishMomentModal = openPublishMomentModal;
    document.openDecisionModal = openDecisionModal;
    document.doDecision = doDecision;
    document.toggleMomentLike = toggleLike;
    document.submitMomentComment = submitMomentComment;
    document.toggleCommentInput = toggleCommentInput;
    document.deleteMomentById = deleteMoment;
    document.openAutoSettingsModal = openAutoSettingsModal;
    document.openMomentCardsManager = openMomentCardsManager;
    document.openMomentImagesManager = openMomentImagesManager;
    document.exportStickersFromChat = exportStickersFromChat;
    document.importStickersToChat = importStickersToChat;
    document.handlePublishImages = handlePublishImages;
    document.removePublishImage = removePublishImage;
    document.submitPublishMoment = submitPublishMoment;
       document.viewMomentImage = viewMomentImage;
})();
