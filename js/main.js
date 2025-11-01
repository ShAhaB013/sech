/**
 * فیلتر خطاهای extension
 */
const originalError = console.error;
console.error = function(...args) {
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('CRLError') || args[0].includes('detector.js'))) {
        return;
    }
    originalError.apply(console, args);
};

/**
 * نقطه ورود اصلی برنامه - نسخه بهینه شده
 */

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
        EditorManager.init(() => {
            this.scheduleAnalysis();
        });
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

    shouldAnalyze(content, mainKeyword, secondaryKeywords) {
        const now = Date.now();
        if (now - this._lastAnalysis.timestamp < 500) {
            return false;
        }
        
        const contentChanged = content !== this._lastAnalysis.content;
        const mainKeywordChanged = mainKeyword !== this._lastAnalysis.mainKeyword;
        const secondaryKeywordsChanged = JSON.stringify(secondaryKeywords) !== JSON.stringify(this._lastAnalysis.secondaryKeywords);
        
        return contentChanged || mainKeywordChanged || secondaryKeywordsChanged;
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

        if (!this.shouldAnalyze(content, mainKeyword, secondaryKeywords)) {
            return;
        }

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

        // نمایش چک‌های SEO و خوانایی (بدون پیشنهادات)
        UIHandler.updateAnalysisResults(results, mainKeyword);

        // نمایش پیشنهادات فقط در تب پیشنهادات
        if (results.suggestionChecks && results.suggestionChecks.length > 0) {
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

    performKeywordSuggestionAnalysis(plainText) {
        const mainSuggestions = Utils.detectMainKeyword(plainText, 3);
        const secondarySuggestions = Utils.detectSecondaryKeywords(plainText, 5);
        
        if (mainSuggestions.length === 0 && secondarySuggestions.length === 0) {
            UIHandler.showNoKeywordState();
            return;
        }

        // ساخت چک‌های پیشنهادی
        const suggestionChecks = [];
        
        // چک کلمه کلیدی اصلی
        if (mainSuggestions.length > 0) {
            const suggestionText = mainSuggestions
                .map(s => `${s.keyword} (کیفیت: ${s.quality})`)
                .join('، ');
            
            suggestionChecks.push({
                status: CONFIG.CHECK_STATUS.SUCCESS,
                title: 'تشخیص کلمه کلیدی اصلی',
                tooltip: 'کلمه کلیدی اصلی مهم‌ترین عبارت در محتوا است که باید در عنوان، پاراگراف اول و چندین بار در متن تکرار شود.',
                desc: `پیشنهادات: ${suggestionText}`,
                detail: mainSuggestions.map(s => 
                    `${s.keyword}: ${s.frequency} بار (کیفیت: ${s.quality}, ارتباط: ${s.relevance})`
                ).join('\n'),
                suggestions: mainSuggestions
            });
        }
        
        // چک کلمات کلیدی فرعی
        if (secondarySuggestions.length > 0) {
            const suggestionText = secondarySuggestions
                .map(s => `${s.keyword} (کیفیت: ${s.quality})`)
                .join('، ');
            
            suggestionChecks.push({
                status: CONFIG.CHECK_STATUS.SUCCESS,
                title: 'تشخیص کلمات کلیدی فرعی',
                tooltip: 'کلمات کلیدی فرعی عبارات مرتبط با موضوع اصلی هستند که به بهبود سئو و جذب ترافیک بیشتر کمک می‌کنند.',
                desc: `پیشنهادات: ${suggestionText}`,
                detail: secondarySuggestions.map(s => 
                    `${s.keyword}: ${s.frequency} بار (کیفیت: ${s.quality}, ارتباط: ${s.relevance})`
                ).join('\n'),
                suggestions: secondarySuggestions
            });
        }
        
        // نمایش در تب پیشنهادات
        UIHandler.renderSuggestions(suggestionChecks);
        
        // نمایش پیام در تب SEO
        const wordCount = Utils.countWords(plainText);
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
                    ${mainSuggestions.length} پیشنهاد برای کلمه کلیدی اصلی<br>
                    ${secondarySuggestions.length} پیشنهاد برای کلمات کلیدی فرعی<br><br>
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
        window.MainApp = App;
    });
} else {
    App.init();
    window.MainApp = App;
}
