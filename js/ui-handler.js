/**
 * مدیریت رابط کاربری - نسخه بهینه شده
 */

const UIHandler = {
    highlightStates: {
        sentences: false,
        paragraphs: false
    },

    secondaryKeywordsArray: [],
    elements: {},

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
     * اتصال Event Listeners با Event Delegation
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
     * رندر کردن تگ‌های کلمات کلیدی با DocumentFragment (بهینه)
     */
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
        
        // پاک کردن تب پیشنهادات
        if (this.elements.suggestionsContent) {
            this.elements.suggestionsContent.innerHTML = '';
        }
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
        
        // Event delegation فقط یک بار - از طریق attachCheckEventListeners
        this.attachCheckEventListeners(this.elements.checksList, false);
        
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

        // نمایش پیشنهادات (اگر موجود باشد)
        if (results.suggestionChecks && results.suggestionChecks.length > 0) {
            this.renderSuggestions(results.suggestionChecks);
        }
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
     * رندر کردن چک‌ها با Event Delegation (بهینه)
     */
    renderChecks(checks, container) {
        const isReadabilitySection = container.id === 'readabilityChecks';
        
        // استفاده از DocumentFragment برای عملکرد بهتر
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
        
        // Event delegation برای جلوگیری از multiple event listeners
        this.attachCheckEventListeners(container, isReadabilitySection);
    },

    /**
     * Event delegation برای چک‌ها (بهینه) - با چک امنیت
     */
    attachCheckEventListeners(container, isReadabilitySection) {
        // چک وجود container
        if (!container || !container.parentNode) {
            console.warn('⚠️ Container موجود نیست');
            return;
        }

        // پاک کردن event listeners قبلی با clone
        const newContainer = container.cloneNode(true);
        container.parentNode.replaceChild(newContainer, container);
        
        // به‌روزرسانی reference در elements
        if (container.id === 'checksList') {
            this.elements.checksList = newContainer;
        } else if (container.id === 'readabilityChecks') {
            this.elements.readabilityChecks = newContainer;
        } else if (container.id === 'suggestionsContent') {
            this.elements.suggestionsContent = newContainer;
        }
        
        // اضافه کردن event listener جدید
        newContainer.addEventListener('click', (e) => {
            // کلیک روی آیکون اطلاعات
            const infoIcon = e.target.closest('.check-info');
            if (infoIcon) {
                const title = infoIcon.getAttribute('data-title');
                const tooltip = infoIcon.getAttribute('data-tooltip');
                this.showInfoModal(title, tooltip);
                return;
            }
            
            // کلیک روی آیکون چشم (خوانایی)
            if (isReadabilitySection) {
                const eyeIcon = e.target.closest('.readability-check-eye');
                if (eyeIcon) {
                    const type = eyeIcon.getAttribute('data-type');
                    this.toggleReadabilityHighlight(type);
                    return;
                }
            }
            
            // کلیک روی پیشنهاد کلمه کلیدی
            const suggestionItem = e.target.closest('.keyword-suggestion-item');
            if (suggestionItem) {
                const keyword = suggestionItem.getAttribute('data-keyword');
                this.handleKeywordSuggestionClick(keyword);
            }
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
     * اعمال هایلایت‌ها به محتوا با requestAnimationFrame (بهینه)
     */
    applyHighlights() {
        const editor = window.editorInstance;
        if (!editor) return;

        // استفاده از requestAnimationFrame برای رندر صاف‌تر
        requestAnimationFrame(() => {
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
        });
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
     * هایلایت پاراگراف‌های طولانی (بهینه شده با batch processing)
     */
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
        
        // اعمال استایل‌ها به صورت batch
        batch.forEach(({ element, wordCount, level }) => {
            this.applyHighlightStyle(element, wordCount, level, 'paragraph');
        });
    },

    /**
     * هایلایت جملات طولانی (بهینه شده با batch processing)
     */
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
        
        // اعمال استایل‌ها به صورت batch
        batch.forEach(({ element, wordCount, level }) => {
            this.applyHighlightStyle(element, wordCount, level, 'sentence');
        });
    },

    /**
     * اعمال استایل هایلایت (یکپارچه شده)
     */
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
     * مدیریت کلیک روی پیشنهاد کلمه کلیدی (بهبود یافته و دقیق)
     */
    handleKeywordSuggestionClick(keyword) {
        // تشخیص نوع پیشنهاد از روی DOM
        const clickedElement = event.target.closest('.keyword-suggestion-item');
        if (!clickedElement) return;
        
        const parentSuggestions = clickedElement.closest('.keyword-suggestions');
        const isMainKeywordSuggestion = parentSuggestions && parentSuggestions.classList.contains('main-keyword-suggestions');
        const isSecondaryKeywordSuggestion = parentSuggestions && parentSuggestions.classList.contains('secondary-keyword-suggestions');
        
        // منطق اضافه کردن
        if (isMainKeywordSuggestion) {
            // پیشنهادات اصلی همیشه به باکس اصلی می‌روند
            this.elements.mainKeyword.value = keyword;
            this.elements.mainKeyword.focus();
            this.showTemporaryMessage('کلمه کلیدی اصلی تنظیم شد: ' + keyword, 'success');
            
        } else if (isSecondaryKeywordSuggestion) {
            // پیشنهادات فرعی همیشه به باکس فرعی می‌روند
            if (!this.secondaryKeywordsArray.includes(keyword)) {
                this.secondaryKeywordsArray.push(keyword);
                this.renderKeywordTags();
                this.elements.secondaryKeywords.focus();
                this.showTemporaryMessage('کلمه کلیدی فرعی اضافه شد: ' + keyword, 'success');
            } else {
                this.showTemporaryMessage('این کلمه قبلاً اضافه شده است', 'warning');
            }
            
        } else {
            // پیشنهادات عمومی (بدون کلاس خاص)
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

    /**
     * نمایش پیام موقت (بهینه شده)
     */
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

    /**
     * رندر کردن پیشنهادات در تب پیشنهادات
     */
    renderSuggestions(suggestionChecks) {
        const container = this.elements.suggestionsContent;
        
        if (!container) return;
        
        // استفاده از DocumentFragment برای عملکرد بهتر
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');
        
        tempDiv.innerHTML = suggestionChecks.map(check => this.createCheckHTML(check)).join('');
        
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }
        
        container.innerHTML = '';
        container.appendChild(fragment);
        
        // Event delegation
        this.attachCheckEventListeners(container, false);
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIHandler;
}
