const originalError = console.error;
console.error = function(...args) {
    // فیلتر خطاهای extension
    if (args[0] && typeof args[0] === 'string' && 
        (args[0].includes('CRLError') || args[0].includes('detector.js'))) {
        return; // نادیده بگیر
    }
    originalError.apply(console, args);
};
/**
 * نقطه ورود اصلی برنامه
 */

const App = {
    analysisTimeout: null,

    /**
     * مقداردهی اولیه برنامه
     */
    init() {
        // مقداردهی UI
        UIHandler.init();

        // مقداردهی ادیتور
        EditorManager.init(() => {
            this.scheduleAnalysis();
        });

        // اتصال event listeners برای کلمات کلیدی
        this.attachKeywordListeners();

        console.log('✅ برنامه با موفقیت راه‌اندازی شد');
    },

    /**
     * اتصال event listeners برای فیلدهای کلمه کلیدی
     */
    attachKeywordListeners() {
        const mainKeywordInput = document.getElementById('mainKeyword');
        const secondaryKeywordsInput = document.getElementById('secondaryKeywords');

        mainKeywordInput.addEventListener('input', () => {
            this.scheduleAnalysis();
        });

        secondaryKeywordsInput.addEventListener('input', () => {
            this.scheduleAnalysis();
        });
    },

    /**
     * زمان‌بندی تحلیل (با debounce)
     */
    scheduleAnalysis() {
        clearTimeout(this.analysisTimeout);
        this.analysisTimeout = setTimeout(() => {
            this.performAnalysis();
        }, CONFIG.ANALYSIS.DEBOUNCE_DELAY);
    },

    /**
     * انجام تحلیل SEO
     */
    performAnalysis() {
        if (!EditorManager.isReady()) {
            console.warn('⚠️ ادیتور هنوز آماده نیست');
            return;
        }

        // دریافت کلمات کلیدی
        const { mainKeyword, secondaryKeywords } = UIHandler.getKeywords();

        // دریافت محتوا
        const content = EditorManager.getContent();
        const plainText = Utils.extractText(content);
        const wordCount = Utils.countWords(plainText);

        // بررسی وجود کلمه کلیدی اصلی
        if (!mainKeyword) {
            // اگر کلمه کلیدی نداریم، فقط پیشنهادات کلمات کلیدی را نمایش دهیم
            if (wordCount > 50) {
                this.performKeywordSuggestionAnalysis(content, plainText);
            } else {
                UIHandler.showNoKeywordState();
            }
            return;
        }

        // انجام تحلیل کامل
        const results = SEOAnalyzer.analyze(content, mainKeyword, secondaryKeywords);

        // به‌روزرسانی UI
        UIHandler.updateAnalysisResults(results, mainKeyword);

        // اعمال هایلایت‌ها (اگر فعال باشند)
        UIHandler.applyHighlights();

        console.log('📊 تحلیل انجام شد:', {
            score: SEOAnalyzer.calculateScore(results.checks),
            totalWords: results.totalWords,
            keywordCount: results.keywordCount,
            keywordDensity: results.keywordDensity.toFixed(2) + '%'
        });
    },

    /**
     * تحلیل پیشنهاد کلمات کلیدی (بدون کلمه کلیدی اصلی)
     */
    performKeywordSuggestionAnalysis(content, plainText) {
        const suggestions = Utils.suggestKeywords(plainText, 5);
        
        if (suggestions.length > 0) {
            // نمایش پیشنهادات در UI
            UIHandler.showKeywordSuggestions(suggestions, plainText);
        } else {
            UIHandler.showNoKeywordState();
        }
    },

    /**
     * تحلیل محتوا (برای استفاده از سایر فایل‌ها)
     */
    analyzeContent() {
        this.performAnalysis();
    }
};

// راه‌اندازی برنامه پس از بارگذاری کامل صفحه
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
        window.MainApp = App; // برای دسترسی جهانی
    });
} else {
    App.init();
    window.MainApp = App; // برای دسترسی جهانی
}