/**
 * تنظیمات و ثابت‌های برنامه -
 */

const CONFIG = {
    // محدودیت‌های SEO
    SEO_LIMITS: {
        MIN_KEYWORD_DENSITY: 0.5,
        MAX_KEYWORD_DENSITY: 2.5,
        MAX_SENTENCE_WORDS: 20,
        MAX_PARAGRAPH_WORDS: 150,
        WORDS_PER_IMAGE: 350,
        MAX_ACCEPTABLE_WORDS_PER_IMAGE: 400,
        MIN_SECONDARY_KEYWORD_PERCENTAGE: 70
    },

    // امتیازبندی SEO
    SCORE_THRESHOLDS: {
        EXCELLENT: 80,
        GOOD: 60
    },

    // تنظیمات تحلیل
    ANALYSIS: {
        DEBOUNCE_DELAY: 500
    },

    // پیام‌های وضعیت
    MESSAGES: {
        NO_KEYWORD: { label: 'در انتظار...', desc: 'لطفاً کلمه کلیدی اصلی را وارد کنید' },
        ANALYZING: { label: 'در حال تحلیل...', desc: 'لطفاً صبر کنید' },
        EXCELLENT: { label: 'عالی!', desc: 'محتوای شما بهینه است' },
        GOOD: { label: 'خوب', desc: 'نیاز به بهبود دارد' },
        POOR: { label: 'ضعیف', desc: 'محتوا نیاز به بهینه‌سازی دارد' }
    },

    // وضعیت‌های چک
    CHECK_STATUS: {
        SUCCESS: 'success',
        WARNING: 'warning',
        ERROR: 'error'
    },

    // نمادهای وضعیت
    STATUS_ICONS: {
        success: '✓',
        warning: '!',
        error: '✕'
    },

    // رنگ‌های وضعیت
    STATUS_COLORS: {
        success: { border: '#10b981', background: 'rgba(16, 185, 129, 0.2)' },
        warning: { border: '#f59e0b', background: 'rgba(245, 158, 11, 0.2)' },
        error: { border: '#ef4444', background: 'rgba(239, 68, 68, 0.2)' }
    },

    // تنظیمات TinyMCE
    TINYMCE: {
        HEIGHT: 700,
        LANGUAGE: 'fa',
        DIRECTION: 'rtl',
        PLUGINS: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount emoticons codesample directionality',
        TOOLBAR: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image table | removeformat',
        MENUBAR: 'file edit view insert format tools table help',
        RESIZE: true,
        ELEMENT_PATH: false,
        STATUS_BAR: true,
        BRANDING: false,
        CONTENT_CSS: false,
        PASTE_BLOCK_DROP: false,
        PASTE_DATA_IMAGES: true,
        PASTE_MERGE_FORMATS: true,
        PASTE_AUTO_CLEANUP_ON_PASTE: true,
        PASTE_REMOVE_STYLES_IF_WEBKIT: false,
        PASTE_WEBKIT_STYLES: 'all'
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
