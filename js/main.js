/**
 * نقطه ورود اصلی برنامه 
 */

// ✅ بهینه‌سازی: فیلتر خطاهای extension
const originalError = console.error;
console.error = function(...args) {
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('CRLError') || args[0].includes('detector.js'))) {
        return;
    }
    originalError.apply(console, args);
};

const App = {
    analysisTimeout: null,
    
    _lastAnalysis: {
        content: '',
        mainKeyword: '',
        secondaryKeywords: [],
        timestamp: 0
    },

    init() {
        UIHandler.init();
        EditorManager.init(() => this.scheduleAnalysis());
        this.attachKeywordListeners();
        console.log('✅ برنامه با موفقیت راه‌اندازی شد');
    },

    attachKeywordListeners() {
        const mainKeywordInput = document.getElementById('mainKeyword');
        mainKeywordInput.addEventListener('input', Utils.debounce(() => {
            this.scheduleAnalysis();
        }, 300));
    },

    scheduleAnalysis() {
        clearTimeout(this.analysisTimeout);
        this.analysisTimeout = setTimeout(() => {
            this.performAnalysis();
        }, CONFIG.ANALYSIS.DEBOUNCE_DELAY);
    },

    // ✅ بهینه‌سازی: بررسی تغییرات با hash
    shouldAnalyze(content, mainKeyword, secondaryKeywords) {
        const now = Date.now();
        if (now - this._lastAnalysis.timestamp < 500) return false;
        
        return content !== this._lastAnalysis.content || 
               mainKeyword !== this._lastAnalysis.mainKeyword || 
               JSON.stringify(secondaryKeywords) !== JSON.stringify(this._lastAnalysis.secondaryKeywords);
    },

    saveAnalysisState(content, mainKeyword, secondaryKeywords) {
        this._lastAnalysis = {
            content,
            mainKeyword,
            secondaryKeywords: [...secondaryKeywords],
            timestamp: Date.now()
        };
    },

    performAnalysis() {
        if (!EditorManager.isReady()) {
            console.warn('⚠️ ادیتور هنوز آماده نیست');
            return;
        }

        const { mainKeyword, secondaryKeywords } = UIHandler.getKeywords();
        const content = EditorManager.getContent();
        const plainText = Utils.extractText(content);
        const wordCount = Utils.countWords(plainText);

        if (!this.shouldAnalyze(content, mainKeyword, secondaryKeywords)) return;

        // حالت 1: بدون کلمه کلیدی اصلی
        if (!mainKeyword) {
            if (wordCount > 50) {
                this.performKeywordSuggestionAnalysis(plainText);
            } else {
                UIHandler.showNoKeywordState();
            }
            this.saveAnalysisState(content, mainKeyword, secondaryKeywords);
            return;
        }

        // حالت 2: با کلمه کلیدی اصلی
        const results = SEOAnalyzer.analyze(content, mainKeyword, secondaryKeywords);

        UIHandler.updateAnalysisResults(results, mainKeyword);

        if (results.suggestionChecks?.length) {
            UIHandler.renderSuggestions(results.suggestionChecks);
        }

        UIHandler.applyHighlights();
        this.saveAnalysisState(content, mainKeyword, secondaryKeywords);

        console.log('📊 تحلیل انجام شد:', {
            score: SEOAnalyzer.calculateScore(results.checks),
            totalWords: results.totalWords,
            keywordCount: results.keywordCount,
            keywordDensity: results.keywordDensity.toFixed(2) + '%'
        });
    },

    // ✅ بهینه‌سازی: تابع کوتاه‌تر
    performKeywordSuggestionAnalysis(plainText) {
        const mainSuggestions = Utils.detectMainKeyword(plainText, 3);
        const secondarySuggestions = Utils.detectSecondaryKeywords(plainText, 5);
        
        if (!mainSuggestions.length && !secondarySuggestions.length) {
            UIHandler.showNoKeywordState();
            return;
        }

        const checks = [];
        
        if (mainSuggestions.length) {
            checks.push(this._createSuggestionCheck(
                'تشخیص کلمه کلیدی اصلی',
                'کلمه کلیدی اصلی مهم‌ترین عبارت در محتوا است که باید در عنوان، پاراگراف اول و چندین بار در متن تکرار شود.',
                mainSuggestions
            ));
        }
        
        if (secondarySuggestions.length) {
            checks.push(this._createSuggestionCheck(
                'تشخیص کلمات کلیدی فرعی',
                'کلمات کلیدی فرعی عبارات مرتبط با موضوع اصلی هستند که به بهبود سئو و جذب ترافیک بیشتر کمک می‌کنند.',
                secondarySuggestions
            ));
        }
        
        UIHandler.renderSuggestions(checks);
        
        // نمایش پیام در تب SEO
        const wordCount = Utils.countWords(plainText);
        this._updateSuggestionDisplay(wordCount, mainSuggestions.length, secondarySuggestions.length);
    },

    // ✅ بهینه‌سازی: تابع کمکی برای ساخت check
    _createSuggestionCheck(title, tooltip, suggestions) {
        const suggestionText = suggestions.map(s => `${s.keyword} (کیفیت: ${s.quality})`).join('، ');
        
        return {
            status: CONFIG.CHECK_STATUS.SUCCESS,
            title,
            tooltip,
            desc: `پیشنهادات: ${suggestionText}`,
            detail: suggestions.map(s => 
                `${s.keyword}: ${s.frequency} بار (کیفیت: ${s.quality}, ارتباط: ${s.relevance})`
            ).join('\n'),
            suggestions
        };
    },

    // ✅ بهینه‌سازی: تابع کمکی برای نمایش
    _updateSuggestionDisplay(wordCount, mainCount, secondaryCount) {
        UIHandler.elements.wordCount.textContent = wordCount;
        UIHandler.elements.keywordCount.textContent = '0';
        UIHandler.elements.scoreCircle.textContent = '💡';
        UIHandler.elements.scoreCircle.style.borderColor = '#667eea';
        UIHandler.elements.scoreCircle.style.background = 'rgba(102, 126, 234, 0.2)';
        UIHandler.elements.scoreLabel.textContent = 'پیشنهادات آماده است';
        UIHandler.elements.scoreDesc.textContent = 'به تب "پیشنهادات" بروید';
        
        UIHandler.elements.checksList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;">💡</div>
                <div style="font-size: 16px; font-weight: 600; color: #667eea; margin-bottom: 10px;">
                    پیشنهادات کلمه کلیدی آماده است!
                </div>
                <div style="font-size: 14px; color: #6c757d; line-height: 1.8;">
                    ${mainCount} پیشنهاد برای کلمه کلیدی اصلی<br>
                    ${secondaryCount} پیشنهاد برای کلمات کلیدی فرعی<br><br>
                    👉 به تب <strong>"پیشنهادات"</strong> بروید و روی هر کلمه کلیک کنید
                </div>
            </div>
        `;
        UIHandler.elements.readabilityChecks.innerHTML = '';
    },

    analyzeContent() {
        this.performAnalysis();
    }
};

// ✅ بهینه‌سازی: استفاده از IIFE
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            App.init();
            window.MainApp = App;
        });
    } else {
        App.init();
        window.MainApp = App;
    }
})();
