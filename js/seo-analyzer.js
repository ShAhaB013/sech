/**
 * ماژول تحلیل SEO - با نمره‌دهی دقیق‌تر
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
            readabilityChecks: this.performReadabilityChecks(content, plainText)
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
        // ✅ رنگ آبی: حذف از محاسبه نمره (hasScore: false)
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
            detail: found ? `عنوان: "${Utils.displayText(text)}"` : null,
            hasScore: true // ✅ در نمره تاثیر دارد
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
            detail: inFirstPara ? Utils.displayText(firstPara.substring(0, 80)) + '...' : null,
            hasScore: true
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
            detail: `${keywordCount} بار از ${totalWordsWithoutHeadings} کلمه`,
            hasScore: true
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
            detail: totalWordsInHeadings > 0 ? `${keywordCountInHeadings} بار از ${totalWordsInHeadings} کلمه` : 'لطفاً هدینگ اضافه کنید',
            hasScore: true
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
                detail: 'لطفاً کلمات فرعی را وارد کنید',
                hasScore: true
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
            detail: foundSecondary.length > 0 ? `یافت شده: ${foundSecondary.map(k => Utils.displayText(k)).join('، ')}` : null,
            hasScore: true
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
                detail: 'لطفاً تصویر اضافه کنید',
                hasScore: true
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
            detail,
            hasScore: true
        };
    },

    /**
     * ✅ چک رنگ آبی - بدون نمره
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
            desc: hasBlueKeyword ? 'کلمه کلیدی به رنگ آبی است ✓' : 'توصیه: کلمه کلیدی را آبی کنید',
            hasScore: false // ✅ در محاسبه نمره تاثیر ندارد
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
                detail: 'توصیه: حداقل یک لینک با کلمه کلیدی اضافه کنید',
                hasScore: true
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
            detail: percentage < 50 ? 'توصیه: لینک‌های بیشتری با کلمات کلیدی اضافه کنید' : null,
            hasScore: true
        };
    },

    /**
     * ✅ چک‌های خوانایی - با استاندارد Yoast
     */
    performReadabilityChecks(content, plainText) {
        return [
            this.checkSentenceLength(plainText),
            this.checkParagraphLength(content)
        ];
    },

    /**
     * ✅ چک طول جملات - استاندارد Yoast (حداکثر 25% بلند)
     */
    checkSentenceLength(plainText) {
        const sentences = Utils.splitIntoSentences(plainText);
        if (sentences.length === 0) {
            return {
                status: CONFIG.CHECK_STATUS.WARNING,
                title: 'طول جملات',
                tooltip: 'جملات بلند (بیش از 20 کلمه) خوانایی را کاهش می‌دهند. حداکثر 25% جملات می‌توانند بلند باشند.',
                desc: 'هیچ جمله‌ای یافت نشد',
                detail: null,
                hasScore: false // خوانایی در نمره SEO تاثیر ندارد
            };
        }
        
        const shortSentences = [];
        const mediumSentences = [];
        const longSentences = [];
        
        sentences.forEach(sentence => {
            const wordCount = Utils.countWords(sentence);
            if (wordCount <= 15) shortSentences.push(sentence);
            else if (wordCount <= 20) mediumSentences.push(sentence);
            else longSentences.push(sentence); // بلند = بیش از 20 کلمه
        });
        
        const totalSentences = sentences.length;
        const longPercentage = (longSentences.length / totalSentences) * 100;
        
        // ✅ استاندارد Yoast: حداکثر 25% جملات بلند
        let status, desc;
        if (longPercentage <= 25) {
            status = CONFIG.CHECK_STATUS.SUCCESS;
            desc = `✓ ${longPercentage.toFixed(1)}% جملات بلند (حداکثر 25%)`;
        } else if (longPercentage <= 35) {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `⚠️ ${longPercentage.toFixed(1)}% جملات بلند (توصیه: کمتر از 25%)`;
        } else {
            status = CONFIG.CHECK_STATUS.ERROR;
            desc = `✕ ${longPercentage.toFixed(1)}% جملات بلند (بسیار زیاد!)`;
        }
        
        const stats = `کوتاه (≤15): ${shortSentences.length} | متوسط (16-20): ${mediumSentences.length} | بلند (>20): ${longSentences.length}`;
        
        return {
            status,
            title: 'طول جملات',
            tooltip: 'حداکثر 25% از جملات می‌توانند بیش از 20 کلمه داشته باشند.',
            desc,
            detail: stats,
            longSentences: longSentences,
            hasScore: false
        };
    },

    /**
     * ✅ چک طول پاراگراف‌ها - استاندارد Yoast (حداکثر 25% بلند)
     */
    checkParagraphLength(content) {
        const paragraphs = Utils.extractParagraphs(content);
        if (paragraphs.length === 0) {
            return {
                status: CONFIG.CHECK_STATUS.WARNING,
                title: 'طول پاراگراف‌ها',
                tooltip: 'پاراگراف‌های بلند (بیش از 150 کلمه) خواننده را خسته می‌کنند. حداکثر 25% پاراگراف‌ها می‌توانند بلند باشند.',
                desc: 'هیچ پاراگرافی یافت نشد',
                detail: null,
                hasScore: false
            };
        }
        
        const shortParagraphs = [];
        const mediumParagraphs = [];
        const longParagraphs = [];
        
        paragraphs.forEach(paragraph => {
            const wordCount = Utils.countWords(paragraph);
            if (wordCount <= 100) shortParagraphs.push({ text: paragraph, wordCount });
            else if (wordCount <= 150) mediumParagraphs.push({ text: paragraph, wordCount });
            else longParagraphs.push({ text: paragraph, wordCount }); // بلند = بیش از 150 کلمه
        });
        
        const totalParagraphs = paragraphs.length;
        const longPercentage = (longParagraphs.length / totalParagraphs) * 100;
        
        // ✅ استاندارد Yoast: حداکثر 25% پاراگراف‌های بلند
        let status, desc;
        if (longPercentage <= 25) {
            status = CONFIG.CHECK_STATUS.SUCCESS;
            desc = `✓ ${longPercentage.toFixed(1)}% پاراگراف بلند (حداکثر 25%)`;
        } else if (longPercentage <= 35) {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `⚠️ ${longPercentage.toFixed(1)}% پاراگراف بلند (توصیه: کمتر از 25%)`;
        } else {
            status = CONFIG.CHECK_STATUS.ERROR;
            desc = `✕ ${longPercentage.toFixed(1)}% پاراگراف بلند (بسیار زیاد!)`;
        }
        
        const stats = `کوتاه (≤100): ${shortParagraphs.length} | متوسط (101-150): ${mediumParagraphs.length} | بلند (>150): ${longParagraphs.length}`;
        
        return {
            status,
            title: 'طول پاراگراف‌ها',
            tooltip: 'حداکثر 25% از پاراگراف‌ها می‌توانند بیش از 150 کلمه داشته باشند.',
            desc,
            detail: stats,
            longParagraphs: longParagraphs,
            hasScore: false
        };
    },

    /**
     * ✅ محاسبه امتیاز - فقط چک‌های با hasScore: true
     */
    calculateScore(checks) {
        // فیلتر چک‌های با امتیاز
        const scoreAffectingChecks = checks.filter(c => c.hasScore !== false);
        
        if (scoreAffectingChecks.length === 0) return 0;
        
        const successCount = scoreAffectingChecks.filter(c => c.status === CONFIG.CHECK_STATUS.SUCCESS).length;
        return Math.round((successCount / scoreAffectingChecks.length) * 100);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SEOAnalyzer;
}
