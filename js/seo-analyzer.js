/**
 * ماژول تحلیل SEO 
 */

const SEOAnalyzer = {
    /**
     * تحلیل کامل محتوا
     */
    analyze(content, mainKeyword, secondaryKeywords) {
        const plainText = Utils.extractText(content);
        const plainTextWithoutHeadings = Utils.extractTextWithoutHeadings(content);
        const totalWords = Utils.countWords(plainText);
        const totalWordsWithoutHeadings = Utils.countWords(plainTextWithoutHeadings);
        const keywordCount = Utils.findKeyword(plainTextWithoutHeadings, mainKeyword).length;
        const keywordDensity = Utils.calculatePercentage(keywordCount, totalWordsWithoutHeadings);

        return {
            totalWords,
            keywordCount,
            keywordDensity,
            checks: this.performSEOChecks(content, plainText, mainKeyword, secondaryKeywords, totalWords, keywordCount, keywordDensity, totalWordsWithoutHeadings),
            readabilityChecks: this.performReadabilityChecks(content, plainText),
            suggestionChecks: this.performSuggestionChecks(plainText)
        };
    },

    /**
     * Parse محتوا یکبار (بهینه‌سازی)
     */
    parseContent(content) {
        const temp = document.createElement('div');
        temp.innerHTML = content;
        return {
            dom: temp,
            h1: temp.querySelectorAll('h1'),
            h2h3: temp.querySelectorAll('h2, h3, h4, h5, h6'),
            paragraphs: temp.querySelectorAll('p'),
            images: temp.querySelectorAll('img'),
            links: temp.querySelectorAll('a[href]')
        };
    },

    /**
     * چک‌های SEO
     */
    performSEOChecks(content, plainText, mainKeyword, secondaryKeywords, totalWords, keywordCount, keywordDensity, totalWordsWithoutHeadings) {
        const parsed = this.parseContent(content);
        const checks = [];

        checks.push(this.checkH1Keyword(parsed.h1, mainKeyword));
        checks.push(this.checkFirstParagraph(parsed.paragraphs, mainKeyword));
        checks.push(this.checkKeywordDensity(keywordDensity, keywordCount, totalWordsWithoutHeadings));
        checks.push(this.checkKeywordDensityInHeadings(content, mainKeyword));
        checks.push(this.checkSecondaryKeywords(plainText, secondaryKeywords));
        checks.push(this.checkImages(parsed.images, mainKeyword, secondaryKeywords, totalWords));
        checks.push(this.checkBlueKeyword(content, mainKeyword));
        checks.push(this.checkKeywordLinking(parsed.links, mainKeyword, secondaryKeywords));

        return checks;
    },

    /**
     * چک H1
     */
    checkH1Keyword(h1Elements, mainKeyword) {
        let found = false;
        let text = '';
        
        for (let h1 of h1Elements) {
            const h1Text = h1.textContent || '';
            if (Utils.findKeyword(h1Text, mainKeyword).length > 0) {
                found = true;
                text = h1Text.trim();
                break;
            }
        }
        
        return {
            status: found ? CONFIG.CHECK_STATUS.SUCCESS : CONFIG.CHECK_STATUS.ERROR,
            title: 'کلمه کلیدی در عنوان (H1)',
            tooltip: 'عنوان اصلی باید شامل کلمه کلیدی باشد.',
            desc: found ? 'عنوان شامل کلمه کلیدی است ✓' : 'عنوان باید شامل کلمه کلیدی باشد',
            detail: found ? `عنوان: "${Utils.displayText(text)}"` : null
        };
    },

    /**
     * چک پاراگراف اول
     */
    checkFirstParagraph(paragraphs, mainKeyword) {
        let firstPara = '';
        for (let p of paragraphs) {
            const text = (p.textContent || '').trim();
            if (text.length > 0) {
                firstPara = text;
                break;
            }
        }
        
        const inFirstPara = Utils.findKeyword(firstPara, mainKeyword).length > 0;
        
        return {
            status: inFirstPara ? CONFIG.CHECK_STATUS.SUCCESS : CONFIG.CHECK_STATUS.ERROR,
            title: 'کلمه کلیدی در پاراگراف اول',
            tooltip: 'پاراگراف اول باید شامل کلمه کلیدی باشد.',
            desc: inFirstPara ? 'پاراگراف اول شامل کلمه کلیدی است ✓' : 'پاراگراف اول باید شامل کلمه کلیدی باشد',
            detail: inFirstPara ? Utils.displayText(firstPara.substring(0, 80)) + '...' : null
        };
    },

    /**
     * چک تراکم کلمه کلیدی (متن)
     */
    checkKeywordDensity(density, keywordCount, totalWordsWithoutHeadings) {
        const { MIN_KEYWORD_DENSITY, MAX_KEYWORD_DENSITY } = CONFIG.SEO_LIMITS;
        const densityOK = density >= MIN_KEYWORD_DENSITY && density <= MAX_KEYWORD_DENSITY;
        
        let status, desc;
        if (densityOK) {
            status = CONFIG.CHECK_STATUS.SUCCESS;
            desc = `تراکم مناسب: ${Utils.formatDecimal(density)}% ✓`;
        } else if (density < MIN_KEYWORD_DENSITY) {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `تراکم کم: ${Utils.formatDecimal(density)}% (باید ${MIN_KEYWORD_DENSITY}-${MAX_KEYWORD_DENSITY}%)`;
        } else {
            status = CONFIG.CHECK_STATUS.ERROR;
            desc = `تراکم زیاد: ${Utils.formatDecimal(density)}% (خطر Keyword Stuffing)`;
        }
        
        return {
            status,
            title: 'تراکم کلمه کلیدی (متن)',
            tooltip: `تراکم مناسب بین ${MIN_KEYWORD_DENSITY}-${MAX_KEYWORD_DENSITY}% است.`,
            desc,
            detail: `${keywordCount} بار از ${totalWordsWithoutHeadings} کلمه`
        };
    },

    /**
     * چک تراکم کلمه کلیدی (هدینگ‌ها)
     */
    checkKeywordDensityInHeadings(content, mainKeyword) {
        const headingsText = Utils.extractTextFromHeadings(content);
        const totalWordsInHeadings = Utils.countWords(headingsText);
        const keywordCountInHeadings = Utils.findKeyword(headingsText, mainKeyword).length;
        const headingDensity = Utils.calculatePercentage(keywordCountInHeadings, totalWordsInHeadings);
        
        const MIN = 3, MAX = 10;
        let status, desc;
        
        if (totalWordsInHeadings === 0) {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = 'هیچ هدینگی وجود ندارد';
        } else if (keywordCountInHeadings === 0) {
            status = CONFIG.CHECK_STATUS.ERROR;
            desc = 'کلمه کلیدی در هدینگ‌ها یافت نشد';
        } else if (headingDensity >= MIN && headingDensity <= MAX) {
            status = CONFIG.CHECK_STATUS.SUCCESS;
            desc = `تراکم مناسب: ${Utils.formatDecimal(headingDensity)}% ✓`;
        } else {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `تراکم: ${Utils.formatDecimal(headingDensity)}% (باید ${MIN}-${MAX}%)`;
        }
        
        return {
            status,
            title: 'تراکم کلمه کلیدی (هدینگ‌ها)',
            tooltip: `تراکم مناسب در هدینگ‌ها بین ${MIN}-${MAX}% است.`,
            desc,
            detail: totalWordsInHeadings > 0 ? `${keywordCountInHeadings} بار از ${totalWordsInHeadings} کلمه` : 'لطفاً هدینگ اضافه کنید'
        };
    },

    /**
     * چک کلمات کلیدی فرعی
     */
    checkSecondaryKeywords(plainText, secondaryKeywords) {
        if (secondaryKeywords.length === 0) {
            return {
                status: CONFIG.CHECK_STATUS.WARNING,
                title: 'کلمات کلیدی فرعی',
                tooltip: 'کلمات فرعی به جذب ترافیک بیشتر کمک می‌کنند.',
                desc: 'کلمه فرعی تعریف نشده',
                detail: 'لطفاً کلمات فرعی را وارد کنید'
            };
        }

        const foundSecondary = secondaryKeywords.filter(kw => Utils.findKeyword(plainText, kw).length > 0);
        const percentage = (foundSecondary.length / secondaryKeywords.length) * 100;
        const isGood = percentage >= CONFIG.SEO_LIMITS.MIN_SECONDARY_KEYWORD_PERCENTAGE;
        
        return {
            status: isGood ? CONFIG.CHECK_STATUS.SUCCESS : CONFIG.CHECK_STATUS.WARNING,
            title: 'کلمات کلیدی فرعی',
            tooltip: 'حداقل 70% کلمات فرعی باید در متن باشند.',
            desc: `${foundSecondary.length} از ${secondaryKeywords.length} کلمه در متن`,
            detail: foundSecondary.length > 0 ? `یافت شده: ${foundSecondary.map(k => Utils.displayText(k)).join('، ')}` : null
        };
    },

    /**
     * چک تصاویر (Alt + نسبت) - ادغام شده
     */
    checkImages(images, mainKeyword, secondaryKeywords, totalWords) {
        if (images.length === 0) {
            return {
                status: CONFIG.CHECK_STATUS.WARNING,
                title: 'تصاویر',
                tooltip: 'تصاویر باید alt داشته باشند و نسبت مناسبی داشته باشند.',
                desc: 'هیچ تصویری وجود ندارد',
                detail: 'لطفاً تصویر اضافه کنید'
            };
        }
        
        // بررسی Alt
        let imagesWithMainKeyword = 0;
        let imagesWithSecondaryKeyword = 0;
        let imagesWithoutAlt = 0;
        
        images.forEach(img => {
            const altText = img.getAttribute('alt');
            if (!altText || altText.trim() === '') {
                imagesWithoutAlt++;
            } else {
                if (Utils.findKeyword(altText, mainKeyword).length > 0) {
                    imagesWithMainKeyword++;
                } else if (secondaryKeywords.some(kw => Utils.findKeyword(altText, kw).length > 0)) {
                    imagesWithSecondaryKeyword++;
                }
            }
        });
        
        const totalImages = images.length;
        const imagesWithKeywords = imagesWithMainKeyword + imagesWithSecondaryKeyword;
        const keywordCoverage = (imagesWithKeywords / totalImages) * 100;
        
        // بررسی نسبت
        const wordsPerImage = totalWords / totalImages;
        const ratioOK = wordsPerImage <= CONFIG.SEO_LIMITS.MAX_ACCEPTABLE_WORDS_PER_IMAGE;
        
        // تعیین وضعیت
        let status, desc, detail;
        
        if (keywordCoverage >= 70 && ratioOK) {
            status = CONFIG.CHECK_STATUS.SUCCESS;
            desc = `✓ ${imagesWithKeywords}/${totalImages} تصویر با کلمه کلیدی | نسبت مناسب`;
        } else if (keywordCoverage < 40 || !ratioOK) {
            status = CONFIG.CHECK_STATUS.ERROR;
            desc = `${imagesWithKeywords}/${totalImages} تصویر با کلمه کلیدی | نسبت: ${Math.round(wordsPerImage)} کلمه/تصویر`;
            detail = imagesWithoutAlt > 0 ? `${imagesWithoutAlt} تصویر بدون alt` : null;
        } else {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `${imagesWithKeywords}/${totalImages} تصویر با کلمه کلیدی | نسبت: ${Math.round(wordsPerImage)} کلمه/تصویر`;
            detail = `توصیه: ${imagesWithoutAlt > 0 ? `${imagesWithoutAlt} تصویر بدون alt | ` : ''}حداقل ${Math.ceil(totalWords / 350)} تصویر`;
        }
        
        return {
            status,
            title: 'تصاویر (Alt + نسبت)',
            tooltip: 'تصاویر باید alt با کلمه کلیدی داشته باشند. نسبت مناسب: هر 300-400 کلمه یک تصویر.',
            desc,
            detail
        };
    },

    /**
     * چک رنگ آبی
     */
    checkBlueKeyword(content, mainKeyword) {
        const temp = document.createElement('div');
        temp.innerHTML = content;
        const blueElements = temp.querySelectorAll('[style*="color"]');
        
        let hasBlueKeyword = false;
        for (let el of blueElements) {
            const style = el.style.color;
            if (style && (style.includes('blue') || style.includes('rgb(0, 0, 255)') || style.includes('#00f'))) {
                if (Utils.findKeyword(el.textContent, mainKeyword).length > 0) {
                    hasBlueKeyword = true;
                    break;
                }
            }
        }
        
        return {
            status: hasBlueKeyword ? CONFIG.CHECK_STATUS.SUCCESS : CONFIG.CHECK_STATUS.WARNING,
            title: 'رنگ آبی برای کلمه کلیدی',
            tooltip: 'رنگ آبی کلمه کلیدی را برجسته می‌کند.',
            desc: hasBlueKeyword ? 'کلمه کلیدی به رنگ آبی است ✓' : 'توصیه: کلمه کلیدی را آبی کنید'
        };
    },

    /**
     * چک لینک‌دهی
     */
    checkKeywordLinking(links, mainKeyword, secondaryKeywords) {
        if (links.length === 0) {
            return {
                status: CONFIG.CHECK_STATUS.WARNING,
                title: 'لینک‌دهی با کلمات کلیدی',
                tooltip: 'لینک‌ها باید با کلمات کلیدی مرتبط باشند.',
                desc: 'هیچ لینکی وجود ندارد',
                detail: 'توصیه: حداقل یک لینک با کلمه کلیدی اضافه کنید'
            };
        }

        const mainKeywordLower = mainKeyword.toLowerCase();
        const secondaryKeywordsLower = secondaryKeywords.map(k => k.toLowerCase());
        let totalKeywordLinks = 0;
        
        for (let link of links) {
            const linkText = link.textContent.toLowerCase().trim();
            if (linkText.includes(mainKeywordLower) || secondaryKeywordsLower.some(kw => linkText.includes(kw))) {
                totalKeywordLinks++;
            }
        }

        const percentage = (totalKeywordLinks / links.length) * 100;
        let status, desc;
        
        if (percentage >= 50) {
            status = CONFIG.CHECK_STATUS.SUCCESS;
            desc = `${totalKeywordLinks}/${links.length} لینک با کلمه کلیدی ✓`;
        } else {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `${totalKeywordLinks}/${links.length} لینک با کلمه کلیدی (${Math.round(percentage)}%)`;
        }
        
        return {
            status,
            title: 'لینک‌دهی با کلمات کلیدی',
            tooltip: 'حداقل 50% لینک‌ها باید با کلمات کلیدی مرتبط باشند.',
            desc,
            detail: percentage < 50 ? 'توصیه: لینک‌های بیشتری با کلمات کلیدی اضافه کنید' : null
        };
    },

    /**
     * چک‌های خوانایی
     */
    performReadabilityChecks(content, plainText) {
        return [
            this.checkSentenceLength(plainText),
            this.checkParagraphLength(content)
        ];
    },

    /**
     * چک طول جملات
     */
    checkSentenceLength(plainText) {
        const sentences = Utils.splitIntoSentences(plainText);
        if (sentences.length === 0) {
            return {
                status: CONFIG.CHECK_STATUS.WARNING,
                title: 'طول جملات',
                tooltip: 'جملات بلند (بیش از 20 کلمه) خوانایی را کاهش می‌دهند.',
                desc: 'هیچ جمله‌ای یافت نشد',
                detail: null
            };
        }
        
        const shortSentences = [];
        const mediumSentences = [];
        const longSentences = [];
        const veryLongSentences = [];
        
        sentences.forEach(sentence => {
            const wordCount = Utils.countWords(sentence);
            if (wordCount <= 12) shortSentences.push(sentence);
            else if (wordCount <= 18) mediumSentences.push(sentence);
            else if (wordCount <= 25) longSentences.push(sentence);
            else veryLongSentences.push(sentence);
        });
        
        const totalSentences = sentences.length;
        const longPercentage = ((longSentences.length + veryLongSentences.length) / totalSentences) * 100;
        
        let status, desc;
        if (veryLongSentences.length === 0 && longSentences.length <= 2) {
            status = CONFIG.CHECK_STATUS.SUCCESS;
            desc = `✓ ${shortSentences.length + mediumSentences.length} جمله در طول مناسب`;
        } else if (longPercentage > 30) {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `${longSentences.length + veryLongSentences.length} جمله بلند (${longPercentage.toFixed(0)}%)`;
        } else {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `${veryLongSentences.length} جمله خیلی بلند`;
        }
        
        const stats = `کوتاه: ${shortSentences.length} | متوسط: ${mediumSentences.length} | بلند: ${longSentences.length} | خیلی بلند: ${veryLongSentences.length}`;
        
        return {
            status,
            title: 'طول جملات',
            tooltip: 'حداقل 70% جملات باید کمتر از 20 کلمه باشند.',
            desc,
            detail: stats,
            longSentences: [...longSentences, ...veryLongSentences]
        };
    },

    /**
     * چک طول پاراگراف‌ها
     */
    checkParagraphLength(content) {
        const paragraphs = Utils.extractParagraphs(content);
        if (paragraphs.length === 0) {
            return {
                status: CONFIG.CHECK_STATUS.WARNING,
                title: 'طول پاراگراف‌ها',
                tooltip: 'پاراگراف‌های بلند (بیش از 150 کلمه) خواننده را خسته می‌کنند.',
                desc: 'هیچ پاراگرافی یافت نشد',
                detail: null
            };
        }
        
        const shortParagraphs = [];
        const mediumParagraphs = [];
        const longParagraphs = [];
        const veryLongParagraphs = [];
        
        paragraphs.forEach(paragraph => {
            const wordCount = Utils.countWords(paragraph);
            if (wordCount <= 50) shortParagraphs.push({ text: paragraph, wordCount });
            else if (wordCount <= 100) mediumParagraphs.push({ text: paragraph, wordCount });
            else if (wordCount <= 150) longParagraphs.push({ text: paragraph, wordCount });
            else veryLongParagraphs.push({ text: paragraph, wordCount });
        });
        
        const totalParagraphs = paragraphs.length;
        const longPercentage = ((longParagraphs.length + veryLongParagraphs.length) / totalParagraphs) * 100;
        
        let status, desc;
        if (veryLongParagraphs.length === 0 && longParagraphs.length <= 1) {
            status = CONFIG.CHECK_STATUS.SUCCESS;
            desc = `✓ ${shortParagraphs.length + mediumParagraphs.length} پاراگراف در طول مناسب`;
        } else if (longPercentage > 40) {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `${longParagraphs.length + veryLongParagraphs.length} پاراگراف بلند (${longPercentage.toFixed(0)}%)`;
        } else {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `${veryLongParagraphs.length} پاراگراف خیلی بلند`;
        }
        
        const stats = `کوتاه: ${shortParagraphs.length} | متوسط: ${mediumParagraphs.length} | بلند: ${longParagraphs.length} | خیلی بلند: ${veryLongParagraphs.length}`;
        
        return {
            status,
            title: 'طول پاراگراف‌ها',
            tooltip: 'حداقل 70% پاراگراف‌ها باید کمتر از 100 کلمه باشند.',
            desc,
            detail: stats,
            longParagraphs: [...longParagraphs, ...veryLongParagraphs]
        };
    },

    /**
     * پیشنهادات کلمات کلیدی
     */
    performSuggestionChecks(plainText) {
        const checks = [];
        checks.push(this.detectMainKeyword(plainText));
        checks.push(this.detectSecondaryKeywords(plainText));
        return checks;
    },

    detectMainKeyword(plainText) {
        const suggestions = Utils.detectMainKeyword(plainText, 5);
        
        if (suggestions.length === 0) {
            return {
                status: CONFIG.CHECK_STATUS.WARNING,
                title: 'تشخیص کلمه کلیدی اصلی',
                tooltip: 'کلمه کلیدی اصلی مهم‌ترین عبارت در محتوا است.',
                desc: 'کلمه کلیدی مناسب یافت نشد',
                detail: 'محتوا باید حداقل 200 کلمه باشد',
                suggestions: []
            };
        }

        const suggestionText = suggestions.map(s => `${s.keyword} (Q:${s.quality})`).join('، ');
        return {
            status: CONFIG.CHECK_STATUS.SUCCESS,
            title: 'تشخیص کلمه کلیدی اصلی',
            tooltip: 'کلمه کلیدی اصلی باید در عنوان و پاراگراف اول باشد.',
            desc: `پیشنهادات: ${suggestionText}`,
            detail: suggestions.map(s => `${s.keyword}: ${s.frequency} بار (Q:${s.quality}, R:${s.relevance})`).join('\n'),
            suggestions
        };
    },

    detectSecondaryKeywords(plainText) {
        const suggestions = Utils.detectSecondaryKeywords(plainText, 10);
        
        if (suggestions.length === 0) {
            return {
                status: CONFIG.CHECK_STATUS.WARNING,
                title: 'تشخیص کلمات کلیدی فرعی',
                tooltip: 'کلمات فرعی به جذب ترافیک بیشتر کمک می‌کنند.',
                desc: 'کلمه فرعی مناسب یافت نشد',
                detail: 'محتوا باید شامل عبارات متنوع باشد',
                suggestions: []
            };
        }

        const suggestionText = suggestions.map(s => `${s.keyword} (Q:${s.quality})`).join('، ');
        return {
            status: CONFIG.CHECK_STATUS.SUCCESS,
            title: 'تشخیص کلمات کلیدی فرعی',
            tooltip: 'کلمات فرعی باید در متن پراکنده باشند.',
            desc: `پیشنهادات: ${suggestionText}`,
            detail: suggestions.map(s => `${s.keyword}: ${s.frequency} بار (Q:${s.quality}, R:${s.relevance})`).join('\n'),
            suggestions
        };
    },

    /**
     * محاسبه امتیاز
     */
    calculateScore(checks) {
        const scoreAffectingChecks = checks.filter(c => 
            c.title !== 'لینک‌دهی با کلمات کلیدی' && 
            c.title !== 'تشخیص کلمه کلیدی اصلی' &&
            c.title !== 'تشخیص کلمات کلیدی فرعی'
        );
        const successCount = scoreAffectingChecks.filter(c => c.status === CONFIG.CHECK_STATUS.SUCCESS).length;
        return Math.round((successCount / scoreAffectingChecks.length) * 100);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SEOAnalyzer;
}
