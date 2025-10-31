/**
 * مدیریت رابط کاربری
 */

const UIHandler = {
    // وضعیت‌های هایلایت
    highlightStates: {
        sentences: false,
        paragraphs: false
    },

    // آرایه کلمات کلیدی فرعی
    secondaryKeywordsArray: [],

    // المان‌های DOM
    elements: {
        scoreCircle: null,
        scoreLabel: null,
        scoreDesc: null,
        wordCount: null,
        keywordCount: null,
        checksList: null,
        readabilityChecks: null,
        suggestionsContent: null,
        infoModal: null,
        infoTitle: null,
        infoBody: null,
        closeModalBtn: null,
        mainKeyword: null,
        secondaryKeywords: null,
        keywordsTags: null,
        seoBadge: null,
        readabilityBadge: null,
        tabs: null,
        tabContents: null
    },

    /**
     * مقداردهی اولیه
     */
    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.initializeKeywordTags();
    },

    /**
     * ذخیره‌سازی المان‌های DOM
     */
    cacheElements() {
        this.elements = {
            scoreCircle: document.getElementById('scoreCircle'),
            scoreLabel: document.getElementById('scoreLabel'),
            scoreDesc: document.getElementById('scoreDesc'),
            wordCount: document.getElementById('wordCount'),
            keywordCount: document.getElementById('keywordCount'),
            checksList: document.getElementById('checksList'),
            readabilityChecks: document.getElementById('readabilityChecks'),
            suggestionsContent: document.getElementById('suggestionsContent'),
            infoModal: document.getElementById('infoModal'),
            infoTitle: document.getElementById('infoTitle'),
            infoBody: document.getElementById('infoBody'),
            closeModalBtn: document.getElementById('closeModalBtn'),
            mainKeyword: document.getElementById('mainKeyword'),
            secondaryKeywords: document.getElementById('secondaryKeywords'),
            keywordsTags: document.getElementById('keywordsTags'),
            seoBadge: document.getElementById('seoBadge'),
            readabilityBadge: document.getElementById('readabilityBadge'),
            tabs: document.querySelectorAll('.seo-tab'),
            tabContents: document.querySelectorAll('.seo-tab-content')
        };
    },

    /**
     * اتصال Event Listeners
     */
    attachEventListeners() {
        // بستن مودال
        this.elements.closeModalBtn.addEventListener('click', () => {
            this.closeInfoModal();
        });

        // کلیک روی پس‌زمینه مودال
        this.elements.infoModal.addEventListener('click', (e) => {
            if (e.target.id === 'infoModal') {
                this.closeInfoModal();
            }
        });

        // کلید Escape برای بستن مودال
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeInfoModal();
            }
        });

        // مدیریت تب‌ها
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // مدیریت input کلمات کلیدی فرعی
        this.elements.secondaryKeywords.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addKeywordTag();
            } else if (e.key === 'Backspace' && e.target.value === '') {
                // حذف آخرین تگ با Backspace
                this.removeLastKeywordTag();
            }
        });

        // جلوگیری از submit فرم با Enter
        this.elements.secondaryKeywords.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    },

    /**
     * تعویض تب
     */
    switchTab(tabName) {
        // حذف active از همه تب‌ها
        this.elements.tabs.forEach(tab => {
            tab.classList.remove('active');
        });

        // حذف active از همه محتواها
        this.elements.tabContents.forEach(content => {
            content.classList.remove('active');
        });

        // فعال کردن تب انتخاب شده
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // فعال کردن محتوای مربوطه
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

    /**
     * مقداردهی اولیه تگ‌های کلمات کلیدی
     */
    initializeKeywordTags() {
        this.secondaryKeywordsArray = [];
        this.renderKeywordTags();
    },

    /**
     * افزودن تگ کلمه کلیدی جدید
     */
    addKeywordTag() {
        const input = this.elements.secondaryKeywords;
        const keyword = input.value.trim();

        if (!keyword) return;

        // بررسی تکراری نبودن
        if (this.secondaryKeywordsArray.includes(keyword)) {
            this.showTemporaryMessage('این کلمه قبلاً اضافه شده است', 'warning');
            input.value = '';
            return;
        }

        // افزودن به آرایه
        this.secondaryKeywordsArray.push(keyword);
        
        // رندر مجدد تگ‌ها
        this.renderKeywordTags();

        // پاک کردن input
        input.value = '';

        // تریگر تحلیل
        if (window.MainApp && window.MainApp.scheduleAnalysis) {
            window.MainApp.scheduleAnalysis();
        }
    },

    /**
     * حذف آخرین تگ کلمه کلیدی
     */
    removeLastKeywordTag() {
        if (this.secondaryKeywordsArray.length === 0) return;

        this.secondaryKeywordsArray.pop();
        this.renderKeywordTags();

        // تریگر تحلیل
        if (window.MainApp && window.MainApp.scheduleAnalysis) {
            window.MainApp.scheduleAnalysis();
        }
    },

    /**
     * حذف تگ کلمه کلیدی خاص
     */
    removeKeywordTag(keyword) {
        const index = this.secondaryKeywordsArray.indexOf(keyword);
        if (index > -1) {
            this.secondaryKeywordsArray.splice(index, 1);
            this.renderKeywordTags();

            // تریگر تحلیل
            if (window.MainApp && window.MainApp.scheduleAnalysis) {
                window.MainApp.scheduleAnalysis();
            }
        }
    },

    /**
     * رندر کردن تگ‌های کلمات کلیدی
     */
    renderKeywordTags() {
        const container = this.elements.keywordsTags;
        container.innerHTML = '';

        this.secondaryKeywordsArray.forEach(keyword => {
            const tag = document.createElement('div');
            tag.className = 'keyword-tag';
            
            const text = document.createElement('span');
            text.className = 'keyword-tag-text';
            text.textContent = keyword;
            text.title = keyword; // برای نمایش کامل در hover
            
            const removeBtn = document.createElement('span');
            removeBtn.className = 'keyword-tag-remove';
            removeBtn.innerHTML = '×';
            removeBtn.addEventListener('click', () => {
                this.removeKeywordTag(keyword);
            });
            
            tag.appendChild(text);
            tag.appendChild(removeBtn);
            container.appendChild(tag);
        });
    },

    /**
     * نمایش وضعیت بدون کلمه کلیدی
     */
    showNoKeywordState() {
        this.elements.keywordCount.textContent = '0';
        this.elements.scoreCircle.textContent = '--';
        this.elements.scoreLabel.textContent = CONFIG.MESSAGES.NO_KEYWORD.label;
        this.elements.scoreDesc.textContent = CONFIG.MESSAGES.NO_KEYWORD.desc;
        this.elements.checksList.innerHTML = '';
        this.elements.readabilityChecks.innerHTML = '';
    },

    /**
     * نمایش پیشنهادات کلمات کلیدی
     */
    showKeywordSuggestions(suggestions, plainText) {
        const wordCount = Utils.countWords(plainText);
        
        // به‌روزرسانی آمار
        this.elements.wordCount.textContent = wordCount;
        this.elements.keywordCount.textContent = '0';
        
        // نمایش امتیاز
        this.elements.scoreCircle.textContent = '💡';
        this.elements.scoreCircle.style.borderColor = '#667eea';
        this.elements.scoreCircle.style.background = 'rgba(102, 126, 234, 0.2)';
        this.elements.scoreLabel.textContent = 'پیشنهاد کلمات کلیدی';
        this.elements.scoreDesc.textContent = 'کلمات پرتکرار در متن یافت شد';
        
        // نمایش پیشنهادات
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
        
        // اتصال event listeners
        this.elements.checksList.querySelectorAll('.keyword-suggestion-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const keyword = e.currentTarget.getAttribute('data-keyword');
                this.handleKeywordSuggestionClick(keyword);
            });
        });
        
        // پاک کردن بخش خوانایی
        this.elements.readabilityChecks.innerHTML = '';
    },

    /**
     * به‌روزرسانی نمایش نتایج تحلیل
     */
    updateAnalysisResults(results, mainKeyword) {
        // به‌روزرسانی آمار
        this.elements.wordCount.textContent = results.totalWords;
        this.elements.keywordCount.textContent = results.keywordCount;

        // محاسبه امتیاز
        const score = SEOAnalyzer.calculateScore(results.checks);
        this.updateScore(score);

        // نمایش چک‌های SEO
        this.renderChecks(results.checks, this.elements.checksList);

        // نمایش چک‌های خوانایی
        this.renderChecks(results.readabilityChecks, this.elements.readabilityChecks);
    },

    /**
     * به‌روزرسانی نمایش امتیاز
     */
    updateScore(score) {
        this.elements.scoreCircle.textContent = score;

        let colors, message;
        if (score >= CONFIG.SCORE_THRESHOLDS.EXCELLENT) {
            colors = CONFIG.STATUS_COLORS.success;
            message = CONFIG.MESSAGES.EXCELLENT;
        } else if (score >= CONFIG.SCORE_THRESHOLDS.GOOD) {
            colors = CONFIG.STATUS_COLORS.warning;
            message = CONFIG.MESSAGES.GOOD;
        } else {
            colors = CONFIG.STATUS_COLORS.error;
            message = CONFIG.MESSAGES.POOR;
        }

        this.elements.scoreCircle.style.borderColor = colors.border;
        this.elements.scoreCircle.style.background = colors.background;
        this.elements.scoreLabel.textContent = message.label;
        this.elements.scoreDesc.textContent = message.desc;
    },

    /**
     * رندر کردن چک‌ها
     */
    renderChecks(checks, container) {
        const isReadabilitySection = container.id === 'readabilityChecks';
        
        if (isReadabilitySection) {
            container.innerHTML = checks.map(check => this.createReadabilityCheckHTML(check)).join('');
            
            // اتصال event listeners به آیکون‌های چشم
            container.querySelectorAll('.readability-check-eye').forEach(icon => {
                icon.addEventListener('click', (e) => {
                    const type = e.target.getAttribute('data-type');
                    this.toggleReadabilityHighlight(type);
                });
            });
        } else {
            container.innerHTML = checks.map(check => this.createCheckHTML(check)).join('');
        }
        
        // اتصال event listeners به آیکون‌های اطلاعات
        container.querySelectorAll('.check-info').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const title = e.target.getAttribute('data-title');
                const tooltip = e.target.getAttribute('data-tooltip');
                this.showInfoModal(title, tooltip);
            });
        });
        
        // اتصال event listeners به پیشنهادات کلمات کلیدی
        container.querySelectorAll('.keyword-suggestion-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const keyword = e.currentTarget.getAttribute('data-keyword');
                this.handleKeywordSuggestionClick(keyword);
            });
        });
    },

    /**
     * ساخت HTML برای یک چک
     */
    createCheckHTML(check) {
        const icon = CONFIG.STATUS_ICONS[check.status];
        const escapedTitle = Utils.escapeHtml(check.title);
        const escapedTooltip = Utils.escapeHtml(check.tooltip);
        
        let suggestionsHTML = '';
        if (check.suggestions && check.suggestions.length > 0) {
            // تعیین کلاس CSS بر اساس نوع چک
            const suggestionsClass = check.title.includes('اصلی') ? 'main-keyword-suggestions' : 
                                   check.title.includes('فرعی') ? 'secondary-keyword-suggestions' : 
                                   'keyword-suggestions';
            
            suggestionsHTML = `
                <div class="keyword-suggestions ${suggestionsClass}">
                    ${check.suggestions.map(suggestion => `
                        <div class="keyword-suggestion-item" data-keyword="${Utils.escapeHtml(suggestion.keyword)}">
                            <div class="keyword-suggestion-text">${Utils.escapeHtml(suggestion.keyword)}</div>
                            <div class="keyword-suggestion-meta">
                                <span class="keyword-suggestion-count">${suggestion.frequency}</span>
                                <span class="keyword-suggestion-type">${suggestion.type}</span>
                                ${suggestion.quality ? `<span class="keyword-suggestion-quality">Q:${suggestion.quality}</span>` : ''}
                                ${suggestion.relevance ? `<span class="keyword-suggestion-relevance">R:${suggestion.relevance}</span>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
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

    /**
     * ساخت HTML برای چک‌های خوانایی
     */
    createReadabilityCheckHTML(check) {
        const icon = CONFIG.STATUS_ICONS[check.status];
        const escapedTitle = Utils.escapeHtml(check.title);
        const escapedTooltip = Utils.escapeHtml(check.tooltip);
        
        // تعیین نوع آیکون چشم بر اساس عنوان
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

    /**
     * نمایش مودال اطلاعات
     */
    showInfoModal(title, body) {
        this.elements.infoTitle.innerHTML = title;
        this.elements.infoBody.innerHTML = body;
        this.elements.infoModal.classList.add('active');
    },

    /**
     * بستن مودال اطلاعات
     */
    closeInfoModal() {
        this.elements.infoModal.classList.remove('active');
    },

    /**
     * اعمال هایلایت‌ها به محتوا
     */
    applyHighlights() {
        const editor = window.editorInstance;
        if (!editor) return;

        const body = editor.getBody();
        
        // پاک کردن تمام هایلایت‌های قبلی
        this.clearHighlights(body);
        
        // اعمال هایلایت پاراگراف‌ها
        if (this.highlightStates.paragraphs) {
            this.highlightLongParagraphs(body);
        }
        
        // اعمال هایلایت جملات
        if (this.highlightStates.sentences) {
            this.highlightLongSentences(body);
        }
    },

    /**
     * پاک کردن تمام هایلایت‌ها
     */
    clearHighlights(body) {
        body.querySelectorAll('p').forEach(p => {
            p.style.background = '';
            p.style.borderRight = '';
            p.style.borderBottom = '';
            p.style.padding = '';
            p.style.borderRadius = '';
            p.style.position = '';
            
            // حذف برچسب‌های هشدار
            const badges = p.querySelectorAll('span[style*="position: absolute"]');
            badges.forEach(badge => badge.remove());
        });
    },

    /**
     * هایلایت پاراگراف‌های طولانی (بهبود یافته)
     */
    highlightLongParagraphs(body) {
        body.querySelectorAll('p').forEach(p => {
            const text = (p.textContent || '').trim();
            if (!text) return;
            
            const wordCount = Utils.countWords(text);
            
            // دسته‌بندی پاراگراف
            if (wordCount > 150) {
                // خیلی بلند - قرمز
                p.style.background = 'rgba(239, 68, 68, 0.15)';
                p.style.borderRight = '4px solid #ef4444';
                p.style.borderBottom = '2px solid #ef4444';
                p.style.padding = '12px';
                p.style.borderRadius = '6px';
                p.style.position = 'relative';
                
                // اضافه کردن برچسب هشدار
                const badge = document.createElement('span');
                badge.textContent = `⚠️ پاراگراف ${wordCount} کلمه‌ای`;
                badge.style.cssText = `
                    position: absolute;
                    top: 4px;
                    left: 8px;
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
                    z-index: 10;
                `;
                p.style.position = 'relative';
                if (!p.querySelector('span[style*="position: absolute"]')) {
                    p.appendChild(badge);
                }
            } else if (wordCount > 100) {
                // بلند - نارنجی
                p.style.background = 'rgba(245, 158, 11, 0.12)';
                p.style.borderRight = '4px solid #f59e0b';
                p.style.borderBottom = '2px solid #f59e0b';
                p.style.padding = '12px';
                p.style.borderRadius = '6px';
                p.style.position = 'relative';
                
                // اضافه کردن برچسب اطلاع
                const badge = document.createElement('span');
                badge.textContent = `⚡ پاراگراف ${wordCount} کلمه‌ای`;
                badge.style.cssText = `
                    position: absolute;
                    top: 4px;
                    left: 8px;
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    box-shadow: 0 2px 6px rgba(245, 158, 11, 0.4);
                    z-index: 10;
                `;
                p.style.position = 'relative';
                if (!p.querySelector('span[style*="position: absolute"]')) {
                    p.appendChild(badge);
                }
            }
        });
    },

    /**
     * هایلایت جملات طولانی (بهبود یافته)
     */
    highlightLongSentences(body) {
        body.querySelectorAll('p').forEach(p => {
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
            
            // رنگ‌آمیزی بر اساس بدترین حالت
            if (hasVeryLongSentence) {
                p.style.background = 'rgba(239, 68, 68, 0.15)';
                p.style.borderRight = '4px solid #ef4444';
                p.style.borderBottom = '2px solid #ef4444';
                p.style.padding = '12px';
                p.style.borderRadius = '6px';
                p.style.position = 'relative';
                
                // اضافه کردن برچسب هشدار
                const badge = document.createElement('span');
                badge.textContent = `⚠️ جمله ${maxWordCount} کلمه‌ای`;
                badge.style.cssText = `
                    position: absolute;
                    top: 4px;
                    left: 8px;
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
                    z-index: 10;
                `;
                p.style.position = 'relative';
                if (!p.querySelector('span[style*="position: absolute"]')) {
                    p.appendChild(badge);
                }
            } else if (hasLongSentence) {
                p.style.background = 'rgba(245, 158, 11, 0.12)';
                p.style.borderRight = '4px solid #f59e0b';
                p.style.borderBottom = '2px solid #f59e0b';
                p.style.padding = '12px';
                p.style.borderRadius = '6px';
                p.style.position = 'relative';
                
                // اضافه کردن برچسب هشدار
                const badge = document.createElement('span');
                badge.textContent = `⚡ جمله ${maxWordCount} کلمه‌ای`;
                badge.style.cssText = `
                    position: absolute;
                    top: 4px;
                    left: 8px;
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    box-shadow: 0 2px 6px rgba(245, 158, 11, 0.4);
                    z-index: 10;
                `;
                p.style.position = 'relative';
                if (!p.querySelector('span[style*="position: absolute"]')) {
                    p.appendChild(badge);
                }
            }
        });
    },

    /**
     * فعال/غیرفعال کردن هایلایت خوانایی
     */
    toggleReadabilityHighlight(type) {
        if (type === 'sentences') {
            this.highlightStates.sentences = !this.highlightStates.sentences;
        } else if (type === 'paragraphs') {
            this.highlightStates.paragraphs = !this.highlightStates.paragraphs;
        }
        
        // به‌روزرسانی آیکون چشم
        const eyeIcon = document.querySelector(`[data-type="${type}"]`);
        if (eyeIcon) {
            eyeIcon.classList.toggle('active');
            eyeIcon.textContent = this.highlightStates[type] ? '👁️‍🗨️' : '👁️';
        }
        
        this.applyHighlights();
    },

    /**
     * مدیریت کلیک روی پیشنهاد کلمه کلیدی
     */
    handleKeywordSuggestionClick(keyword) {
        // بررسی اینکه آیا کلمه کلیدی اصلی خالی است یا نه
        const currentMainKeyword = this.elements.mainKeyword.value.trim();
        
        if (!currentMainKeyword) {
            // اگر کلمه کلیدی اصلی خالی است، آن را تنظیم کن
            this.elements.mainKeyword.value = keyword;
            this.elements.mainKeyword.focus();
            
            // نمایش پیام موفقیت
            this.showTemporaryMessage('کلمه کلیدی اصلی تنظیم شد: ' + keyword, 'success');
        } else {
            // اگر کلمه کلیدی اصلی پر است، به کلمات فرعی اضافه کن
            if (!this.secondaryKeywordsArray.includes(keyword)) {
                this.secondaryKeywordsArray.push(keyword);
                this.renderKeywordTags();
                this.elements.secondaryKeywords.focus();
                
                // نمایش پیام موفقیت
                this.showTemporaryMessage('کلمه کلیدی فرعی اضافه شد: ' + keyword, 'success');
            } else {
                // نمایش پیام هشدار
                this.showTemporaryMessage('این کلمه قبلاً اضافه شده است', 'warning');
            }
        }
        
        // اجرای تحلیل مجدد
        if (window.MainApp && window.MainApp.analyzeContent) {
            window.MainApp.analyzeContent();
        }
    },

    /**
     * نمایش پیام موقت
     */
    showTemporaryMessage(message, type = 'info') {
        // ایجاد عنصر پیام
        const messageEl = document.createElement('div');
        messageEl.className = `temporary-message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#667eea'};
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
        
        // اضافه کردن انیمیشن
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(messageEl);
        
        // حذف پیام بعد از 3 ثانیه
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            }, 300);
        }, 3000);
    },

    /**
     * دریافت مقادیر کلمات کلیدی
     */
    getKeywords() {
        return {
            mainKeyword: this.elements.mainKeyword.value.trim(),
            secondaryKeywords: this.secondaryKeywordsArray
        };
    }
};

// Export برای استفاده در سایر ماژول‌ها
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIHandler;
}