/**
 * توابع کمکی و Utilities - بهبود یافته
 */

// Regex های از پیش کامپایل شده (بهینه‌سازی)
const REGEX = {
    htmlTags: /<[^>]*>/g,
    cleanup: /[.!?؟۔،,;:\-_()[\]{}«»""'']/g,
    multiSpace: /\s+/g,
    digitOnly: /^[\d\s\u200c]+$/,
    punctuation: /[.,،؛:;!؟?\-_)(}{[\]«»""'']/g,
    // ✅ بهبود: جداکننده‌های جمله فارسی دقیق‌تر
    sentenceEnders: /([.!?؟۔]\s+)|([.!?؟۔]$)|([.!?؟۔](?=\n))/g,
    punctuationOnly: /^[.!?؟۔\s]+$/,
    persianChars: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u200D]/,
    englishChars: /[a-zA-Z]/,
    cleanupFull: /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u0020a-zA-Z0-9]/g,
    // ✅ جدید: نیم‌فاصله‌های متعدد
    multipleZWNJ: /\u200c{2,}/g,
    // ✅ جدید: نیم‌فاصله قبل/بعد فاصله
    zwnjaroundSpace: /\u200c\s+|\s+\u200c/g
};

const Utils = {
    /**
     * ✅ بهبود: نرمال‌سازی نیم‌فاصله
     */
    normalizeZWNJ(text) {
        if (!text) return '';
        return text
            .replace(REGEX.multipleZWNJ, '\u200c') // چند نیم‌فاصله -> یک نیم‌فاصله
            .replace(REGEX.zwnjaroundSpace, ' '); // نیم‌فاصله + فاصله -> فاصه
    },

    /**
     * ✅ بهبود: نرمال‌سازی متن با مدیریت بهتر نیم‌فاصله
     */
    normalizeText(text) {
        if (!text) return '';
        text = this.normalizeZWNJ(text);
        return text
            .replace(/\u200d/g, '') // حذف ZWJ
            .replace(/\u00a0/g, ' ') // تبدیل NBSP به فاصله
            .replace(/[\t\r\n]+/g, ' ') // تبدیل tab/newline به فاصله
            .replace(REGEX.multiSpace, ' ') // چند فاصله -> یک فاصله
            .trim()
            .toLowerCase();
    },

    normalizeTextForSearch(text) {
        if (!text) return '';
        text = this.normalizeZWNJ(text);
        return text
            .replace(/\u200d/g, '')
            .replace(/\u00a0/g, ' ')
            .replace(/[\t\r\n]+/g, ' ')
            .replace(REGEX.multiSpace, ' ')
            .trim();
    },

    displayText(text) {
        // نمایش نیم‌فاصله با کاراکتر قابل مشاهده
        return text.replace(/\u200c/g, '‌');
    },

    /**
     * استخراج متن از HTML
     */
    extractText(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        const text = div.textContent || div.innerText || '';
        return this.normalizeZWNJ(text);
    },

    extractTextWithoutHeadings(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        const headings = div.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => heading.remove());
        const text = div.textContent || div.innerText || '';
        return this.normalizeZWNJ(text);
    },

    extractTextFromHeadings(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        const headings = div.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let headingsText = '';
        headings.forEach(heading => {
            headingsText += (heading.textContent || heading.innerText || '') + ' ';
        });
        return this.normalizeZWNJ(headingsText.trim());
    },

    /**
     * ✅ بهبود: شمارش کلمات با مدیریت بهتر نیم‌فاصله
     */
    countWords(text) {
        if (!text || text.trim().length === 0) return 0;
        
        text = text
            .replace(REGEX.htmlTags, ' ')
            .replace(/\u200d/g, '')
            .replace(/\u00a0/g, ' ');
        
        // نرمال‌سازی نیم‌فاصله
        text = this.normalizeZWNJ(text);
        
        text = text
            .replace(REGEX.cleanup, ' ')
            .replace(REGEX.multiSpace, ' ')
            .trim();
        
        const words = text.split(' ').filter(word => {
            const cleanWord = word.replace(/\u200c/g, '').trim();
            return cleanWord.length > 0 && !REGEX.digitOnly.test(cleanWord);
        });
        
        return words.length;
    },

    /**
     * ✅ بهبود: تقسیم به کلمات
     */
    splitIntoWords(text) {
        if (!text || text.trim().length === 0) return [];
        
        text = text.replace(REGEX.htmlTags, ' ');
        text = this.normalizeZWNJ(text);
        text = text
            .replace(/\u200d/g, '')
            .replace(/\u00a0/g, ' ')
            .replace(REGEX.multiSpace, ' ')
            .trim();
        text = text
            .replace(REGEX.cleanup, ' ')
            .replace(REGEX.multiSpace, ' ')
            .trim();
        
        return text.split(' ').filter(word => {
            const cleanWord = word.replace(/\u200c/g, '').trim();
            return cleanWord.length > 0 && !REGEX.digitOnly.test(cleanWord);
        });
    },

    /**
     * جستجوی کلمه کلیدی
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
     * بررسی کلیدواژه در بخش خاص
     */
    hasKeywordInSection(html, keyword, selector) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const elements = temp.querySelectorAll(selector);

        for (let element of elements) {
            if (element.tagName === 'IMG') {
                const altText = element.getAttribute('alt') || '';
                if (this.findKeyword(altText, keyword).length > 0) {
                    return { found: true, text: this.displayText(altText.trim()) };
                }
            } else {
                const text = element.textContent || element.innerText;
                if (this.findKeyword(text, keyword).length > 0) {
                    return { found: true, text: this.displayText(text.trim()) };
                }
            }
        }
        return { found: false, text: '' };
    },

    getFirstParagraph(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        temp.querySelectorAll('h1').forEach(h1 => h1.remove());
        const paragraphs = temp.querySelectorAll('p');
        for (let p of paragraphs) {
            const text = (p.textContent || p.innerText).trim();
            if (text.length > 0) return text;
        }
        return '';
    },

    /**
     * ✅ بهبود کامل: تقسیم به جملات فارسی با دقت بالا
     */
    splitIntoSentences(text) {
        if (!text || text.trim().length === 0) return [];
        
        // نرمال‌سازی اولیه
        text = this.normalizeZWNJ(text);
        text = text.trim().replace(REGEX.multiSpace, ' ');
        
        // الگوهای پایان جمله در فارسی
        const sentences = [];
        let currentSentence = '';
        let i = 0;
        
        while (i < text.length) {
            const char = text[i];
            const nextChar = text[i + 1];
            const prevChar = text[i - 1];
            
            currentSentence += char;
            
            // شناسایی پایان جمله
            const isEnder = /[.!?؟۔]/.test(char);
            
            if (isEnder) {
                // بررسی استثناها
                const isAbbreviation = this.isAbbreviation(text, i);
                const isDecimal = /\d/.test(prevChar) && /\d/.test(nextChar);
                const isEllipsis = char === '.' && text[i + 1] === '.' && text[i + 2] === '.';
                
                // اگر واقعاً پایان جمله است
                if (!isAbbreviation && !isDecimal && !isEllipsis) {
                    // اضافه کردن فاصله‌های بعدی (اگر هست)
                    while (i + 1 < text.length && /\s/.test(text[i + 1])) {
                        i++;
                        currentSentence += text[i];
                    }
                    
                    // ذخیره جمله
                    const trimmed = currentSentence.trim();
                    if (trimmed.length > 0 && !REGEX.punctuationOnly.test(trimmed)) {
                        sentences.push(trimmed);
                    }
                    currentSentence = '';
                }
            }
            
            i++;
        }
        
        // جمله آخر (اگر باقی مانده)
        if (currentSentence.trim().length > 0) {
            const trimmed = currentSentence.trim();
            if (!REGEX.punctuationOnly.test(trimmed)) {
                sentences.push(trimmed);
            }
        }
        
        // ادغام جملات خیلی کوتاه
        return this.mergeTooShortSentences(sentences);
    },

    /**
     * ✅ جدید: تشخیص اختصارات
     */
    isAbbreviation(text, dotPosition) {
        // اختصارات رایج
        const abbreviations = [
            'د.', 'م.', 'ک.', 'ص.', 'ج.', 'ر.ک', 'ه.ش', 'ه.ق',
            'Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.', 'etc.', 'e.g.', 'i.e.'
        ];
        
        // بررسی 5 کاراکتر قبل و بعد
        const start = Math.max(0, dotPosition - 5);
        const end = Math.min(text.length, dotPosition + 5);
        const context = text.substring(start, end);
        
        return abbreviations.some(abbr => context.includes(abbr));
    },

    /**
     * ✅ جدید: ادغام جملات خیلی کوتاه
     */
    mergeTooShortSentences(sentences) {
        const merged = [];
        let i = 0;
        
        while (i < sentences.length) {
            const sentence = sentences[i];
            const wordCount = this.countWords(sentence);
            
            // اگر جمله کمتر از 3 کلمه دارد و جمله بعدی هم هست
            if (wordCount < 3 && i < sentences.length - 1) {
                sentences[i + 1] = sentence + ' ' + sentences[i + 1];
            } else if (sentence.length > 0) {
                merged.push(sentence);
            }
            i++;
        }
        
        // فیلتر نهایی
        return merged.filter(s => this.countWords(s) > 0);
    },

    /**
     * تحلیل پیچیدگی جمله
     */
    analyzeSentenceComplexity(sentence) {
        const wordCount = this.countWords(sentence);
        const charCount = sentence.replace(REGEX.multiSpace, '').length;
        const avgWordLength = wordCount > 0 ? charCount / wordCount : 0;
        
        const conjunctions = ['که', 'اگر', 'چون', 'زیرا', 'هرچند', 'اما', 'ولی', 'لیکن', 'بنابراین', 'در نتیجه', 'همچنین'];
        let conjunctionCount = 0;
        const lowerSentence = sentence.toLowerCase();
        conjunctions.forEach(conj => {
            const matches = lowerSentence.match(new RegExp('\\b' + conj + '\\b', 'g'));
            if (matches) conjunctionCount += matches.length;
        });
        
        const commaCount = (sentence.match(/،/g) || []).length;
        let complexityScore = 0;
        
        if (wordCount > 25) complexityScore += 40;
        else if (wordCount > 20) complexityScore += 30;
        else if (wordCount > 15) complexityScore += 20;
        else complexityScore += 10;
        
        if (avgWordLength > 7) complexityScore += 20;
        else if (avgWordLength > 6) complexityScore += 15;
        else if (avgWordLength > 5) complexityScore += 10;
        else complexityScore += 5;
        
        complexityScore += Math.min(conjunctionCount * 5, 20);
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

    categorizeSentence(sentence) {
        const analysis = this.analyzeSentenceComplexity(sentence);
        const wordCount = analysis.wordCount;
        
        if (wordCount <= 12) {
            return { category: 'short', level: 'good', message: 'جمله کوتاه و واضح', color: '#10b981' };
        } else if (wordCount <= 18) {
            return { category: 'medium', level: 'good', message: 'جمله با طول مناسب', color: '#10b981' };
        } else if (wordCount <= 25) {
            if (analysis.complexityScore > 70) {
                return { category: 'long', level: 'warning', message: 'جمله بلند و پیچیده', color: '#f59e0b', suggestion: 'این جمله را به 2-3 جمله کوتاه‌تر تقسیم کنید' };
            }
            return { category: 'long', level: 'acceptable', message: 'جمله بلند اما قابل قبول', color: '#f59e0b' };
        } else {
            return { category: 'very_long', level: 'error', message: 'جمله خیلی بلند', color: '#ef4444', suggestion: 'حتماً این جمله را به چند جمله کوتاه‌تر تبدیل کنید' };
        }
    },

    extractParagraphs(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return Array.from(temp.querySelectorAll('p'))
            .map(p => (p.textContent || '').trim())
            .filter(p => p.length > 0);
    },

    debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    calculatePercentage(value, total) {
        if (total === 0) return 0;
        return (value / total) * 100;
    },

    formatDecimal(number, decimals = 2) {
        return Number(number).toFixed(decimals);
    },

    /**
     * ✅ بهبود: استخراج کلمات با مدیریت نیم‌فاصله
     */
    extractWords(text) {
        if (!text) return [];
        
        text = this.normalizeZWNJ(text);
        
        const cleanText = text
            .replace(/\u200d/g, '')
            .replace(/\u00a0/g, ' ')
            .replace(/[\t\r\n]+/g, ' ')
            .replace(REGEX.punctuation, ' ')
            .toLowerCase()
            .replace(REGEX.cleanupFull, ' ')
            .replace(REGEX.multiSpace, ' ')
            .trim();
        
        return cleanText.split(' ').filter(word => {
            if (!word || word.trim().length === 0) return false;
            const withoutZwnj = word.replace(/\u200c/g, '');
            if (withoutZwnj.trim().length === 0) return false;
            if (withoutZwnj.length === 1 && !/\d/.test(withoutZwnj)) return false;
            if (/^\d+$/.test(withoutZwnj)) return false;
            return true;
        });
    },

    generateNGrams(words, n = 2) {
        const ngrams = [];
        for (let i = 0; i <= words.length - n; i++) {
            ngrams.push(words.slice(i, i + n).join(' '));
        }
        return ngrams;
    },

    /**
     * شمارش تکرار کلمات
     */
    countWordFrequencies(text) {
        const words = this.extractWords(text);
        const wordCounts = new Map();
        
        // bigrams
        const bigrams = this.generateNGrams(words, 2);
        bigrams.forEach(bigram => {
            wordCounts.set(bigram, (wordCounts.get(bigram) || 0) + 1);
        });
        
        // trigrams  
        const trigrams = this.generateNGrams(words, 3);
        trigrams.forEach(trigram => {
            wordCounts.set(trigram, (wordCounts.get(trigram) || 0) + 1);
        });
        
        // 4-grams
        const fourgrams = this.generateNGrams(words, 4);
        fourgrams.forEach(fourgram => {
            wordCounts.set(fourgram, (wordCounts.get(fourgram) || 0) + 1);
        });
        
        return wordCounts;
    },

    /**
     * فیلتر کلمات مرتبط
     */
    filterRelevantWords(wordCounts) {
        const stopWords = new Set([
            'از', 'در', 'به', 'با', 'برای', 'تا', 'بر', 'روی', 'زیر', 'کنار',
            'که', 'اگر', 'چون', 'زیرا', 'لذا', 'پس', 'اما', 'ولی', 'یا', 'و',
            'من', 'تو', 'او', 'ما', 'شما', 'آنها', 'این', 'آن',
            'خود', 'خودش', 'خودت', 'خودم',
            'همه', 'هر', 'هیچ', 'برخی', 'بعضی', 'تمام',
            'است', 'بود', 'باشد', 'شود', 'خواهد', 'دارد', 'کرد', 'کند',
            'بوده', 'شده', 'می', 'نمی', 'باید', 'نباید',
            'خیلی', 'بسیار', 'بیشتر', 'کمتر', 'خوب', 'بد', 'فقط', 'تنها',
            'چه', 'چی', 'کی', 'کجا', 'چرا', 'چگونه', 'چطور', 'کدام', 'چند',
            'یک', 'دو', 'سه', 'چهار', 'پنج',
            'بعد', 'قبل', 'حالا', 'الان', 'همیشه', 'هنوز', 'دیگر',
            'همچنین', 'بنابراین', 'به طور', 'به عنوان',
            'کلمات', 'کلمه', 'محتوا', 'محتوای', 'متن', 'ویرایشگر', 'ابزار', 'موجود',
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
            'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may',
            'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
        ]);
        
        const filtered = {};
        for (const [word, count] of wordCounts) {
            const lowerWord = word.toLowerCase();
            const words = word.split(' ');
            const hasStopWord = words.some(w => stopWords.has(w.toLowerCase()));
            
            if (this.isMeaningfulWord(word) && !hasStopWord && count > 1 && word.length > 2 && this.isRelevantPhrase(word)) {
                filtered[word] = count;
            }
        }
        return filtered;
    },

    isRelevantPhrase(phrase) {
        if (REGEX.punctuation.test(phrase)) return false;
        
        const irrelevantPatterns = [
            /است که/, /بود که/, /می باشد/,
            /است در/, /است به/, /است از/, /است با/,
            /این که/, /آن که/, /برای که/,
            /^.+ است$/, /^.+ بود$/, /^است .+$/,
            /^در .+$/, /^به .+$/, /^از .+$/, /^با .+$/,
            /^.+ در$/, /^.+ به$/, /^.+ از$/, /^.+ با$/,
            /^که .+$/, /^.+ که$/,
            /محتوای موجود/, /^موجود/, /ویرایشگر/, /^ابزار/,
            /عمل کن/, /^کن/, /استفاده می/
        ];
        
        for (let pattern of irrelevantPatterns) {
            if (pattern.test(phrase)) return false;
        }
        
        const words = phrase.split(' ');
        const uniqueWords = new Set(words);
        if (words.length > uniqueWords.size) return false;
        
        const meaningfulWords = words.filter(w => 
            w.length > 2 && !['است', 'بود', 'می', 'که', 'این', 'آن', 'را', 'کن', 'محتوا', 'موجود', 'ابزار'].includes(w)
        );
        if (words.length >= 3 && meaningfulWords.length < 2) return false;
        if (words.length === 2 && meaningfulWords.length < 1) return false;
        
        return true;
    },

    isMeaningfulWord(word) {
        if (word.length <= 1) return false;
        if (/^\d+$/.test(word)) return false;
        if (/(.)\1{2,}/.test(word)) return false;
        
        if (word.length > 3) {
            const hasPersian = REGEX.persianChars.test(word);
            const hasEnglish = REGEX.englishChars.test(word);
            if (hasPersian && hasEnglish && word.length < 6) return false;
        }
        return true;
    },

    /**
     * پیشنهاد کلمات کلیدی
     */
    suggestKeywords(text, maxSuggestions = 10) {
        const wordCounts = this.countWordFrequencies(text);
        const filteredCounts = this.filterRelevantWords(wordCounts);
        
        const meaningfulPhrases = {};
        Object.entries(filteredCounts).forEach(([word, count]) => {
            const wordCount = word.split(' ').length;
            if (wordCount >= 2 && wordCount <= 4) {
                meaningfulPhrases[word] = count;
            }
        });
        
        const nlpEnhanced = this.enhanceWithNLP(meaningfulPhrases, text);
        
        const sortedWords = Object.entries(nlpEnhanced)
            .sort(([,a], [,b]) => {
                if (a.quality !== b.quality) return b.quality - a.quality;
                if (a.relevance !== b.relevance) return b.relevance - a.relevance;
                return b.frequency - a.frequency;
            })
            .slice(0, maxSuggestions);
        
        return sortedWords.map(([word, data]) => ({
            keyword: word,
            frequency: data.frequency,
            type: word.split(' ').length === 2 ? 'دو کلمه' : word.split(' ').length === 3 ? 'سه کلمه' : 'چهار کلمه',
            quality: data.quality,
            relevance: data.relevance
        }));
    },

    enhanceWithNLP(phrases, originalText) {
        const enhanced = {};
        Object.entries(phrases).forEach(([phrase, frequency]) => {
            const quality = this.calculateKeywordQuality(phrase, frequency, originalText);
            const relevance = this.calculateRelevance(phrase, originalText);
            enhanced[phrase] = { frequency, quality, relevance };
        });
        return enhanced;
    },

    /**
     * محاسبه ارتباط کلمه کلیدی
     */
    calculateRelevance(phrase, text) {
        let relevance = 0;
        const temp = document.createElement('div');
        temp.innerHTML = text;
        
        // 1. وزن‌دهی سلسله‌مراتبی برای headings (0-15)
        const h1 = temp.querySelectorAll('h1');
        const h2 = temp.querySelectorAll('h2');
        const h3 = temp.querySelectorAll('h3');
        const h4h5h6 = temp.querySelectorAll('h4, h5, h6');
        
        h1.forEach(h => {
            if (h.textContent.toLowerCase().includes(phrase.toLowerCase())) 
                relevance += 10;
        });
        
        h2.forEach(h => {
            if (h.textContent.toLowerCase().includes(phrase.toLowerCase())) 
                relevance += 5;
        });
        
        h3.forEach(h => {
            if (h.textContent.toLowerCase().includes(phrase.toLowerCase())) 
                relevance += 3;
        });
        
        h4h5h6.forEach(h => {
            if (h.textContent.toLowerCase().includes(phrase.toLowerCase())) 
                relevance += 1;
        });
        
        const headingScore = Math.min(15, relevance);
        relevance = headingScore;
        
        // 2. امتیاز پاراگراف اول (0-8)
        const firstPara = this.getFirstParagraph(text);
        if (firstPara.toLowerCase().includes(phrase.toLowerCase())) {
            relevance += 8;
        }
        
        // 3. تحلیل پراکندگی در کل متن (0-7)
        const paragraphs = this.extractParagraphs(text);
        if (paragraphs.length > 0) {
            let paragraphsWithPhrase = 0;
            paragraphs.forEach(p => {
                if (p.toLowerCase().includes(phrase.toLowerCase())) {
                    paragraphsWithPhrase++;
                }
            });
            
            const distribution = (paragraphsWithPhrase / paragraphs.length) * 100;
            
            if (distribution >= 40) relevance += 7;
            else if (distribution >= 25) relevance += 5;
            else if (distribution >= 15) relevance += 3;
            else if (distribution >= 5) relevance += 1;
        }
        
        relevance = Math.min(30, relevance);
        
        return relevance;
    },

    /**
     * تشخیص کلمات کلیدی
     */
    detectMainKeyword(text, maxSuggestions = 5) {
        const wordCount = this.countWords(text);
        const suggestions = this.suggestKeywords(text, maxSuggestions * 3);
        if (suggestions.length === 0) return [];
        
        let qualityThreshold = wordCount < 200 ? 2 : wordCount < 400 ? 3 : wordCount < 700 ? 4 : wordCount < 1000 ? 5 : 6;
        let relevanceThreshold = wordCount < 200 ? 1 : wordCount < 700 ? 2 : wordCount < 1000 ? 3 : 4;
        
        let mainKeywords = suggestions.filter(s => s.quality >= qualityThreshold && s.relevance >= relevanceThreshold);
        if (mainKeywords.length < maxSuggestions) {
            mainKeywords = suggestions.sort((a, b) => (b.quality + b.relevance) - (a.quality + a.relevance));
        }
        return mainKeywords.slice(0, maxSuggestions);
    },

    detectSecondaryKeywords(text, maxSuggestions = 10) {
        const wordCount = this.countWords(text);
        const suggestions = this.suggestKeywords(text, maxSuggestions * 2);
        if (suggestions.length === 0) return [];
        
        let qualityThreshold = wordCount < 200 ? 1 : wordCount < 400 ? 2 : wordCount < 700 ? 3 : wordCount < 1000 ? 4 : 5;
        let relevanceThreshold = wordCount < 700 ? 1 : wordCount < 1000 ? 2 : 3;
        
        let secondaryKeywords = suggestions.filter(s => s.quality >= qualityThreshold && s.relevance >= relevanceThreshold);
        if (secondaryKeywords.length < maxSuggestions) {
            secondaryKeywords = suggestions.sort((a, b) => (b.quality + b.relevance) - (a.quality + a.relevance));
        }
        return secondaryKeywords.slice(0, maxSuggestions);
    },

    /**
     * محاسبه کیفیت کلمه کلیدی
     */
    calculateKeywordQuality(keyword, frequency, textContext = null) {
        let quality = 0;
        const wordCount = keyword.split(' ').length;
        const totalWords = textContext ? Utils.countWords(Utils.extractText(textContext)) : 0;
        
        // 1. امتیاز تعداد کلمات (0-8)
        if (wordCount === 4) quality += 8;
        else if (wordCount === 3) quality += 6;
        else if (wordCount === 2) quality += 4;
        else quality += 1;
        
        // 2. امتیاز فرکانس پیوسته (0-10)
        quality += Math.min(10, Math.log2(frequency + 1) * 2);
        
        if (textContext) {
            // 3. امتیاز موقعیت در H1 (0-15)
            const h1Check = this.hasKeywordInSection(textContext, keyword, 'h1');
            if (h1Check.found) {
                quality += 15;
            }
            
            // 4. امتیاز موقعیت در سایر headings (0-8)
            const headingsText = this.extractTextFromHeadings(textContext);
            const headingMatches = this.findKeyword(headingsText, keyword).length;
            if (headingMatches > 0 && !h1Check.found) {
                quality += Math.min(8, headingMatches * 3);
            }
            
            // 5. امتیاز پاراگراف اول (0-10)
            const firstPara = this.getFirstParagraph(textContext);
            if (this.findKeyword(firstPara, keyword).length > 0) {
                quality += 10;
            }
            
            // 6. امتیاز تراکم مناسب (0-5)
            if (totalWords > 0) {
                const density = (frequency / totalWords) * 100;
                if (density >= 0.5 && density <= 2.5) {
                    quality += 5;
                } else if (density >= 0.3 && density <= 3.5) {
                    quality += 3;
                }
            }
        }
        
        // نرمال‌سازی (حداکثر 45، حداقل 0)
        quality = Math.max(0, Math.min(45, quality));
        
        return Math.round(quality);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
