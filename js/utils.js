/**
 * توابع کمکی و Utilities 
 */

// Regex های از پیش کامپایل شده (بهینه‌سازی)
const REGEX = {
    htmlTags: /<[^>]*>/g,
    cleanup: /[.!?؟۔،,;:\-_()[\]{}«»""'']/g,
    multiSpace: /\s+/g,
    digitOnly: /^[\d\s\u200c]+$/,
    punctuation: /[.,،؛:;!؟?\-_)(}{[\]«»""'']/g,
    sentenceEnders: /([.!?؟۔]\s+|[.!?؟۔]$)/g,
    punctuationOnly: /^[.!?؟۔\s]+$/,
    persianChars: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u200D]/,
    englishChars: /[a-zA-Z]/,
    cleanupFull: /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u200C\u0020a-zA-Z0-9]/g
};

const Utils = {
    /**
     * نرمال‌سازی متن
     */
    normalizeText(text) {
        if (!text) return '';
        return text
            .replace(/\u200c/g, '\u200c')
            .replace(/\u200d/g, '')
            .replace(/\u00a0/g, ' ')
            .replace(/[\t\r\n]+/g, ' ')
            .replace(REGEX.multiSpace, ' ')
            .trim()
            .toLowerCase();
    },

    normalizeTextForSearch(text) {
        if (!text) return '';
        return text
            .replace(/\u200c/g, '\u200c')
            .replace(/\u200d/g, '')
            .replace(/\u00a0/g, ' ')
            .replace(/[\t\r\n]+/g, ' ')
            .replace(REGEX.multiSpace, ' ')
            .trim();
    },

    displayText(text) {
        return text.replace(/\u200c/g, '‌');
    },

    /**
     * استخراج متن از HTML
     */
    extractText(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    },

    extractTextWithoutHeadings(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        const headings = div.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => heading.remove());
        return div.textContent || div.innerText || '';
    },

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
     * شمارش کلمات
     */
    countWords(text) {
        if (!text || text.trim().length === 0) return 0;
        
        text = text
            .replace(REGEX.htmlTags, ' ')
            .replace(/\u200c/g, '\u200c')
            .replace(/\u200d/g, '')
            .replace(/\u00a0/g, ' ')
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
     * تقسیم به کلمات
     */
    splitIntoWords(text) {
        if (!text || text.trim().length === 0) return [];
        
        text = text.replace(REGEX.htmlTags, ' ');
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
     * تقسیم به جملات
     */
    splitIntoSentences(text) {
        text = text.trim().replace(REGEX.multiSpace, ' ');
        let sentences = text
            .split(REGEX.sentenceEnders)
            .filter(s => s && s.trim().length > 0)
            .filter(s => !REGEX.punctuationOnly.test(s))
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
        return mergedSentences.filter(s => this.countWords(s) > 0);
    },

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
     * استخراج کلمات (بهینه شده)
     */
    extractWords(text) {
        if (!text) return [];
        
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
     * پیشنهاد کلمات کلیدی (ساده شده)
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

    calculateRelevance(phrase, text) {
        let relevance = 0;
        
        const temp = document.createElement('div');
        temp.innerHTML = text;
        const headings = temp.querySelectorAll('h1, h2, h3');
        headings.forEach(h => {
            if (h.textContent.toLowerCase().includes(phrase.toLowerCase())) relevance += 3;
        });
        
        const firstPara = this.getFirstParagraph(text);
        if (firstPara.toLowerCase().includes(phrase.toLowerCase())) relevance += 2;
        
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

    calculateKeywordQuality(keyword, frequency, textContext = null) {
        let quality = 0;
        const wordCount = keyword.split(' ').length;
        
        if (wordCount === 4) quality += 5;
        else if (wordCount === 3) quality += 4;
        else if (wordCount === 2) quality += 3;
        else quality += 1;
        
        if (frequency >= 5) quality += 2;
        else if (frequency >= 3) quality += 1.5;
        else if (frequency >= 2) quality += 1;
        
        if (textContext) {
            const h1Check = this.hasKeywordInSection(textContext, keyword, 'h1');
            if (h1Check.found) quality += 10;
            
            const headingsText = this.extractTextFromHeadings(textContext);
            if (this.findKeyword(headingsText, keyword).length > 0 && !h1Check.found) quality += 6;
            
            const firstPara = this.getFirstParagraph(textContext);
            if (this.findKeyword(firstPara, keyword).length > 0) quality += 4;
        }
        
        const importantWords = ['سئو', 'seo', 'بهینه‌سازی', 'گوگل', 'محتوا', 'بازاریابی', 'دیجیتال', 'وب', 'سایت', 'هوش مصنوعی', 'ai'];
        if (importantWords.some(w => keyword.toLowerCase().includes(w.toLowerCase()))) quality += 3;
        
        const irrelevantWords = ['است', 'بود', 'می', 'که', 'کن', 'محتوا', 'موجود', 'ویرایشگر'];
        if (!irrelevantWords.some(w => keyword.toLowerCase().includes(w.toLowerCase()))) quality += 2;
        
        return quality;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
