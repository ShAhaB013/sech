/**
 * تنظیمات و مدیریت TinyMCE Editor
 */

const EditorManager = {
    instance: null,

    /**
     * مقداردهی اولیه ادیتور
     */
    init(onContentChange) {
        // مدیریت خطاهای TinyMCE
        this.handleTinyMCEErrors();
        
        tinymce.init({
            selector: '#editor',
            language: CONFIG.TINYMCE.LANGUAGE,
            directionality: CONFIG.TINYMCE.DIRECTION,
            height: CONFIG.TINYMCE.HEIGHT,
            branding: false,
            menubar: CONFIG.TINYMCE.MENUBAR,
            plugins: CONFIG.TINYMCE.PLUGINS,
            toolbar: CONFIG.TINYMCE.TOOLBAR,
            license_key: 'gpl',
            
            content_style: `
                body { 
                    font-family: Tahoma, sans-serif; 
                    font-size: 14pt; 
                    line-height: 1.7; 
                    direction: rtl; 
                } 
                table { 
                    border-collapse: collapse; 
                    width: 100%; 
                } 
                table, th, td { 
                    border: 1px solid #ccc; 
                    padding: 4px; 
                } 
                img { 
                    max-width: 100%; 
                    height: auto; 
                    display: block; 
                } 
                [dir="ltr"] { 
                    direction: ltr; 
                }
            `,
            
            paste_as_text: false,
            paste_data_images: true,
            paste_merge_formats: true,
            paste_webkit_styles: 'all',
            paste_auto_cleanup_on_paste: true,
            paste_remove_styles_if_webkit: false,
            paste_block_drop: false,
            
            setup: (editor) => {
                editor.on('init', () => {
                    this.instance = editor;
                    window.editorInstance = editor; // برای دسترسی جهانی
                    
                    // اجرای تحلیل اولیه
                    if (onContentChange) {
                        onContentChange();
                    }
                });
                
                // کنترل paste برای حفظ استایل‌ها و تصاویر
                editor.on('paste', (e) => {
                    const clipboardData = e.clipboardData || window.clipboardData;
                    if (!clipboardData) return;
                    
                    const items = clipboardData.items;
                    let hasImageFile = false;
                    
                    // بررسی وجود فایل تصویر
                    if (items) {
                        for (let item of items) {
                            if (item.type.indexOf('image') !== -1 && item.kind === 'file') {
                                hasImageFile = true;
                                break;
                            }
                        }
                    }
                    
                    // اگر فایل تصویر وجود دارد، از handler تصویر استفاده کن
                    if (hasImageFile) {
                        e.preventDefault();
                        
                        for (let item of items) {
                            if (item.type.indexOf('image') !== -1 && item.kind === 'file') {
                                const file = item.getAsFile();
                                if (file && file instanceof Blob) {
                                    const reader = new FileReader();
                                    
                                    reader.onload = (readerEvent) => {
                                        const img = `<img src="${readerEvent.target.result}" style="max-width: 100%; height: auto;" />`;
                                        editor.insertContent(img);
                                    };
                                    
                                    reader.onerror = () => {
                                        console.warn('⚠️ خطا در خواندن فایل تصویر');
                                    };
                                    
                                    reader.readAsDataURL(file);
                                }
                            }
                        }
                        return;
                    }
                    
                    // در غیر این صورت، از handler HTML/Text استفاده کن
                    const htmlData = clipboardData.getData('text/html');
                    const textData = clipboardData.getData('text/plain');
                    
                    if (htmlData && htmlData.trim()) {
                        e.preventDefault();
                        // پردازش HTML برای حفظ استایل‌های مهم
                        const processedHtml = this.processPastedHTML(htmlData);
                        editor.insertContent(processedHtml);
                    } else if (textData && textData.trim()) {
                        e.preventDefault();
                        // paste متن ساده
                        editor.insertContent(textData);
                    }
                    // اگر هیچکدام نبود، رفتار پیش‌فرض TinyMCE اجرا می‌شود
                });
                
                // رویدادهای تغییر محتوا
                editor.on('input change undo redo', () => {
                    if (onContentChange) {
                        onContentChange();
                    }
                });
                
                // تحلیل خودکار هنگام paste
                editor.on('paste', () => {
                    setTimeout(() => {
                        if (onContentChange) {
                            onContentChange();
                        }
                    }, 100);
                });
                
                // تحلیل خودکار هنگام تایپ
                editor.on('keyup', Utils.debounce(() => {
                    if (onContentChange) {
                        onContentChange();
                    }
                }, 500));
            }
        });
    },

    /**
     * دریافت instance ادیتور
     */
    getInstance() {
        return this.instance;
    },

    /**
     * دریافت محتوای ادیتور
     */
    getContent() {
        return this.instance ? this.instance.getContent() : '';
    },

    /**
     * تنظیم محتوای ادیتور
     */
    setContent(content) {
        if (this.instance) {
            this.instance.setContent(content);
        }
    },

    /**
     * دریافت بدنه ادیتور (برای دسترسی مستقیم به DOM)
     */
    getBody() {
        return this.instance ? this.instance.getBody() : null;
    },

    /**
     * پاک کردن محتوای ادیتور
     */
    clear() {
        if (this.instance) {
            this.instance.setContent('');
        }
    },

    /**
     * بررسی اینکه آیا ادیتور آماده است یا نه
     */
    isReady() {
        return this.instance !== null;
    },

    /**
     * پردازش HTML paste شده
     */
    processPastedHTML(html) {
        // ایجاد عنصر موقت برای پردازش HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // حفظ استایل‌های مهم
        const allowedStyles = [
            'color', 'background-color', 'font-size', 'font-family', 
            'font-weight', 'font-style', 'text-decoration', 'text-align',
            'line-height', 'margin', 'padding', 'border', 'border-radius',
            'width', 'height', 'max-width', 'display'
        ];
        
        // پردازش تمام عناصر
        const processElement = (element) => {
            if (element.nodeType === Node.ELEMENT_NODE) {
                // حذف کلاس‌های غیرضروری
                if (element.className) {
                    element.removeAttribute('class');
                }
                
                // حذف ID های غیرضروری
                if (element.id) {
                    element.removeAttribute('id');
                }
                
                // حفظ استایل‌های مجاز
                if (element.style) {
                    const computedStyle = window.getComputedStyle(element);
                    const newStyle = {};
                    
                    allowedStyles.forEach(style => {
                        const value = computedStyle.getPropertyValue(style);
                        if (value && value !== 'initial' && value !== 'inherit' && value !== 'auto') {
                            newStyle[style] = value;
                        }
                    });
                    
                    // اعمال استایل‌های مجاز
                    Object.assign(element.style, newStyle);
                }
                
                // پردازش فرزندان
                Array.from(element.children).forEach(processElement);
            }
        };
        
        processElement(tempDiv);
        
        // تمیز کردن HTML نهایی
        let cleanHTML = tempDiv.innerHTML;
        
        // حذف تگ‌های غیرضروری
        cleanHTML = cleanHTML.replace(/<meta[^>]*>/gi, '');
        cleanHTML = cleanHTML.replace(/<link[^>]*>/gi, '');
        cleanHTML = cleanHTML.replace(/<script[^>]*>.*?<\/script>/gi, '');
        cleanHTML = cleanHTML.replace(/<style[^>]*>.*?<\/style>/gi, '');
        
        return cleanHTML;
    },

    /**
     * مدیریت خطاهای TinyMCE
     */
    handleTinyMCEErrors() {
        // مدیریت خطاهای عمومی
        window.addEventListener('error', (e) => {
            if (e.message && e.message.includes('tinymce')) {
                console.warn('⚠️ خطای TinyMCE:', e.message);
                e.preventDefault();
            }
        });
        
        // مدیریت خطاهای شبکه
        window.addEventListener('unhandledrejection', (e) => {
            if (e.reason && e.reason.message && e.reason.message.includes('tinymce')) {
                console.warn('⚠️ خطای شبکه TinyMCE:', e.reason.message);
                e.preventDefault();
            }
        });
        
        // بررسی وجود فایل‌های TinyMCE
        this.checkTinyMCEResources();
    },

    /**
     * بررسی وجود فایل‌های TinyMCE
     */
    checkTinyMCEResources() {
        const requiredFiles = [
            'tinymce/tinymce.min.js',
            'tinymce/themes/silver/theme.min.js',
            'tinymce/skins/ui/oxide/skin.min.css'
        ];
        
        requiredFiles.forEach(file => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = file;
            link.onerror = () => {
                console.warn(`⚠️ فایل TinyMCE یافت نشد: ${file}`);
            };
            document.head.appendChild(link);
        });
    }
};

// Export برای استفاده در سایر ماژول‌ها
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EditorManager;
}
