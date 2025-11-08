/**
 * مدیریت رابط کاربری - بهبود یافته با رفع Memory Leak
 */

const UIHandler = {
    highlightStates: {
        sentences: false,
        paragraphs: false
    },

    secondaryKeywordsArray: [],
    elements: {},
    
    // ✅ جدید: ذخیره reference به event listeners برای cleanup
    eventListeners: {
        modal: [],
        tabs: [],
        keywords: [],
        checks: []
    },

    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.initializeKeywordTags();
    },

    cacheElements() {
        const ids = [
            'scoreCircle', 'scoreLabel', 'scoreDesc', 'wordCount', 'keywordCount',
            'checksList', 'readabilityChecks', 'suggestionsContent', 'infoModal',
            'infoTitle', 'infoBody', 'closeModalBtn', 'mainKeyword',
            'secondaryKeywords', 'keywordsTags', 'seoBadge', 'readabilityBadge'
        ];
        
        this.elements = ids.reduce((acc, id) => {
            acc[id] = document.getElementById(id);
            return acc;
        }, {});
        
        this.elements.tabs = document.querySelectorAll('.seo-tab');
        this.elements.tabContents = document.querySelectorAll('.seo-tab-content');
    },

    // ✅ بهبود: cleanup event listeners قبلی
    cleanupEventListeners() {
        // پاک کردن modal listeners
        this.eventListeners.modal.forEach(({ element, type, handler }) => {
            if (element) element.removeEventListener(type, handler);
        });
        this.eventListeners.modal = [];

        // پاک کردن tab listeners
        this.eventListeners.tabs.forEach(({ element, type, handler }) => {
            if (element) element.removeEventListener(type, handler);
        });
        this.eventListeners.tabs = [];

        // پاک کردن keyword listeners
        this.eventListeners.keywords.forEach(({ element, type, handler }) => {
            if (element) element.removeEventListener(type, handler);
        });
        this.eventListeners.keywords = [];

        // پاک کردن check listeners
        this.eventListeners.checks.forEach(({ element, type, handler }) => {
            if (element) element.removeEventListener(type, handler);
        });
        this.eventListeners.checks = [];
    },

    attachEventListeners() {
        // پاک کردن listeners قبلی
        this.cleanupEventListeners();

        // Modal listeners
        const closeModalHandler = () => this.closeInfoModal();
        this.elements.closeModalBtn.addEventListener('click', closeModalHandler);
        this.eventListeners.modal.push({
            element: this.elements.closeModalBtn,
            type: 'click',
            handler: closeModalHandler
        });

        const modalClickHandler = (e) => {
            if (e.target.id === 'infoModal') {
                this.closeInfoModal();
            }
        };
        this.elements.infoModal.addEventListener('click', modalClickHandler);
        this.eventListeners.modal.push({
            element: this.elements.infoModal,
            type: 'click',
            handler: modalClickHandler
        });

        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeInfoModal();
            }
        };
        document.addEventListener('keydown', escapeHandler);
        this.eventListeners.modal.push({
            element: document,
            type: 'keydown',
            handler: escapeHandler
        });

        // Tab listeners
        this.elements.tabs.forEach(tab => {
            const tabClickHandler = (e) => {
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tabName);
            };
            tab.addEventListener('click', tabClickHandler);
            this.eventListeners.tabs.push({
                element: tab,
                type: 'click',
                handler: tabClickHandler
            });
        });

        // Keyword input listeners
        const keydownHandler = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addKeywordTag();
            } else if (e.key === 'Backspace' && e.target.value === '') {
                this.removeLastKeywordTag();
            }
        };
        this.elements.secondaryKeywords.addEventListener('keydown', keydownHandler);
        this.eventListeners.keywords.push({
            element: this.elements.secondaryKeywords,
            type: 'keydown',
            handler: keydownHandler
        });

        const keypressHandler = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        };
        this.elements.secondaryKeywords.addEventListener('keypress', keypressHandler);
        this.eventListeners.keywords.push({
            element: this.elements.secondaryKeywords,
            type: 'keypress',
            handler: keypressHandler
        });
    },

    switchTab(tabName) {
        this.elements.tabs.forEach(tab => {
            tab.classList.remove('active');
        });

        this.elements.tabContents.forEach(content => {
            content.classList.remove('active');
        });

        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        const tabContentMap = {
            'seo': 'seoTab',
            'readability': 'readabilityTab',
            'suggestions': 'suggestionsTab'
        };

        const contentId = tabContentMap[tabName];
        const activeContent = document.getElementById(contentId);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    },

    initializeKeywordTags() {
        this.secondaryKeywordsArray = [];
        this.renderKeywordTags();
    },

    addKeywordTag() {
        const input = this.elements.secondaryKeywords;
        const keyword = input.value.trim();

        if (!keyword) return;

        if (this.secondaryKeywordsArray.includes(keyword)) {
            this.showTemporaryMessage('این کلمه قبلاً اضافه شده است', 'warning');
            input.value = '';
            return;
        }

        this.secondaryKeywordsArray.push(keyword);
        this.renderKeywordTags();
        input.value = '';

        if (window.MainApp && window.MainApp.scheduleAnalysis) {
            window.MainApp.scheduleAnalysis();
        }
    },

    removeLastKeywordTag() {
        if (this.secondaryKeywordsArray.length === 0) return;

        this.secondaryKeywordsArray.pop();
        this.renderKeywordTags();

        if (window.MainApp && window.MainApp.scheduleAnalysis) {
            window.MainApp.scheduleAnalysis();
        }
    },

    removeKeywordTag(keyword) {
        const index = this.secondaryKeywordsArray.indexOf(keyword);
        if (index > -1) {
            this.secondaryKeywordsArray.splice(index, 1);
            this.renderKeywordTags();

            if (window.MainApp && window.MainApp.scheduleAnalysis) {
                window.MainApp.scheduleAnalysis();
            }
        }
    },

    renderKeywordTags() {
        const container = this.elements.keywordsTags;
        const fragment = document.createDocumentFragment();

        this.secondaryKeywordsArray.forEach(keyword => {
            const tag = document.createElement('div');
            tag.className = 'keyword-tag';
            
            const text = document.createElement('span');
            text.className = 'keyword-tag-text';
            text.textContent = keyword;
            text.title = keyword;
            
            const removeBtn = document.createElement('span');
            removeBtn.className = 'keyword-tag-remove';
            removeBtn.innerHTML = '×';
            removeBtn.addEventListener('click', () => {
                this.removeKeywordTag(keyword);
            });
            
            tag.appendChild(text);
            tag.appendChild(removeBtn);
            fragment.appendChild(tag);
        });

        container.innerHTML = '';
        container.appendChild(fragment);
    },

    showNoKeywordState() {
        this.elements.keywordCount.textContent = '0';
        this.elements.scoreCircle.textContent = '--';
        this.elements.scoreLabel.textContent = CONFIG.MESSAGES.NO_KEYWORD.label;
        this.elements.scoreDesc.textContent = CONFIG.MESSAGES.NO_KEYWORD.desc;
        this.elements.checksList.innerHTML = '';
        this.elements.readabilityChecks.innerHTML = '';
        
        if (this.elements.suggestionsContent) {
            this.elements.suggestionsContent.innerHTML = '';
        }
    },

    showKeywordSuggestions(suggestions, plainText) {
        const wordCount = Utils.countWords(plainText);
        
        this.elements.wordCount.textContent = wordCount;
        this.elements.keywordCount.textContent = '0';
        
        this.elements.scoreCircle.textContent = '💡';
        this.elements.scoreCircle.style.borderColor = '#667eea';
        this.elements.scoreCircle.style.background = 'rgba(102, 126, 234, 0.2)';
        this.elements.scoreLabel.textContent = 'پیشنهاد کلمات کلیدی';
        this.elements.scoreDesc.textContent = 'کلمات پرتکرار در متن یافت شد';
        
        const suggestionCheck = {
            status: CONFIG.CHECK_STATUS.SUCCESS,
            title: 'پیشنهاد کلمات کلیدی',
            tooltip: 'بر اساس تحلیل محتوا، کلمات پرتکرار به عنوان کلمات کلیدی پیشنهاد می‌شوند.',
            desc: `بر اساس ${wordCount} کلمه، ${suggestions.length} پیشنهاد یافت شد`,
            detail: suggestions.map(s => 
                `${s.keyword}: ${s.frequency} بار (${s.type})`
            ).join('\n'),
            suggestions: suggestions
        };
        
        this.elements.checksList.innerHTML = this.createCheckHTML(suggestionCheck);
        this.attachCheckEventListeners(this.elements.checksList, false);
        this.elements.readabilityChecks.innerHTML = '';
    },

    updateAnalysisResults(results, mainKeyword) {
        this.elements.wordCount.textContent = results.totalWords;
        this.elements.keywordCount.textContent = results.keywordCount;

        const score = SEOAnalyzer.calculateScore(results.checks);
        this.updateScore(score);

        this.renderChecks(results.checks, this.elements.checksList);
        this.renderChecks(results.readabilityChecks, this.elements.readabilityChecks);

        if (results.suggestionChecks && results.suggestionChecks.length > 0) {
            this.renderSuggestions(results.suggestionChecks);
        }
    },

    updateScore(score) {
        // تنظیم عدد امتیاز
        this.elements.scoreCircle.textContent = score;

        let message, colorClass;
        if (score >= CONFIG.SCORE_THRESHOLDS.EXCELLENT) {
            message = CONFIG.MESSAGES.EXCELLENT;
            colorClass = 'excellent';
        } else if (score >= CONFIG.SCORE_THRESHOLDS.GOOD) {
            message = CONFIG.MESSAGES.GOOD;
            colorClass = 'good';
        } else {
            message = CONFIG.MESSAGES.POOR;
            colorClass = 'poor';
        }

        // آپدیت متن‌ها
        this.elements.scoreLabel.textContent = message.label;
        this.elements.scoreDesc.textContent = message.desc;
        
        // آپدیت progress bar
        const progressFill = document.querySelector('.score-progress-fill');
        if (progressFill) {
            progressFill.style.width = score + '%';
            progressFill.className = 'score-progress-fill ' + colorClass;
        }
    },

    renderChecks(checks, container) {
        const isReadabilitySection = container.id === 'readabilityChecks';
        
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');
        
        if (isReadabilitySection) {
            tempDiv.innerHTML = checks.map(check => this.createReadabilityCheckHTML(check)).join('');
        } else {
            tempDiv.innerHTML = checks.map(check => this.createCheckHTML(check)).join('');
        }
        
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }
        
        container.innerHTML = '';
        container.appendChild(fragment);
        
        this.attachCheckEventListeners(container, isReadabilitySection);
    },

    // ✅ بهبود: استفاده از event delegation بدون clone
    attachCheckEventListeners(container, isReadabilitySection) {
        if (!container || !container.parentNode) {
            console.warn('⚠️ Container موجود نیست');
            return;
        }

        // پاک کردن listeners قدیمی این container
        const oldListeners = this.eventListeners.checks.filter(
            l => l.element === container
        );
        oldListeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        
        // حذف از آرایه
        this.eventListeners.checks = this.eventListeners.checks.filter(
            l => l.element !== container
        );
        
        // اضافه کردن event listener جدید با delegation
        const clickHandler = (e) => {
            const infoIcon = e.target.closest('.check-info');
            if (infoIcon) {
                const title = infoIcon.getAttribute('data-title');
                const tooltip = infoIcon.getAttribute('data-tooltip');
                this.showInfoModal(title, tooltip);
                return;
            }
            
            if (isReadabilitySection) {
                const eyeIcon = e.target.closest('.readability-check-eye');
                if (eyeIcon) {
                    const type = eyeIcon.getAttribute('data-type');
                    this.toggleReadabilityHighlight(type);
                    return;
                }
            }
            
            const suggestionItem = e.target.closest('.keyword-suggestion-item');
            if (suggestionItem) {
                const keyword = suggestionItem.getAttribute('data-keyword');
                this.handleKeywordSuggestionClick(keyword);
            }
        };
        
        container.addEventListener('click', clickHandler);
        this.eventListeners.checks.push({
            element: container,
            type: 'click',
            handler: clickHandler
        });
    },

    createCheckHTML(check) {
        const icon = CONFIG.STATUS_ICONS[check.status];
        const escapedTitle = Utils.escapeHtml(check.title);
        const escapedTooltip = Utils.escapeHtml(check.tooltip);
        
        const suggestionsHTML = this._buildSuggestionsHTML(check);
        
        return `
            <div class="check-item">
                <div class="check-header">
                    <div class="check-icon ${check.status}">${icon}</div>
                    <div class="check-title">${check.title}</div>
                    <div class="check-info" data-title="${escapedTitle}" data-tooltip="${escapedTooltip}">ℹ</div>
                </div>
                <div class="check-desc">${check.desc}</div>
                ${check.detail ? `<div class="check-detail">${check.detail}</div>` : ''}
                ${suggestionsHTML}
            </div>
        `;
    },

    _buildSuggestionsHTML(check) {
        if (!check.suggestions || check.suggestions.length === 0) return '';
        
        const suggestionsClass = check.title.includes('اصلی') ? 'main-keyword-suggestions' : 
                               check.title.includes('فرعی') ? 'secondary-keyword-suggestions' : 
                               'keyword-suggestions';
        
        const items = check.suggestions.map(s => `
            <div class="keyword-suggestion-item" data-keyword="${Utils.escapeHtml(s.keyword)}">
                <div class="keyword-suggestion-text">${Utils.escapeHtml(s.keyword)}</div>
                <div class="keyword-suggestion-meta">
                    <span class="keyword-suggestion-count">${s.frequency}</span>
                    <span class="keyword-suggestion-type">${s.type}</span>
                    ${s.quality ? `<span class="keyword-suggestion-quality">Q:${s.quality}</span>` : ''}
                    ${s.relevance ? `<span class="keyword-suggestion-relevance">R:${s.relevance}</span>` : ''}
                </div>
            </div>
        `).join('');
        
        return `<div class="keyword-suggestions ${suggestionsClass}">${items}</div>`;
    },

    createReadabilityCheckHTML(check) {
        const icon = CONFIG.STATUS_ICONS[check.status];
        const escapedTitle = Utils.escapeHtml(check.title);
        const escapedTooltip = Utils.escapeHtml(check.tooltip);
        
        let eyeType = '';
        if (check.title.includes('جملات')) {
            eyeType = 'sentences';
        } else if (check.title.includes('پاراگراف')) {
            eyeType = 'paragraphs';
        }
        
        return `
            <div class="readability-check-item">
                <div class="readability-check-header">
                    <div class="readability-check-icon ${check.status}">${icon}</div>
                    <div class="readability-check-title">${check.title}</div>
                    ${eyeType ? `<div class="readability-check-eye" data-type="${eyeType}" title="نمایش ${check.title}">👁️</div>` : ''}
                    <div class="check-info" data-title="${escapedTitle}" data-tooltip="${escapedTooltip}">ℹ</div>
                </div>
                <div class="readability-check-desc">${check.desc}</div>
                ${check.detail ? `<div class="check-detail">${check.detail}</div>` : ''}
            </div>
        `;
    },

    showInfoModal(title, body) {
        this.elements.infoTitle.innerHTML = title;
        this.elements.infoBody.innerHTML = body;
        this.elements.infoModal.classList.add('active');
    },

    closeInfoModal() {
        this.elements.infoModal.classList.remove('active');
    },

    // ✅ بهبود شده: Performance optimization با batch processing
    applyHighlights() {
        const editor = window.editorInstance;
        if (!editor) return;

        // استفاده از requestAnimationFrame برای بهینه‌سازی
        if (this._highlightRAF) {
            cancelAnimationFrame(this._highlightRAF);
        }

        this._highlightRAF = requestAnimationFrame(() => {
            const body = editor.getBody();
            
            // پاک کردن highlights قبلی
            this.clearHighlights(body);
            
            // اعمال highlights جدید
            if (this.highlightStates.paragraphs) {
                this.highlightLongParagraphs(body);
            }
            
            if (this.highlightStates.sentences) {
                this.highlightLongSentences(body);
            }
            
            this._highlightRAF = null;
        });
    },

    // ✅ بهبود: پاک کردن سریع‌تر
    clearHighlights(body) {
        const paragraphs = body.querySelectorAll('p');
        const batch = [];
        
        paragraphs.forEach(p => {
            // ذخیره تغییرات در batch
            batch.push(() => {
                p.style.background = '';
                p.style.borderRight = '';
                p.style.borderBottom = '';
                p.style.padding = '';
                p.style.borderRadius = '';
                p.style.position = '';
            });
            
            // حذف badge ها
            const badges = p.querySelectorAll('span[style*="position: absolute"]');
            badges.forEach(badge => batch.push(() => badge.remove()));
        });
        
        // اعمال batch
        batch.forEach(fn => fn());
    },

    // ✅ بهبود: batch processing
    highlightLongParagraphs(body) {
        const paragraphs = body.querySelectorAll('p');
        const batch = [];
        
        paragraphs.forEach(p => {
            const text = (p.textContent || '').trim();
            if (!text) return;
            
            const wordCount = Utils.countWords(text);
            
            if (wordCount > 150) {
                batch.push({ element: p, wordCount, level: 'critical' });
            } else if (wordCount > 100) {
                batch.push({ element: p, wordCount, level: 'warning' });
            }
        });
        
        // اعمال استایل‌ها
        batch.forEach(({ element, wordCount, level }) => {
            this.applyHighlightStyle(element, wordCount, level, 'paragraph');
        });
    },

    // ✅ بهبود: batch processing
    highlightLongSentences(body) {
        const paragraphs = body.querySelectorAll('p');
        const batch = [];
        
        paragraphs.forEach(p => {
            const text = (p.textContent || '').trim();
            if (!text) return;
            
            const sentences = Utils.splitIntoSentences(text);
            let hasLongSentence = false;
            let hasVeryLongSentence = false;
            let maxWordCount = 0;
            
            for (let sentence of sentences) {
                const wordCount = Utils.countWords(sentence.trim());
                maxWordCount = Math.max(maxWordCount, wordCount);
                
                if (wordCount > 25) {
                    hasVeryLongSentence = true;
                    break;
                } else if (wordCount > 18) {
                    hasLongSentence = true;
                }
            }
            
            if (hasVeryLongSentence) {
                batch.push({ element: p, wordCount: maxWordCount, level: 'critical' });
            } else if (hasLongSentence) {
                batch.push({ element: p, wordCount: maxWordCount, level: 'warning' });
            }
        });
        
        batch.forEach(({ element, wordCount, level }) => {
            this.applyHighlightStyle(element, wordCount, level, 'sentence');
        });
    },

    applyHighlightStyle(element, wordCount, level, type) {
        const styles = {
            critical: {
                bg: 'rgba(239, 68, 68, 0.15)',
                border: '#ef4444',
                gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                icon: '⚠️'
            },
            warning: {
                bg: 'rgba(245, 158, 11, 0.12)',
                border: '#f59e0b',
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                icon: '⚡'
            }
        };
        
        const style = styles[level];
        if (!style) return;
        
        element.style.background = style.bg;
        element.style.borderRight = `4px solid ${style.border}`;
        element.style.borderBottom = `2px solid ${style.border}`;
        element.style.padding = '12px';
        element.style.borderRadius = '6px';
        element.style.position = 'relative';
        
        const badge = document.createElement('span');
        badge.textContent = `${style.icon} ${type === 'paragraph' ? 'پاراگراف' : 'جمله'} ${wordCount} کلمه‌ای`;
        badge.style.cssText = `
            position: absolute;
            top: 4px;
            left: 8px;
            background: ${style.gradient};
            color: white;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            box-shadow: 0 2px 6px rgba(${level === 'critical' ? '239, 68, 68' : '245, 158, 11'}, 0.4);
            z-index: 10;
        `;
        element.appendChild(badge);
    },

    toggleReadabilityHighlight(type) {
        if (type === 'sentences') {
            this.highlightStates.sentences = !this.highlightStates.sentences;
        } else if (type === 'paragraphs') {
            this.highlightStates.paragraphs = !this.highlightStates.paragraphs;
        }
        
        const eyeIcon = document.querySelector(`[data-type="${type}"]`);
        if (eyeIcon) {
            eyeIcon.classList.toggle('active');
            eyeIcon.textContent = this.highlightStates[type] ? '👁️‍🗨️' : '👁️';
        }
        
        this.applyHighlights();
    },

    handleKeywordSuggestionClick(keyword) {
        const clickedElement = event.target.closest('.keyword-suggestion-item');
        if (!clickedElement) return;
        
        const parentSuggestions = clickedElement.closest('.keyword-suggestions');
        const isMainKeywordSuggestion = parentSuggestions && parentSuggestions.classList.contains('main-keyword-suggestions');
        const isSecondaryKeywordSuggestion = parentSuggestions && parentSuggestions.classList.contains('secondary-keyword-suggestions');
        
        if (isMainKeywordSuggestion) {
            this.elements.mainKeyword.value = keyword;
            this.elements.mainKeyword.focus();
            this.showTemporaryMessage('کلمه کلیدی اصلی تنظیم شد: ' + keyword, 'success');
            
        } else if (isSecondaryKeywordSuggestion) {
            if (!this.secondaryKeywordsArray.includes(keyword)) {
                this.secondaryKeywordsArray.push(keyword);
                this.renderKeywordTags();
                this.elements.secondaryKeywords.focus();
                this.showTemporaryMessage('کلمه کلیدی فرعی اضافه شد: ' + keyword, 'success');
            } else {
                this.showTemporaryMessage('این کلمه قبلاً اضافه شده است', 'warning');
            }
            
        } else {
            const currentMainKeyword = this.elements.mainKeyword.value.trim();
            
            if (!currentMainKeyword) {
                this.elements.mainKeyword.value = keyword;
                this.elements.mainKeyword.focus();
                this.showTemporaryMessage('کلمه کلیدی اصلی تنظیم شد: ' + keyword, 'success');
            } else {
                if (!this.secondaryKeywordsArray.includes(keyword)) {
                    this.secondaryKeywordsArray.push(keyword);
                    this.renderKeywordTags();
                    this.elements.secondaryKeywords.focus();
                    this.showTemporaryMessage('کلمه کلیدی فرعی اضافه شد: ' + keyword, 'success');
                } else {
                    this.showTemporaryMessage('این کلمه قبلاً اضافه شده است', 'warning');
                }
            }
        }
        
        if (window.MainApp && window.MainApp.analyzeContent) {
            window.MainApp.analyzeContent();
        }
    },

    showTemporaryMessage(message, type = 'info') {
        const colors = {
            success: '#10b981',
            warning: '#f59e0b',
            info: '#667eea'
        };

        const messageEl = document.createElement('div');
        messageEl.className = `temporary-message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            font-family: 'Vazir', Tahoma, sans-serif;
            font-size: 14px;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    },

    renderSuggestions(suggestionChecks) {
        const container = this.elements.suggestionsContent;
        
        if (!container) return;
        
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');
        
        tempDiv.innerHTML = suggestionChecks.map(check => this.createCheckHTML(check)).join('');
        
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }
        
        container.innerHTML = '';
        container.appendChild(fragment);
        
        this.attachCheckEventListeners(container, false);
    },

    getKeywords() {
        return {
            mainKeyword: this.elements.mainKeyword.value.trim(),
            secondaryKeywords: this.secondaryKeywordsArray
        };
    },

    // ✅ جدید: cleanup method برای زمان destroy
    destroy() {
        this.cleanupEventListeners();
        if (this._highlightRAF) {
            cancelAnimationFrame(this._highlightRAF);
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIHandler;
}
