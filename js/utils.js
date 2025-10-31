/**
 * توابع کمکی و Utilities
 */

const Utils = {
    /**
     * نرمال‌سازی متن (بهبود یافته برای فارسی)
     */
    normalizeText(text) {
        if (!text) return '';
        
        return text
            // حفظ نیم‌فاصله (ZWNJ) - مهم برای فارسی
            .replace(/\u200c/g, '\u200c')
            // حذف فاصله مجازی (ZWJ)
            .replace(/\u200d/g, '')
            // تبدیل فاصله بدون شکست به فاصله معمولی
            .replace(/\u00a0/g, ' ')
            // تبدیل تب و فاصله‌های متعدد به یک فاصله
            .replace(/[\t\r\n]+/g, ' ')
            .replace(/\s+/g, ' ')
            // حذف فاصله‌های ابتدا و انتها
            .trim()
            // تبدیل به حروف کوچک (برای مقایسه)
            .toLowerCase();
    },

    /**
     * نرمال‌سازی متن برای جستجو (بدون تغییر حروف بزرگ/کوچک)
     */
    normalizeTextForSearch(text) {
        if (!text) return '';
        
        return text
            .replace(/\u200c/g, '\u200c')
            .replace(/\u200d/g, '')
            .replace(/\u00a0/g, ' ')
            .replace(/[\t\r\n]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    },

    /**
     * نمایش متن با نیم‌فاصله
     */
    displayText(text) {
        return text.replace(/\u200c/g, '‌');
    },

    /**
     * استخراج متن خالص از HTML
     */
    extractText(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    },

    /**
     * استخراج متن خالص از HTML بدون هدینگ‌ها (برای محاسبه تراکم کلمه کلیدی)
     */
    extractTextWithoutHeadings(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        
        // حذف تمام هدینگ‌ها (H1 تا H6)
        const headings = div.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => heading.remove());
        
        return div.textContent || div.innerText || '';
    },

    /**
     * استخراج متن فقط از هدینگ‌ها (برای محاسبه تراکم کلمه کلیدی در هدینگ‌ها)
     */
    extractTextFromHeadings(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        
        // استخراج فقط هدینگ‌ها (H1 تا H6)
        const headings = div.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let headingsText = '';
        
        headings.forEach(heading => {
            headingsText += (heading.textContent || heading.innerText || '') + ' ';
        });
        
        return headingsText.trim();
    },

    /**
     * شمارش تعداد کلمات (بهبود یافته برای فارسی)
     */
    countWords(text) {
        if (!text || text.trim().length === 0) return 0;
        
        // حذف تگ‌های HTML
        text = text.replace(/<[^>]*>/g, ' ');
        
        // نرمال‌سازی نیم‌فاصله‌ها و فاصله‌های خاص
        // \u200c = نیم‌فاصله (ZWNJ)
        // \u200d = فاصله مجازی (ZWJ)
        // \u00a0 = فاصله بدون شکست (NBSP)
        text = text
            .replace(/\u200c/g, '\u200c')  // حفظ نیم‌فاصله
            .replace(/\u200d/g, '')         // حذف ZWJ
            .replace(/\u00a0/g, ' ')        // تبدیل NBSP به فاصله معمولی
            .replace(/\s+/g, ' ')           // یکی کردن فاصله‌های متوالی
            .trim();
        
        // حذف علائم نگارشی که به کلمات چسبیده‌اند
        // اما حفظ نیم‌فاصله بین کلمات
        text = text
            .replace(/[.!?؟۔،,;:\-_()[\]{}«»""'']/g, ' ')  // تبدیل علائم به فاصله
            .replace(/\s+/g, ' ')                          // یکی کردن فاصله‌ها
            .trim();
        
        // تقسیم بر اساس فاصله معمولی (نه نیم‌فاصله)
        // نیم‌فاصله باید جزئی از کلمه محسوب شود
        const words = text.split(' ').filter(word => {
            // حذف کلمات خالی و فقط نیم‌فاصله
            const cleanWord = word.replace(/\u200c/g, '').trim();
            return cleanWord.length > 0 && !/^[\d\s\u200c]+$/.test(cleanWord);
        });
        
        return words.length;
    },

    /**
     * تقسیم متن به کلمات (با حفظ نیم‌فاصله)
     */
    splitIntoWords(text) {
        if (!text || text.trim().length === 0) return [];
        
        // حذف تگ‌های HTML
        text = text.replace(/<[^>]*>/g, ' ');
        
        // نرمال‌سازی
        text = text
            .replace(/\u200d/g, '')         // حذف ZWJ
            .replace(/\u00a0/g, ' ')        // NBSP به فاصله
            .replace(/\s+/g, ' ')           // یکی کردن فاصله‌ها
            .trim();
        
        // حذف علائم نگارشی
        text = text
            .replace(/[.!?؟۔،,;:\-_()[\]{}«»""'']/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        // تقسیم بر اساس فاصله (نه نیم‌فاصله)
        return text.split(' ').filter(word => {
            const cleanWord = word.replace(/\u200c/g, '').trim();
            return cleanWord.length > 0 && !/^[\d\s\u200c]+$/.test(cleanWord);
        });
    },

    /**
     * پیدا کردن موقعیت‌های کلمه کلیدی در متن
     */
    findKeyword(text, keyword) {
        if (!keyword) return [];

        const normalizedText = this.normalizeText(text);
        const normalizedKeyword = this.normalizeText(keyword);
        const positions = [];
        let index = 0;

        while ((index = normalizedText.indexOf(normalizedKeyword, index)) !== -1) {
            positions.push(index);
            index += normalizedKeyword.length;
        }

        return positions;
    },

    /**
     * بررسی وجود کلمه کلیدی در بخش خاص HTML
     */
    hasKeywordInSection(html, keyword, selector) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const elements = temp.querySelectorAll(selector);

        for (let element of elements) {
            if (element.tagName === 'IMG') {
                const altText = element.getAttribute('alt') || '';
                if (this.findKeyword(altText, keyword).length > 0) {
                    return {
                        found: true,
                        text: this.displayText(altText.trim())
                    };
                }
            } else {
                const text = element.textContent || element.innerText;
                if (this.findKeyword(text, keyword).length > 0) {
                    return {
                        found: true,
                        text: this.displayText(text.trim())
                    };
                }
            }
        }

        return { found: false, text: '' };
    },

    /**
     * دریافت اولین پاراگراف محتوا (بدون H1)
     */
    getFirstParagraph(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // حذف عناوین H1
        temp.querySelectorAll('h1').forEach(h1 => h1.remove());
        
        const paragraphs = temp.querySelectorAll('p');
        for (let p of paragraphs) {
            const text = (p.textContent || p.innerText).trim();
            if (text.length > 0) {
                return text;
            }
        }
        
        return '';
    },

    /**
     * تقسیم متن به جملات (بهبود یافته برای فارسی)
     */
    splitIntoSentences(text) {
        // حذف فضاهای خالی اضافی
        text = text.trim().replace(/\s+/g, ' ');
        
        // جداکننده‌های جمله در فارسی و انگلیسی
        // شامل: نقطه، علامت سوال، علامت تعجب، و معادل‌های فارسی
        const sentenceEnders = /([.!?؟۔]\s+|[.!?؟۔]$)/g;
        
        // تقسیم بر اساس جداکننده‌ها
        let sentences = text.split(sentenceEnders);
        
        // فیلتر و تمیز کردن
        sentences = sentences
            .filter(s => s && s.trim().length > 0)
            .filter(s => !/^[.!?؟۔\s]+$/.test(s)) // حذف جملات فقط علامت
            .map(s => s.trim());
        
        // ادغام جملات کوتاه خیلی کوتاه (کمتر از 3 کلمه) با جمله بعدی
        const mergedSentences = [];
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i];
            const wordCount = this.countWords(sentence);
            
            // اگر جمله خیلی کوتاه است و جمله بعدی وجود دارد، ادغام کن
            if (wordCount < 3 && i < sentences.length - 1) {
                sentences[i + 1] = sentence + ' ' + sentences[i + 1];
            } else if (sentence.length > 0) {
                mergedSentences.push(sentence);
            }
        }
        
        return mergedSentences.filter(s => this.countWords(s) > 0);
    },

    /**
     * تحلیل پیچیدگی جمله (برای فارسی)
     */
    analyzeSentenceComplexity(sentence) {
        const wordCount = this.countWords(sentence);
        
        // شمارش کاراکترها (بدون فضای خالی)
        const charCount = sentence.replace(/\s+/g, '').length;
        
        // میانگین طول کلمات
        const avgWordLength = wordCount > 0 ? charCount / wordCount : 0;
        
        // شمارش عبارات وابسته (که، اگر، چون، ...)
        const conjunctions = [
            'که', 'اگر', 'چون', 'زیرا', 'هرچند', 'اما', 'ولی', 'لیکن',
            'بنابراین', 'در نتیجه', 'از این رو', 'به همین دلیل',
            'علاوه بر این', 'همچنین', 'ضمن اینکه'
        ];
        
        let conjunctionCount = 0;
        const lowerSentence = sentence.toLowerCase();
        conjunctions.forEach(conj => {
            const regex = new RegExp('\\b' + conj + '\\b', 'g');
            const matches = lowerSentence.match(regex);
            if (matches) conjunctionCount += matches.length;
        });
        
        // شمارش ویرگول‌ها (نشانه پیچیدگی)
        const commaCount = (sentence.match(/،/g) || []).length;
        
        // محاسبه امتیاز پیچیدگی (0-100)
        let complexityScore = 0;
        
        // تعداد کلمات (40% از امتیاز)
        if (wordCount > 25) complexityScore += 40;
        else if (wordCount > 20) complexityScore += 30;
        else if (wordCount > 15) complexityScore += 20;
        else complexityScore += 10;
        
        // میانگین طول کلمات (20% از امتیاز)
        if (avgWordLength > 7) complexityScore += 20;
        else if (avgWordLength > 6) complexityScore += 15;
        else if (avgWordLength > 5) complexityScore += 10;
        else complexityScore += 5;
        
        // تعداد عبارات وابسته (20% از امتیاز)
        complexityScore += Math.min(conjunctionCount * 5, 20);
        
        // تعداد ویرگول‌ها (20% از امتیاز)
        complexityScore += Math.min(commaCount * 4, 20);
        
        return {
            wordCount,
            charCount,
            avgWordLength: avgWordLength.toFixed(1),
            conjunctionCount,
            commaCount,
            complexityScore: Math.min(complexityScore, 100),
            isComplex: complexityScore > 60
        };
    },

    /**
     * دسته‌بندی جمله بر اساس طول و پیچیدگی
     */
    categorizeSentence(sentence) {
        const analysis = this.analyzeSentenceComplexity(sentence);
        const wordCount = analysis.wordCount;
        
        // معیارهای سئو برای جملات فارسی
        // جملات کوتاه: تا 12 کلمه (مناسب)
        // جملات متوسط: 13-18 کلمه (خوب)
        // جملات بلند: 19-25 کلمه (قابل قبول با هشدار)
        // جملات خیلی بلند: بیش از 25 کلمه (مشکل دار)
        
        if (wordCount <= 12) {
            return {
                category: 'short',
                level: 'good',
                message: 'جمله کوتاه و واضح',
                color: '#10b981'
            };
        } else if (wordCount <= 18) {
            return {
                category: 'medium',
                level: 'good',
                message: 'جمله با طول مناسب',
                color: '#10b981'
            };
        } else if (wordCount <= 25) {
            // اگر پیچیدگی بالا باشد، هشدار بده
            if (analysis.complexityScore > 70) {
                return {
                    category: 'long',
                    level: 'warning',
                    message: 'جمله بلند و پیچیده - خوانایی کم',
                    color: '#f59e0b',
                    suggestion: 'این جمله را به 2-3 جمله کوتاه‌تر تقسیم کنید'
                };
            }
            return {
                category: 'long',
                level: 'acceptable',
                message: 'جمله بلند اما قابل قبول',
                color: '#f59e0b'
            };
        } else {
            return {
                category: 'very_long',
                level: 'error',
                message: 'جمله خیلی بلند - مشکل خوانایی',
                color: '#ef4444',
                suggestion: 'حتماً این جمله را به چند جمله کوتاه‌تر تبدیل کنید'
            };
        }
    },

    /**
     * استخراج پاراگراف‌ها از HTML
     */
    extractParagraphs(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return Array.from(temp.querySelectorAll('p'))
            .map(p => (p.textContent || '').trim())
            .filter(p => p.length > 0);
    },

    /**
     * Debounce برای محدود کردن فراخوانی توابع
     */
    debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * Escape کاراکترهای خاص برای استفاده در HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * محاسبه درصد
     */
    calculatePercentage(value, total) {
        if (total === 0) return 0;
        return (value / total) * 100;
    },

    /**
     * فرمت کردن عدد به دو رقم اعشار
     */
    formatDecimal(number, decimals = 2) {
        return Number(number).toFixed(decimals);
    },

    /**
     * استخراج کلمات از متن با حفظ نیم‌فاصله (برای فارسی و انگلیسی)
     */
    extractWords(text) {
        if (!text) return [];
        
        // نرمال‌سازی اولیه (بدون حذف نیم‌فاصله)
        const normalizedText = text
            .replace(/\u200d/g, '')         // حذف ZWJ
            .replace(/\u00a0/g, ' ')        // NBSP به فاصله
            .replace(/[\t\r\n]+/g, ' ')     // تب و Enter به فاصله
            .toLowerCase();
        
        // حذف علائم نگارشی اما حفظ نیم‌فاصله و حروف
        // Unicode ranges:
        // \u0600-\u06FF: فارسی و عربی اصلی
        // \u0750-\u077F: عربی گسترده
        // \u08A0-\u08FF: عربی گسترده اضافی
        // \uFB50-\uFDFF: اشکال ارائه عربی
        // \uFE70-\uFEFF: اشکال نیم‌عرض عربی
        // \u200C: نیم‌فاصله (ZWNJ)
        // a-zA-Z: انگلیسی
        // 0-9: اعداد
        const cleanText = normalizedText
            .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u0020a-zA-Z0-9]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        // تقسیم به کلمات (فقط بر اساس فاصله معمولی)
        const words = cleanText.split(' ')
            .filter(word => {
                // حذف کلمات خالی
                if (!word || word.trim().length === 0) return false;
                
                // حذف کلمات فقط نیم‌فاصله
                const withoutZwnj = word.replace(/\u200c/g, '');
                if (withoutZwnj.trim().length === 0) return false;
                
                // حذف کلمات تک حرفی (به جز اعداد)
                if (withoutZwnj.length === 1 && !/\d/.test(withoutZwnj)) return false;
                
                // حذف اعداد خالص (اختیاری - بستگی به نیاز دارد)
                if (/^\d+$/.test(withoutZwnj)) return false;
                
                return true;
            });
        
        return words;
    },

    /**
     * تولید n-gram (ترکیبات کلمات)
     */
    generateNGrams(words, n = 2) {
        const ngrams = [];
        for (let i = 0; i <= words.length - n; i++) {
            const ngram = words.slice(i, i + n).join(' ');
            ngrams.push(ngram);
        }
        return ngrams;
    },

    /**
     * شمارش تکرار کلمات و ترکیبات
     */
    countWordFrequencies(text) {
        const words = this.extractWords(text);
        const wordCounts = {};
        
        // شمارش کلمات تکی
        words.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
        
        // شمارش bigrams (ترکیبات دو کلمه‌ای)
        const bigrams = this.generateNGrams(words, 2);
        bigrams.forEach(bigram => {
            wordCounts[bigram] = (wordCounts[bigram] || 0) + 1;
        });
        
        // شمارش trigrams (ترکیبات سه کلمه‌ای)
        const trigrams = this.generateNGrams(words, 3);
        trigrams.forEach(trigram => {
            wordCounts[trigram] = (wordCounts[trigram] || 0) + 1;
        });
        
        return wordCounts;
    },

    /**
     * فیلتر کردن کلمات غیرمرتبط (حروف اضافه، ضمایر، و غیره)
     */
    filterRelevantWords(wordCounts) {
        const stopWords = new Set([
            // حروف اضافه فارسی
            'از', 'در', 'به', 'با', 'برای', 'که', 'این', 'آن', 'را', 'را', 'را',
            'است', 'بود', 'خواهد', 'بوده', 'شده', 'می', 'نمی', 'باید', 'نباید',
            'هم', 'همه', 'هر', 'هیچ', 'چند', 'چقدر', 'چگونه', 'کجا', 'کی',
            'من', 'تو', 'او', 'ما', 'شما', 'آنها', 'خود', 'خودش', 'خودت',
            'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه', 'ده',
            'همچنین', 'همچنین', 'همچنین', 'همچنین', 'همچنین', 'همچنین',
            'لذا', 'بنابراین', 'از', 'این', 'رو', 'که', 'در', 'آن', 'است',
            'کلمات', 'کلمه', 'کلمات', 'کلمه', 'کلمات', 'کلمه',
            // کلمات انگلیسی رایج
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
            'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
            'can', 'cannot', 'could', 'should', 'would', 'may', 'might', 'must',
            'here', 'there', 'where', 'when', 'why', 'how', 'what', 'who', 'which'
        ]);
        
        const filtered = {};
        Object.entries(wordCounts).forEach(([word, count]) => {
            const lowerWord = word.toLowerCase();
            
            // بررسی کلمات بی‌معنا و فیلترهای اضافی
            if (this.isMeaningfulWord(word) && 
                !stopWords.has(lowerWord) && 
                count > 1 && 
                word.length > 2 &&
                this.isRelevantPhrase(word)) {
                filtered[word] = count;
            }
        });
        
        return filtered;
    },

    /**
     * بررسی اینکه آیا عبارت مرتبط است یا نه
     */
    isRelevantPhrase(phrase) {
        // حذف عبارات با کلمات غیرمرتبط
        const irrelevantPatterns = [
            /است که/, /بود که/, /خواهد که/, /می باشد/, /نمی باشد/,
            /این که/, /آن که/, /همه که/, /هر که/, /چند که/,
            /است در/, /بود در/, /خواهد در/, /می در/, /نمی در/,
            /است به/, /بود به/, /خواهد به/, /می به/, /نمی به/,
            /است از/, /بود از/, /خواهد از/, /می از/, /نمی از/,
            /است با/, /بود با/, /خواهد با/, /می با/, /نمی با/,
            /است برای/, /بود برای/, /خواهد برای/, /می برای/, /نمی برای/,
            // الگوهای جدید
            /برای که/, /برای این/, /برای آن/, /برای همه/, /برای هر/,
            /در که/, /در این/, /در آن/, /در همه/, /در هر/,
            /به که/, /به این/, /به آن/, /به همه/, /به هر/,
            /از که/, /از این/, /از آن/, /از همه/, /از هر/,
            /با که/, /با این/, /با آن/, /با همه/, /با هر/,
            // عبارات ناقص
            /^بهینه‌سازی برای$/, /^سئو برای$/, /^محتوا برای$/,
            /^طراحی برای$/, /^توسعه برای$/, /^بازاریابی برای$/
        ];
        
        // بررسی الگوهای غیرمرتبط
        for (let pattern of irrelevantPatterns) {
            if (pattern.test(phrase)) {
                return false;
            }
        }
        
        // بررسی کلمات تکراری در عبارت
        const words = phrase.split(' ');
        const uniqueWords = new Set(words);
        if (words.length > uniqueWords.size) {
            return false;
        }
        
        // بررسی وجود حداقل یک کلمه معنادار
        const meaningfulWords = words.filter(word => 
            word.length > 2 && 
            !['است', 'بود', 'خواهد', 'می', 'نمی', 'که', 'این', 'آن', 'را', 'برای', 'در', 'به', 'از', 'با'].includes(word)
        );
        
        // بررسی اینکه عبارت کامل و معنادار باشد
        if (meaningfulWords.length === 0) {
            return false;
        }
        
        // بررسی عدم وجود عبارات ناقص
        const incompletePatterns = [
            /^.+ برای$/, /^.+ در$/, /^.+ به$/, /^.+ از$/, /^.+ با$/,
            /^برای .+$/, /^در .+$/, /^به .+$/, /^از .+$/, /^با .+$/
        ];
        
        for (let pattern of incompletePatterns) {
            if (pattern.test(phrase)) {
                return false;
            }
        }
        
        return true;
    },

    /**
     * بررسی اینکه آیا کلمه معنادار است یا نه
     */
    isMeaningfulWord(word) {
        // حذف کلمات تک حرفی
        if (word.length <= 1) return false;
        
        // حذف کلمات فقط عدد
        if (/^\d+$/.test(word)) return false;
        
        // حذف کلمات فقط علائم نگارشی
        if (/^[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u200D\u0020-\u007F\u00A0-\u00FF]+$/.test(word)) return false;
        
        // حذف کلمات تکراری (مثل "آآآ" یا "هههه")
        if (/(.)\1{2,}/.test(word)) return false;
        
        // حذف کلمات با حروف مخلوط بی‌معنا
        if (word.length > 2 && /^[aeiouAEIOU]+$/.test(word)) return false;
        
        // حذف کلمات با اعداد مخلوط بی‌معنا
        if (/\d{2,}/.test(word) && word.length < 4) return false;
        
        // بررسی کلمات ترکیبی فارسی-انگلیسی بی‌معنا
        if (word.length > 3) {
            const persianChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u200D]/;
            const englishChars = /[a-zA-Z]/;
            const hasPersian = persianChars.test(word);
            const hasEnglish = englishChars.test(word);
            
            // اگر هم فارسی و هم انگلیسی دارد، بررسی کن که معنادار باشد
            if (hasPersian && hasEnglish) {
                // حذف کلمات مثل "آآآa" یا "testتست"
                if (word.length < 6) return false;
            }
        }
        
        return true;
    },

    /**
     * پیشنهاد کلمات کلیدی بر اساس تکرار و NLP
     */
    suggestKeywords(text, maxSuggestions = 10) {
        const wordCounts = this.countWordFrequencies(text);
        const filteredCounts = this.filterRelevantWords(wordCounts);
        
        // فیلتر کردن فقط ترکیبات دو و سه کلمه‌ای
        const meaningfulPhrases = {};
        Object.entries(filteredCounts).forEach(([word, count]) => {
            const wordCount = word.split(' ').length;
            if (wordCount >= 2 && wordCount <= 3) {
                meaningfulPhrases[word] = count;
            }
        });
        
        // بهبود عبارات ناقص
        const enhancedPhrases = this.enhanceIncompletePhrases(meaningfulPhrases, text);
        
        // استفاده از NLP برای بهبود کیفیت
        const nlpEnhanced = this.enhanceWithNLP(enhancedPhrases, text);
        
        // مرتب‌سازی بر اساس کیفیت و تکرار
        const sortedWords = Object.entries(nlpEnhanced)
            .sort(([,a], [,b]) => {
                // اولویت بر اساس کیفیت، سپس تکرار
                if (a.quality !== b.quality) {
                    return b.quality - a.quality;
                }
                return b.frequency - a.frequency;
            })
            .slice(0, maxSuggestions);
        
        return sortedWords.map(([word, data]) => ({
            keyword: word,
            frequency: data.frequency,
            type: word.split(' ').length === 2 ? 'دو کلمه' : 'سه کلمه',
            quality: data.quality,
            relevance: data.relevance
        }));
    },

    /**
     * بهبود عبارات ناقص
     */
    enhanceIncompletePhrases(phrases, text) {
        const enhanced = {};
        const plainText = this.extractText(text);
        
        Object.entries(phrases).forEach(([phrase, count]) => {
            // بررسی عبارات ناقص
            if (this.isIncompletePhrase(phrase)) {
                // جستجو برای عبارات کامل مشابه
                const completePhrase = this.findCompletePhrase(phrase, plainText);
                if (completePhrase && completePhrase !== phrase) {
                    enhanced[completePhrase] = count;
                }
            } else {
                enhanced[phrase] = count;
            }
        });
        
        return enhanced;
    },

    /**
     * بررسی اینکه آیا عبارت ناقص است یا نه
     */
    isIncompletePhrase(phrase) {
        const incompletePatterns = [
            /^.+ برای$/, /^.+ در$/, /^.+ به$/, /^.+ از$/, /^.+ با$/,
            /^برای .+$/, /^در .+$/, /^به .+$/, /^از .+$/, /^با .+$/
        ];
        
        return incompletePatterns.some(pattern => pattern.test(phrase));
    },

    /**
     * پیدا کردن عبارت کامل مشابه
     */
    findCompletePhrase(incompletePhrase, text) {
        const words = incompletePhrase.split(' ');
        const firstWord = words[0];
        const lastWord = words[words.length - 1];
        
        // جستجو برای عبارات کامل که شامل کلمات ناقص هستند
        const sentences = text.split(/[.!?؟۔]\s+/);
        
        for (let sentence of sentences) {
            const sentenceWords = sentence.toLowerCase().split(/\s+/);
            
            for (let i = 0; i <= sentenceWords.length - words.length; i++) {
                const candidate = sentenceWords.slice(i, i + words.length).join(' ');
                
                if (candidate.includes(firstWord) && candidate.includes(lastWord)) {
                    // بررسی اینکه آیا عبارت کامل‌تر است
                    if (candidate.length > incompletePhrase.length && 
                        this.isRelevantPhrase(candidate)) {
                        return candidate;
                    }
                }
            }
        }
        
        return null;
    },

    /**
     * بهبود پیشنهادات با استفاده از NLP
     */
    enhanceWithNLP(phrases, originalText) {
        const enhanced = {};
        
        Object.entries(phrases).forEach(([phrase, frequency]) => {
            const quality = this.calculateKeywordQuality(phrase, frequency);
            const relevance = this.calculateRelevance(phrase, originalText);
            
            enhanced[phrase] = {
                frequency,
                quality,
                relevance
            };
        });
        
        return enhanced;
    },

    /**
     * محاسبه ارتباط عبارت با متن اصلی
     */
    calculateRelevance(phrase, text) {
        let relevance = 0;
        
        // بررسی حضور در عناوین
        const titleMatches = this.findInTitles(phrase, text);
        if (titleMatches > 0) relevance += 3;
        
        // بررسی حضور در ابتدای پاراگراف‌ها
        const paragraphMatches = this.findInParagraphStarts(phrase, text);
        if (paragraphMatches > 0) relevance += 2;
        
        // بررسی تراکم در متن
        const density = this.calculatePhraseDensity(phrase, text);
        if (density > 0.5) relevance += 2;
        else if (density > 0.3) relevance += 1;
        
        // بررسی هم‌آیندی با کلمات مهم
        const cooccurrence = this.calculateCooccurrence(phrase, text);
        if (cooccurrence > 0) relevance += 1;
        
        return relevance;
    },

    /**
     * پیدا کردن عبارت در عناوین
     */
    findInTitles(phrase, text) {
        const temp = document.createElement('div');
        temp.innerHTML = text;
        const headings = temp.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        let matches = 0;
        headings.forEach(heading => {
            const headingText = heading.textContent.toLowerCase();
            if (headingText.includes(phrase.toLowerCase())) {
                matches++;
            }
        });
        
        return matches;
    },

    /**
     * پیدا کردن عبارت در ابتدای پاراگراف‌ها
     */
    findInParagraphStarts(phrase, text) {
        const temp = document.createElement('div');
        temp.innerHTML = text;
        const paragraphs = temp.querySelectorAll('p');
        
        let matches = 0;
        paragraphs.forEach(p => {
            const paragraphText = p.textContent.toLowerCase();
            const firstWords = paragraphText.split(' ').slice(0, 5).join(' ');
            if (firstWords.includes(phrase.toLowerCase())) {
                matches++;
            }
        });
        
        return matches;
    },

    /**
     * محاسبه تراکم عبارت در متن
     */
    calculatePhraseDensity(phrase, text) {
        const plainText = this.extractText(text);
        const totalWords = this.countWords(plainText);
        const phraseWords = phrase.split(' ').length;
        const phraseCount = this.findKeyword(plainText, phrase).length;
        
        return (phraseCount * phraseWords) / totalWords;
    },

    /**
     * محاسبه هم‌آیندی با کلمات مهم
     */
    calculateCooccurrence(phrase, text) {
        const importantWords = [
            'سئو', 'seo', 'بهینه', 'بهینه‌سازی', 'optimization', 'گوگل', 'google',
            'محتوا', 'content', 'بازاریابی', 'marketing', 'دیجیتال', 'digital',
            'وب', 'web', 'سایت', 'website', 'طراحی', 'design', 'توسعه', 'development',
            'کلمات', 'keywords', 'کلیدی', 'key', 'مهم', 'important', 'اصلی', 'main'
        ];
        
        const plainText = this.extractText(text);
        let cooccurrence = 0;
        
        importantWords.forEach(word => {
            if (plainText.toLowerCase().includes(word.toLowerCase())) {
                cooccurrence++;
            }
        });
        
        return cooccurrence;
    },

    /**
     * تشخیص کلمه کلیدی اصلی
     */
    detectMainKeyword(text, maxSuggestions = 3) {
    const wordCount = this.countWords(text);
    const suggestions = this.suggestKeywords(text, maxSuggestions * 3);
    
    // اگر هیچ پیشنهادی نیست، بازگشت خالی
    if (suggestions.length === 0) {
        return [];
    }
    
    // تعیین Threshold بر اساس طول متن (الگوریتم پویا)
    let qualityThreshold, relevanceThreshold, scoreThreshold;
    
    if (wordCount < 200) {
        qualityThreshold = 2;
        relevanceThreshold = 1;
        scoreThreshold = 3;
    } else if (wordCount < 400) {
        qualityThreshold = 3;
        relevanceThreshold = 2;
        scoreThreshold = 5;
    } else if (wordCount < 700) {
        qualityThreshold = 4;
        relevanceThreshold = 2;
        scoreThreshold = 6;
    } else if (wordCount < 1000) {
        qualityThreshold = 5;
        relevanceThreshold = 3;
        scoreThreshold = 8;
    } else {
        qualityThreshold = 6;
        relevanceThreshold = 4;
        scoreThreshold = 10;
    }
    
    // فیلتر اول: بر اساس threshold های انفرادی
    let mainKeywords = suggestions.filter(s => 
        s.quality >= qualityThreshold && s.relevance >= relevanceThreshold
    );
    
    // اگر نتیجه کم بود، فیلتر دوم: بر اساس مجموع امتیاز
    if (mainKeywords.length < maxSuggestions) {
        mainKeywords = suggestions.filter(s => 
            (s.quality + s.relevance) >= scoreThreshold
        );
    }
    
    // اگر باز هم نتیجه نیومد، فیلتر سوم: بهترین‌ها بدون شرط
    if (mainKeywords.length < maxSuggestions) {
        mainKeywords = suggestions
            .sort((a, b) => {
                const scoreA = a.quality + a.relevance;
                const scoreB = b.quality + b.relevance;
                return scoreB - scoreA;
            });
    }
    
    // محدود کردن به تعداد درخواستی
    mainKeywords = mainKeywords.slice(0, maxSuggestions);
    
    return mainKeywords;
},

    /**
     * تشخیص کلمات کلیدی فرعی
     */
    detectSecondaryKeywords(text, maxSuggestions = 5) {
    const wordCount = this.countWords(text);
    const suggestions = this.suggestKeywords(text, maxSuggestions * 2);
    
    // اگر هیچ پیشنهادی نیست، بازگشت خالی
    if (suggestions.length === 0) {
        return [];
    }
    
    // تعیین Threshold بر اساس طول متن (پایین‌تر از کلمات اصلی)
    let qualityThreshold, relevanceThreshold, scoreThreshold;
    
    if (wordCount < 200) {
        qualityThreshold = 1;
        relevanceThreshold = 1;
        scoreThreshold = 2;
    } else if (wordCount < 400) {
        qualityThreshold = 2;
        relevanceThreshold = 1;
        scoreThreshold = 3;
    } else if (wordCount < 700) {
        qualityThreshold = 3;
        relevanceThreshold = 2;
        scoreThreshold = 5;
    } else if (wordCount < 1000) {
        qualityThreshold = 4;
        relevanceThreshold = 2;
        scoreThreshold = 6;
    } else {
        qualityThreshold = 5;
        relevanceThreshold = 3;
        scoreThreshold = 8;
    }
    
    // فیلتر اول: بر اساس threshold های انفرادی
    let secondaryKeywords = suggestions.filter(s => 
        s.quality >= qualityThreshold && s.relevance >= relevanceThreshold
    );
    
    // اگر نتیجه کم بود، فیلتر دوم: بر اساس مجموع امتیاز
    if (secondaryKeywords.length < maxSuggestions) {
        secondaryKeywords = suggestions.filter(s => 
            (s.quality + s.relevance) >= scoreThreshold
        );
    }
    
    // اگر باز هم نتیجه نیومد، فیلتر سوم: بهترین‌ها بدون شرط
    if (secondaryKeywords.length < maxSuggestions) {
        secondaryKeywords = suggestions
            .sort((a, b) => {
                const scoreA = a.quality + a.relevance;
                const scoreB = b.quality + b.relevance;
                return scoreB - scoreA;
            });
    }
    
    // محدود کردن به تعداد درخواستی
    secondaryKeywords = secondaryKeywords.slice(0, maxSuggestions);
    
    return secondaryKeywords;
},

    /**
     * محاسبه کیفیت کلمه کلیدی
     */
    calculateKeywordQuality(keyword, frequency) {
        let quality = 0;
        
        // امتیاز بر اساس طول
        const wordCount = keyword.split(' ').length;
        if (wordCount === 2) quality += 3;
        else if (wordCount === 3) quality += 2;
        
        // امتیاز بر اساس تکرار
        if (frequency >= 3) quality += 2;
        else if (frequency >= 2) quality += 1;
        
        // امتیاز بر اساس وجود کلمات کلیدی مهم
        const importantWords = [
            'سئو', 'seo', 'بهینه', 'بهینه‌سازی', 'optimization', 'گوگل', 'google',
            'محتوا', 'content', 'بازاریابی', 'marketing', 'دیجیتال', 'digital',
            'وب', 'web', 'سایت', 'website', 'طراحی', 'design', 'توسعه', 'development'
        ];
        
        const hasImportantWord = importantWords.some(word => 
            keyword.toLowerCase().includes(word.toLowerCase())
        );
        
        if (hasImportantWord) quality += 2;
        
        // امتیاز بر اساس عدم وجود کلمات غیرمرتبط
        const irrelevantWords = ['است', 'بود', 'خواهد', 'می', 'نمی', 'که', 'این', 'آن'];
        const hasIrrelevantWord = irrelevantWords.some(word => 
            keyword.toLowerCase().includes(word.toLowerCase())
        );
        
        if (!hasIrrelevantWord) quality += 1;
        
        return quality;
    },

    /**
     * تست شمارش کلمات (برای Debug)
     */
    testWordCount(text) {
        console.group('🧪 تست شمارش کلمات');
        console.log('متن ورودی:', text);
        console.log('تعداد کلمات:', this.countWords(text));
        
        const words = this.splitIntoWords(text);
        console.log('کلمات جدا شده:', words);
        console.log('تعداد دقیق:', words.length);
        
        // نمایش کلمات با نیم‌فاصله
        words.forEach((word, index) => {
            const hasZwnj = word.includes('\u200c');
            if (hasZwnj) {
                console.log(`کلمه ${index + 1}: "${word}" (دارای نیم‌فاصله)`);
            }
        });
        
        console.groupEnd();
        
        return {
            count: words.length,
            words: words,
            original: text
        };
    }
};

// Export برای استفاده در سایر ماژول‌ها
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}