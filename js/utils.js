/**
 * توابع کمکی و Utilities - نسخه بهینه شده
 */

const Utils = {
    // Cache برای نتایج محاسبات
    _cache: {
        wordCounts: new Map(),
        keywords: new Map(),
        sentences: new Map()
    },

    // پاکسازی cache (هر 100 آیتم)
    _cleanCache(cacheMap) {
        if (cacheMap.size > 100) {
            const firstKey = cacheMap.keys().next().value;
            cacheMap.delete(firstKey);
        }
    },

    /**
     * نرمال‌سازی متن (بهبود یافته برای فارسی)
     */
    normalizeText(text) {
        if (!text) return '';
        
        return text
            .replace(/\u200c/g, '\u200c')
            .replace(/\u200d/g, '')
            .replace(/\u00a0/g, ' ')
            .replace(/[\t\r\n]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
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
     * استخراج متن خالص از HTML بدون هدینگ‌ها
     */
    extractTextWithoutHeadings(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        
        const headings = div.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => heading.remove());
        
        return div.textContent || div.innerText || '';
    },

    /**
     * استخراج متن فقط از هدینگ‌ها
     */
    extractTextFromHeadings(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        
        const headings = div.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let headingsText = '';
        
        headings.forEach(heading => {
            headingsText += (heading.textContent || heading.innerText || '') + ' ';
        });
        
        return headingsText.trim();
    },

    /**
     * شمارش تعداد کلمات (بهینه شده با regex کامپایل شده)
     */
    countWords: (() => {
        // Pre-compiled regex برای عملکرد بهتر
        const htmlTagsRegex = /<[^>]*>/g;
        const cleanupRegex = /[.!?؟۔،,;:\-_()[\]{}«»""'']/g;
        const multiSpaceRegex = /\s+/g;
        const digitOnlyRegex = /^[\d\s\u200c]+$/;

        return function(text) {
            if (!text || text.trim().length === 0) return 0;
            
            text = text
                .replace(htmlTagsRegex, ' ')
                .replace(/\u200c/g, '\u200c')
                .replace(/\u200d/g, '')
                .replace(/\u00a0/g, ' ')
                .replace(cleanupRegex, ' ')
                .replace(multiSpaceRegex, ' ')
                .trim();
            
            const words = text.split(' ').filter(word => {
                const cleanWord = word.replace(/\u200c/g, '').trim();
                return cleanWord.length > 0 && !digitOnlyRegex.test(cleanWord);
            });
            
            return words.length;
        };
    })(),

    /**
     * تقسیم متن به کلمات (با حفظ نیم‌فاصله)
     */
    splitIntoWords(text) {
        if (!text || text.trim().length === 0) return [];
        
        text = text.replace(/<[^>]*>/g, ' ');
        
        text = text
            .replace(/\u200d/g, '')
            .replace(/\u00a0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        text = text
            .replace(/[.!?؟۔،,;:\-_()[\]{}«»""'']/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
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
     * تقسیم متن به جملات (بهینه شده با regex کامپایل شده)
     */
    splitIntoSentences: (() => {
        const sentenceEndersRegex = /([.!?؟۔]\s+|[.!?؟۔]$)/g;
        const punctuationOnlyRegex = /^[.!?؟۔\s]+$/;

        return function(text) {
            const cacheKey = text.substring(0, 100);
            if (this._cache.sentences.has(cacheKey)) {
                return this._cache.sentences.get(cacheKey);
            }

            text = text.trim().replace(/\s+/g, ' ');
            
            let sentences = text
                .split(sentenceEndersRegex)
                .filter(s => s && s.trim().length > 0)
                .filter(s => !punctuationOnlyRegex.test(s))
                .map(s => s.trim());
            
            const mergedSentences = [];
            for (let i = 0; i < sentences.length; i++) {
                const sentence = sentences[i];
                const wordCount = this.countWords(sentence);
                
                if (wordCount < 3 && i < sentences.length - 1) {
                    sentences[i + 1] = sentence + ' ' + sentences[i + 1];
                } else if (sentence.length > 0) {
                    mergedSentences.push(sentence);
                }
            }
            
            const result = mergedSentences.filter(s => this.countWords(s) > 0);
            
            this._cleanCache(this._cache.sentences);
            this._cache.sentences.set(cacheKey, result);
            
            return result;
        };
    })(),

    /**
     * تحلیل پیچیدگی جمله (برای فارسی)
     */
    analyzeSentenceComplexity(sentence) {
        const wordCount = this.countWords(sentence);
        const charCount = sentence.replace(/\s+/g, '').length;
        const avgWordLength = wordCount > 0 ? charCount / wordCount : 0;
        
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

    /**
     * دسته‌بندی جمله بر اساس طول و پیچیدگی
     */
    categorizeSentence(sentence) {
        const analysis = this.analyzeSentenceComplexity(sentence);
        const wordCount = analysis.wordCount;
        
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
     * استخراج کلمات از متن (بهینه شده)
     */
    extractWords: (() => {
        const cleanupRegex = /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u0020a-zA-Z0-9]/g;
        const multiSpaceRegex = /\s+/g;

        return function(text) {
            if (!text) return [];
            
            const cleanText = text
                .replace(/\u200d/g, '')
                .replace(/\u00a0/g, ' ')
                .replace(/[\t\r\n]+/g, ' ')
                .toLowerCase()
                .replace(cleanupRegex, ' ')
                .replace(multiSpaceRegex, ' ')
                .trim();
            
            return cleanText.split(' ').filter(word => {
                if (!word || word.trim().length === 0) return false;
                
                const withoutZwnj = word.replace(/\u200c/g, '');
                if (withoutZwnj.trim().length === 0) return false;
                if (withoutZwnj.length === 1 && !/\d/.test(withoutZwnj)) return false;
                if (/^\d+$/.test(withoutZwnj)) return false;
                
                return true;
            });
        };
    })(),

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
     * شمارش تکرار کلمات و ترکیبات (بهینه شده با Map)
     */
    countWordFrequencies(text) {
        const words = this.extractWords(text);
        const wordCounts = new Map();
        
        // شمارش کلمات تکی
        words.forEach(word => {
            wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        });
        
        // شمارش bigrams
        const bigrams = this.generateNGrams(words, 2);
        bigrams.forEach(bigram => {
            wordCounts.set(bigram, (wordCounts.get(bigram) || 0) + 1);
        });
        
        // شمارش trigrams
        const trigrams = this.generateNGrams(words, 3);
        trigrams.forEach(trigram => {
            wordCounts.set(trigram, (wordCounts.get(trigram) || 0) + 1);
        });
        
        return wordCounts;
    },

    /**
     * فیلتر کردن کلمات غیرمرتبط (بهینه شده با Set)
     */
    filterRelevantWords(wordCounts) {
        const stopWords = new Set([
            'از', 'در', 'به', 'با', 'برای', 'که', 'این', 'آن', 'را',
            'است', 'بود', 'خواهد', 'بوده', 'شده', 'می', 'نمی', 'باید', 'نباید',
            'هم', 'همه', 'هر', 'هیچ', 'چند', 'چقدر', 'چگونه', 'کجا', 'کی',
            'من', 'تو', 'او', 'ما', 'شما', 'آنها', 'خود', 'خودش', 'خودت',
            'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه', 'ده',
            'همچنین', 'لذا', 'بنابراین', 'کلمات', 'کلمه',
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
            'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
        ]);
        
        const filtered = {};
        for (const [word, count] of wordCounts) {
            const lowerWord = word.toLowerCase();
            
            if (this.isMeaningfulWord(word) && 
                !stopWords.has(lowerWord) && 
                count > 1 && 
                word.length > 2 &&
                this.isRelevantPhrase(word)) {
                filtered[word] = count;
            }
        }
        
        return filtered;
    },

    /**
     * بررسی اینکه آیا عبارت مرتبط است یا نه
     */
    isRelevantPhrase(phrase) {
        const irrelevantPatterns = [
            /است که/, /بود که/, /خواهد که/, /می باشد/, /نمی باشد/,
            /این که/, /آن که/, /همه که/, /هر که/, /چند که/,
            /است در/, /بود در/, /خواهد در/, /می در/, /نمی در/,
            /است به/, /بود به/, /خواهد به/, /می به/, /نمی به/,
            /است از/, /بود از/, /خواهد از/, /می از/, /نمی از/,
            /است با/, /بود با/, /خواهد با/, /می با/, /نمی با/,
            /است برای/, /بود برای/, /خواهد برای/, /می برای/, /نمی برای/,
            /برای که/, /برای این/, /برای آن/, /برای همه/, /برای هر/,
            /در که/, /در این/, /در آن/, /در همه/, /در هر/,
            /به که/, /به این/, /به آن/, /به همه/, /به هر/,
            /از که/, /از این/, /از آن/, /از همه/, /از هر/,
            /با که/, /با این/, /با آن/, /با همه/, /با هر/,
            /^بهینه‌سازی برای$/, /^سئو برای$/, /^محتوا برای$/,
            /^طراحی برای$/, /^توسعه برای$/, /^بازاریابی برای$/
        ];
        
        for (let pattern of irrelevantPatterns) {
            if (pattern.test(phrase)) {
                return false;
            }
        }
        
        const words = phrase.split(' ');
        const uniqueWords = new Set(words);
        if (words.length > uniqueWords.size) {
            return false;
        }
        
        const meaningfulWords = words.filter(word => 
            word.length > 2 && 
            !['است', 'بود', 'خواهد', 'می', 'نمی', 'که', 'این', 'آن', 'را', 'برای', 'در', 'به', 'از', 'با'].includes(word)
        );
        
        if (meaningfulWords.length === 0) {
            return false;
        }
        
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
        if (word.length <= 1) return false;
        if (/^\d+$/.test(word)) return false;
        if (/^[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u200D\u0020-\u007F\u00A0-\u00FF]+$/.test(word)) return false;
        if (/(.)\1{2,}/.test(word)) return false;
        if (word.length > 2 && /^[aeiouAEIOU]+$/.test(word)) return false;
        if (/\d{2,}/.test(word) && word.length < 4) return false;
        
        if (word.length > 3) {
            const persianChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u200D]/;
            const englishChars = /[a-zA-Z]/;
            const hasPersian = persianChars.test(word);
            const hasEnglish = englishChars.test(word);
            
            if (hasPersian && hasEnglish) {
                if (word.length < 6) return false;
            }
        }
        
        return true;
    },

    /**
     * پیشنهاد کلمات کلیدی بر اساس تکرار و NLP (بهینه شده)
     */
    suggestKeywords(text, maxSuggestions = 10) {
        const cacheKey = text.substring(0, 200) + maxSuggestions;
        if (this._cache.keywords.has(cacheKey)) {
            return this._cache.keywords.get(cacheKey);
        }

        const wordCounts = this.countWordFrequencies(text);
        const filteredCounts = this.filterRelevantWords(wordCounts);
        
        const meaningfulPhrases = {};
        Object.entries(filteredCounts).forEach(([word, count]) => {
            const wordCount = word.split(' ').length;
            if (wordCount >= 2 && wordCount <= 3) {
                meaningfulPhrases[word] = count;
            }
        });
        
        const enhancedPhrases = this.enhanceIncompletePhrases(meaningfulPhrases, text);
        const nlpEnhanced = this.enhanceWithNLP(enhancedPhrases, text);
        
        const sortedWords = Object.entries(nlpEnhanced)
            .sort(([,a], [,b]) => {
                if (a.quality !== b.quality) {
                    return b.quality - a.quality;
                }
                return b.frequency - a.frequency;
            })
            .slice(0, maxSuggestions);
        
        const result = sortedWords.map(([word, data]) => ({
            keyword: word,
            frequency: data.frequency,
            type: word.split(' ').length === 2 ? 'دو کلمه' : 'سه کلمه',
            quality: data.quality,
            relevance: data.relevance
        }));

        this._cleanCache(this._cache.keywords);
        this._cache.keywords.set(cacheKey, result);
        
        return result;
    },

    /**
     * بهبود عبارات ناقص
     */
    enhanceIncompletePhrases(phrases, text) {
        const enhanced = {};
        const plainText = this.extractText(text);
        
        Object.entries(phrases).forEach(([phrase, count]) => {
            if (this.isIncompletePhrase(phrase)) {
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
        
        const sentences = text.split(/[.!?؟۔]\s+/);
        
        for (let sentence of sentences) {
            const sentenceWords = sentence.toLowerCase().split(/\s+/);
            
            for (let i = 0; i <= sentenceWords.length - words.length; i++) {
                const candidate = sentenceWords.slice(i, i + words.length).join(' ');
                
                if (candidate.includes(firstWord) && candidate.includes(lastWord)) {
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
        
        const titleMatches = this.findInTitles(phrase, text);
        if (titleMatches > 0) relevance += 3;
        
        const paragraphMatches = this.findInParagraphStarts(phrase, text);
        if (paragraphMatches > 0) relevance += 2;
        
        const density = this.calculatePhraseDensity(phrase, text);
        if (density > 0.5) relevance += 2;
        else if (density > 0.3) relevance += 1;
        
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
        
        if (suggestions.length === 0) {
            return [];
        }
        
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
        
        let mainKeywords = suggestions.filter(s => 
            s.quality >= qualityThreshold && s.relevance >= relevanceThreshold
        );
        
        if (mainKeywords.length < maxSuggestions) {
            mainKeywords = suggestions.filter(s => 
                (s.quality + s.relevance) >= scoreThreshold
            );
        }
        
        if (mainKeywords.length < maxSuggestions) {
            mainKeywords = suggestions
                .sort((a, b) => {
                    const scoreA = a.quality + a.relevance;
                    const scoreB = b.quality + b.relevance;
                    return scoreB - scoreA;
                });
        }
        
        mainKeywords = mainKeywords.slice(0, maxSuggestions);
        
        return mainKeywords;
    },

    /**
     * تشخیص کلمات کلیدی فرعی
     */
    detectSecondaryKeywords(text, maxSuggestions = 5) {
        const wordCount = this.countWords(text);
        const suggestions = this.suggestKeywords(text, maxSuggestions * 2);
        
        if (suggestions.length === 0) {
            return [];
        }
        
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
        
        let secondaryKeywords = suggestions.filter(s => 
            s.quality >= qualityThreshold && s.relevance >= relevanceThreshold
        );
        
        if (secondaryKeywords.length < maxSuggestions) {
            secondaryKeywords = suggestions.filter(s => 
                (s.quality + s.relevance) >= scoreThreshold
            );
        }
        
        if (secondaryKeywords.length < maxSuggestions) {
            secondaryKeywords = suggestions
                .sort((a, b) => {
                    const scoreA = a.quality + a.relevance;
                    const scoreB = b.quality + b.relevance;
                    return scoreB - scoreA;
                });
        }
        
        secondaryKeywords = secondaryKeywords.slice(0, maxSuggestions);
        
        return secondaryKeywords;
    },

    /**
     * محاسبه کیفیت کلمه کلیدی
     */
    calculateKeywordQuality(keyword, frequency) {
        let quality = 0;
        
        const wordCount = keyword.split(' ').length;
        if (wordCount === 2) quality += 3;
        else if (wordCount === 3) quality += 2;
        
        if (frequency >= 3) quality += 2;
        else if (frequency >= 2) quality += 1;
        
        const importantWords = [
            'سئو', 'seo', 'بهینه', 'بهینه‌سازی', 'optimization', 'گوگل', 'google',
            'محتوا', 'content', 'بازاریابی', 'marketing', 'دیجیتال', 'digital',
            'وب', 'web', 'سایت', 'website', 'طراحی', 'design', 'توسعه', 'development'
        ];
        
        const hasImportantWord = importantWords.some(word => 
            keyword.toLowerCase().includes(word.toLowerCase())
        );
        
        if (hasImportantWord) quality += 2;
        
        const irrelevantWords = ['است', 'بود', 'خواهد', 'می', 'نمی', 'که', 'این', 'آن'];
        const hasIrrelevantWord = irrelevantWords.some(word => 
            keyword.toLowerCase().includes(word.toLowerCase())
        );
        
        if (!hasIrrelevantWord) quality += 1;
        
        return quality;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
