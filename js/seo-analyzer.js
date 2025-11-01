/**
 * ماژول تحلیل SEO - نسخه بهینه شده
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
     * انجام چک‌های SEO
     */
    performSEOChecks(content, plainText, mainKeyword, secondaryKeywords, totalWords, keywordCount, keywordDensity, totalWordsWithoutHeadings) {
        const checks = [];

        // چک عنوان H1
        checks.push(this.checkH1Keyword(content, mainKeyword));

        // چک تصاویر (با کلمات فرعی)
        checks.push(this.checkImageAlt(content, mainKeyword, secondaryKeywords));

        // چک پاراگراف اول
        checks.push(this.checkFirstParagraph(content, mainKeyword));

        // چک تراکم کلمه کلیدی
        checks.push(this.checkKeywordDensity(keywordDensity, keywordCount, totalWordsWithoutHeadings));

        // چک تراکم کلمه کلیدی در هدینگ‌ها
        checks.push(this.checkKeywordDensityInHeadings(content, mainKeyword));

        // چک کلمات کلیدی فرعی
        checks.push(this.checkSecondaryKeywords(plainText, secondaryKeywords));

        // چک رنگ آبی
        checks.push(this.checkBlueKeyword(content, mainKeyword));

        // چک نسبت تصویر به متن
        checks.push(this.checkImageRatio(content, totalWords));

        // چک لینک‌دهی با کلمات کلیدی
        checks.push(this.checkKeywordLinking(content, mainKeyword, secondaryKeywords));

        return checks;
    },

    /**
     * انجام چک‌های پیشنهادی (تب پیشنهادات)
     */
    performSuggestionChecks(plainText) {
        const checks = [];

        // تشخیص کلمه کلیدی اصلی
        checks.push(this.detectMainKeyword(plainText));

        // تشخیص کلمات کلیدی فرعی
        checks.push(this.detectSecondaryKeywords(plainText));

        return checks;
    },

    /**
     * چک کلمه کلیدی در H1
     */
    checkH1Keyword(content, mainKeyword) {
        const h1Check = Utils.hasKeywordInSection(content, mainKeyword, 'h1');
        
        return {
            status: h1Check.found ? CONFIG.CHECK_STATUS.SUCCESS : CONFIG.CHECK_STATUS.ERROR,
            title: 'کلمه کلیدی در عنوان (H1)',
            tooltip: 'عنوان اصلی مقاله (H1) باید حتماً شامل کلمه کلیدی باشد. این مهم‌ترین تگ برای سئو است.',
            desc: h1Check.found ? 'عنوان شامل کلمه کلیدی است ✓' : 'عنوان H1 باید شامل کلمه کلیدی اصلی باشد',
            detail: h1Check.found ? `عنوان: "${h1Check.text}"` : null
        };
    },

    /**
     * چک متن جایگزین تصاویر (پیشرفته با کلمات فرعی)
     */
    checkImageAlt(content, mainKeyword, secondaryKeywords = []) {
        const temp = document.createElement('div');
        temp.innerHTML = content;
        const allImages = temp.querySelectorAll('img');
        
        if (allImages.length === 0) {
            return {
                status: CONFIG.CHECK_STATUS.WARNING,
                title: 'کلمه کلیدی در زیرنویس تصاویر',
                tooltip: 'استفاده از کلمات کلیدی (اصلی یا فرعی) در متن جایگزین (alt) تصاویر به بهبود سئو تصاویر و دسترسی‌پذیری کمک می‌کند.',
                desc: 'هیچ تصویری در محتوا یافت نشد',
                detail: 'لطفاً تصویر به محتوا اضافه کنید'
            };
        }
        
        // آمارگیری دقیق
        let imagesWithMainKeyword = [];
        let imagesWithSecondaryKeyword = [];
        let imagesWithoutAlt = [];
        let imagesWithEmptyAlt = [];
        
        allImages.forEach((img, index) => {
            const altText = img.getAttribute('alt');
            
            if (!altText) {
                imagesWithoutAlt.push(index + 1);
            } else if (altText.trim() === '') {
                imagesWithEmptyAlt.push(index + 1);
            } else {
                // بررسی کلمه کلیدی اصلی
                if (Utils.findKeyword(altText, mainKeyword).length > 0) {
                    imagesWithMainKeyword.push({
                        index: index + 1,
                        alt: altText
                    });
                } else if (secondaryKeywords.length > 0) {
                    // بررسی کلمات کلیدی فرعی
                    const foundSecondary = secondaryKeywords.find(kw => 
                        Utils.findKeyword(altText, kw).length > 0
                    );
                    if (foundSecondary) {
                        imagesWithSecondaryKeyword.push({
                            index: index + 1,
                            alt: altText,
                            keyword: foundSecondary
                        });
                    }
                }
            }
        });
        
        const totalImages = allImages.length;
        const imagesWithKeywords = imagesWithMainKeyword.length + imagesWithSecondaryKeyword.length;
        const keywordCoverage = (imagesWithKeywords / totalImages) * 100;
        
        // تعیین وضعیت
        let status, desc, detail;
        
        if (imagesWithKeywords === 0) {
            status = CONFIG.CHECK_STATUS.ERROR;
            desc = `هیچ تصویری (از ${totalImages} تصویر) شامل کلمه کلیدی نیست`;
            
            let detailParts = [];
            if (imagesWithoutAlt.length > 0) {
                detailParts.push(`⚠️ ${imagesWithoutAlt.length} تصویر بدون alt: شماره ${imagesWithoutAlt.join('، ')}`);
            }
            if (imagesWithEmptyAlt.length > 0) {
                detailParts.push(`⚠️ ${imagesWithEmptyAlt.length} تصویر با alt خالی: شماره ${imagesWithEmptyAlt.join('، ')}`);
            }
            detailParts.push('💡 توصیه: از کلمات کلیدی اصلی یا فرعی در alt تصاویر استفاده کنید');
            detail = detailParts.join('\n');
            
        } else if (keywordCoverage >= 70) {
            status = CONFIG.CHECK_STATUS.SUCCESS;
            desc = `عالی! ${imagesWithKeywords} از ${totalImages} تصویر شامل کلمه کلیدی است (${Math.round(keywordCoverage)}%) ✓`;
            
            let detailParts = [];
            if (imagesWithMainKeyword.length > 0) {
                detailParts.push(`✅ ${imagesWithMainKeyword.length} تصویر با کلمه کلیدی اصلی:`);
                imagesWithMainKeyword.forEach(img => {
                    const altPreview = img.alt.length > 60 ? img.alt.substring(0, 60) + '...' : img.alt;
                    detailParts.push(`  • تصویر ${img.index}: "${Utils.displayText(altPreview)}"`);
                });
            }
            if (imagesWithSecondaryKeyword.length > 0) {
                detailParts.push(`✅ ${imagesWithSecondaryKeyword.length} تصویر با کلمه کلیدی فرعی:`);
                imagesWithSecondaryKeyword.forEach(img => {
                    const altPreview = img.alt.length > 50 ? img.alt.substring(0, 50) + '...' : img.alt;
                    detailParts.push(`  • تصویر ${img.index} (${img.keyword}): "${Utils.displayText(altPreview)}"`);
                });
            }
            detail = detailParts.join('\n');
            
        } else if (keywordCoverage >= 40) {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `${imagesWithKeywords} از ${totalImages} تصویر شامل کلمه کلیدی است (${Math.round(keywordCoverage)}%)`;
            
            let detailParts = [];
            if (imagesWithMainKeyword.length > 0) {
                detailParts.push(`✅ ${imagesWithMainKeyword.length} تصویر با کلمه اصلی`);
            }
            if (imagesWithSecondaryKeyword.length > 0) {
                detailParts.push(`✅ ${imagesWithSecondaryKeyword.length} تصویر با کلمه فرعی`);
            }
            const imagesNeedKeyword = totalImages - imagesWithKeywords;
            if (imagesNeedKeyword > 0) {
                detailParts.push(`⚠️ ${imagesNeedKeyword} تصویر دیگر نیاز به کلمه کلیدی دارند`);
            }
            if (imagesWithoutAlt.length > 0) {
                detailParts.push(`⚠️ ${imagesWithoutAlt.length} تصویر بدون alt`);
            }
            detailParts.push('💡 توصیه: حداقل 70% تصاویر باید شامل کلمه کلیدی باشند');
            detail = detailParts.join('\n');
            
        } else {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `فقط ${imagesWithKeywords} از ${totalImages} تصویر شامل کلمه کلیدی است (${Math.round(keywordCoverage)}%)`;
            
            let detailParts = [];
            if (imagesWithMainKeyword.length > 0) {
                detailParts.push(`✅ ${imagesWithMainKeyword.length} تصویر با کلمه اصلی`);
            }
            if (imagesWithSecondaryKeyword.length > 0) {
                detailParts.push(`✅ ${imagesWithSecondaryKeyword.length} تصویر با کلمه فرعی`);
            }
            if (imagesWithoutAlt.length > 0) {
                detailParts.push(`⚠️ ${imagesWithoutAlt.length} تصویر بدون alt: شماره ${imagesWithoutAlt.join('، ')}`);
            }
            if (imagesWithEmptyAlt.length > 0) {
                detailParts.push(`⚠️ ${imagesWithEmptyAlt.length} تصویر با alt خالی: شماره ${imagesWithEmptyAlt.join('، ')}`);
            }
            detailParts.push('💡 توصیه: حداقل 70% تصاویر باید شامل کلمه کلیدی باشند');
            detail = detailParts.join('\n');
        }
        
        return {
            status,
            title: 'کلمه کلیدی در زیرنویس تصاویر',
            tooltip: 'استفاده از کلمات کلیدی (اصلی یا فرعی) در متن جایگزین (alt) تصاویر به بهبود سئو تصاویر و دسترسی‌پذیری کمک می‌کند. حداقل 70% تصاویر باید دارای alt با کلمه کلیدی باشند.',
            desc,
            detail
        };
    },

    /**
     * چک پاراگراف اول
     */
    checkFirstParagraph(content, mainKeyword) {
        const firstPara = Utils.getFirstParagraph(content);
        const inFirstPara = Utils.findKeyword(firstPara, mainKeyword).length > 0;
        
        return {
            status: inFirstPara ? CONFIG.CHECK_STATUS.SUCCESS : CONFIG.CHECK_STATUS.ERROR,
            title: 'کلمه کلیدی در پاراگراف اول',
            tooltip: 'پاراگراف اول مقاله (بدون در نظر گرفتن عنوان H1) باید حتماً شامل کلمه کلیدی باشد تا موضوع مقاله از ابتدا مشخص شود.',
            desc: inFirstPara 
                ? 'پاراگراف اول شامل کلمه کلیدی است ✓' 
                : 'پاراگراف اول باید حتماً شامل کلمه کلیدی باشد',
            detail: inFirstPara ? Utils.displayText(firstPara.substring(0, 80)) + '...' : null
        };
    },

    /**
     * چک تراکم کلمه کلیدی (فقط در متن بدون هدینگ‌ها)
     */
    checkKeywordDensity(density, keywordCount, totalWordsWithoutHeadings) {
        const { MIN_KEYWORD_DENSITY, MAX_KEYWORD_DENSITY } = CONFIG.SEO_LIMITS;
        const densityOK = density >= MIN_KEYWORD_DENSITY && density <= MAX_KEYWORD_DENSITY;
        
        let status, desc;
        if (densityOK) {
            status = CONFIG.CHECK_STATUS.SUCCESS;
            desc = `تراکم مناسب در متن: ${Utils.formatDecimal(density)}% ✓`;
        } else if (density < MIN_KEYWORD_DENSITY) {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `تراکم کم در متن: ${Utils.formatDecimal(density)}% (باید بین ${MIN_KEYWORD_DENSITY} تا ${MAX_KEYWORD_DENSITY} درصد باشد)`;
        } else {
            status = CONFIG.CHECK_STATUS.ERROR;
            desc = `تراکم زیاد در متن: ${Utils.formatDecimal(density)}% (خطر Keyword Stuffing)`;
        }
        
        return {
            status,
            title: 'تراکم کلمه کلیدی (فقط در متن)',
            tooltip: `تراکم مناسب کلمه کلیدی در متن مقاله (بدون هدینگ‌ها) بین ${MIN_KEYWORD_DENSITY} تا ${MAX_KEYWORD_DENSITY} درصد است. کمتر از این باعث ضعف سئو و بیشتر از این باعث Keyword Stuffing می‌شود. این محاسبه فقط روی متن اصلی مقاله انجام می‌شود و هدینگ‌ها در آن لحاظ نمی‌شوند.`,
            desc,
            detail: `${keywordCount} بار از ${totalWordsWithoutHeadings} کلمه (در متن بدون هدینگ‌ها)`
        };
    },

    /**
     * چک تراکم کلمه کلیدی (فقط در هدینگ‌ها)
     */
    checkKeywordDensityInHeadings(content, mainKeyword) {
        const headingsText = Utils.extractTextFromHeadings(content);
        const totalWordsInHeadings = Utils.countWords(headingsText);
        const keywordCountInHeadings = Utils.findKeyword(headingsText, mainKeyword).length;
        const headingDensity = Utils.calculatePercentage(keywordCountInHeadings, totalWordsInHeadings);
        
        const MIN_HEADING_DENSITY = 3;
        const MAX_HEADING_DENSITY = 10;
        
        let status, desc;
        
        if (totalWordsInHeadings === 0) {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = 'هیچ هدینگی در محتوا وجود ندارد';
        } else if (keywordCountInHeadings === 0) {
            status = CONFIG.CHECK_STATUS.ERROR;
            desc = 'کلمه کلیدی در هیچ هدینگی یافت نشد';
        } else if (headingDensity >= MIN_HEADING_DENSITY && headingDensity <= MAX_HEADING_DENSITY) {
            status = CONFIG.CHECK_STATUS.SUCCESS;
            desc = `تراکم مناسب در هدینگ‌ها: ${Utils.formatDecimal(headingDensity)}% ✓`;
        } else if (headingDensity < MIN_HEADING_DENSITY) {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `تراکم کم در هدینگ‌ها: ${Utils.formatDecimal(headingDensity)}% (باید بین ${MIN_HEADING_DENSITY} تا ${MAX_HEADING_DENSITY} درصد باشد)`;
        } else {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `تراکم زیاد در هدینگ‌ها: ${Utils.formatDecimal(headingDensity)}%`;
        }
        
        return {
            status,
            title: 'تراکم کلمه کلیدی (فقط در هدینگ‌ها)',
            tooltip: `تراکم مناسب کلمه کلیدی در هدینگ‌ها (H1 تا H6) بین ${MIN_HEADING_DENSITY} تا ${MAX_HEADING_DENSITY} درصد است. هدینگ‌ها از مهم‌ترین عوامل سئو هستند و باید حتماً شامل کلمه کلیدی باشند. تراکم بالاتر در هدینگ‌ها نسبت به متن طبیعی است چون هدینگ‌ها باید موضوع را خلاصه کنند.`,
            desc,
            detail: totalWordsInHeadings > 0 
                ? `${keywordCountInHeadings} بار از ${totalWordsInHeadings} کلمه (در ${this.countHeadings(content)} هدینگ)` 
                : 'لطفاً هدینگ به محتوا اضافه کنید'
        };
    },

    /**
     * شمارش تعداد هدینگ‌ها (بهینه شده)
     */
    countHeadings(content) {
        const temp = document.createElement('div');
        temp.innerHTML = content;
        return temp.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
    },

    /**
     * چک کلمات کلیدی فرعی
     */
    checkSecondaryKeywords(plainText, secondaryKeywords) {
        if (secondaryKeywords.length === 0) {
            return {
                status: CONFIG.CHECK_STATUS.WARNING,
                title: 'کلمات کلیدی فرعی',
                tooltip: 'کلمات کلیدی فرعی به جذب ترافیک از جستجوهای مرتبط کمک می‌کنند. حداقل 70% از کلمات فرعی باید در متن باشند.',
                desc: 'هیچ کلمه کلیدی فرعی تعریف نشده است',
                detail: 'لطفاً کلمات کلیدی فرعی را در بالا وارد کنید'
            };
        }

        const foundSecondary = secondaryKeywords.filter(kw => 
            Utils.findKeyword(plainText, kw).length > 0
        );
        
        const percentage = (foundSecondary.length / secondaryKeywords.length) * 100;
        const isGood = percentage >= CONFIG.SEO_LIMITS.MIN_SECONDARY_KEYWORD_PERCENTAGE;
        
        return {
            status: isGood ? CONFIG.CHECK_STATUS.SUCCESS : CONFIG.CHECK_STATUS.WARNING,
            title: 'کلمات کلیدی فرعی',
            tooltip: 'کلمات کلیدی فرعی به جذب ترافیک از جستجوهای مرتبط کمک می‌کنند. حداقل 70% از کلمات فرعی باید در متن باشند.',
            desc: `${foundSecondary.length} از ${secondaryKeywords.length} کلمه فرعی در متن یافت شد`,
            detail: foundSecondary.length > 0 
                ? `یافت شده: ${foundSecondary.map(k => Utils.displayText(k)).join('، ')}`
                : 'هیچ کلمه فرعی در متن یافت نشد'
        };
    },

    /**
     * چک رنگ آبی برای کلمه کلیدی (بهینه شده)
     */
    checkBlueKeyword(content, mainKeyword) {
        const temp = document.createElement('div');
        temp.innerHTML = content;
        
        // بهینه‌سازی: استفاده از selector ساده‌تر
        const blueElements = temp.querySelectorAll('[style*="color"]');
        
        let hasBlueKeyword = false;
        for (let element of blueElements) {
            const style = element.style.color;
            if (style && (
                style.includes('blue') || 
                style.includes('rgb(0, 0, 255)') || 
                style.includes('#00f') || 
                style.includes('#0000ff')
            )) {
                if (Utils.findKeyword(element.textContent, mainKeyword).length > 0) {
                    hasBlueKeyword = true;
                    break;
                }
            }
        }
        
        return {
            status: hasBlueKeyword ? CONFIG.CHECK_STATUS.SUCCESS : CONFIG.CHECK_STATUS.WARNING,
            title: 'رنگ آبی برای کلمه کلیدی',
            tooltip: 'رنگ آبی برای کلمه کلیدی باعث تمایز بصری و جلب توجه خواننده می‌شود و به یادآوری موضوع اصلی کمک می‌کند.',
            desc: hasBlueKeyword 
                ? 'کلمه کلیدی به رنگ آبی است ✓' 
                : 'توصیه می‌شود کلمه کلیدی اصلی را به رنگ آبی نمایش دهید'
        };
    },

    /**
     * چک نسبت تصویر به متن (بهینه شده)
     */
    checkImageRatio(content, totalWords) {
        const temp = document.createElement('div');
        temp.innerHTML = content;
        const imageCount = temp.querySelectorAll('img').length;
        const wordsPerImage = imageCount > 0 ? totalWords / imageCount : totalWords;
        const imageRatioOK = imageCount > 0 && wordsPerImage <= CONFIG.SEO_LIMITS.MAX_ACCEPTABLE_WORDS_PER_IMAGE;
        
        let status, desc, detail;
        
        if (imageCount === 0) {
            status = CONFIG.CHECK_STATUS.ERROR;
            desc = 'هیچ تصویری در محتوا وجود ندارد';
            detail = 'لطفاً تصویر به محتوا اضافه کنید';
        } else if (imageRatioOK) {
            status = CONFIG.CHECK_STATUS.SUCCESS;
            desc = `نسبت مناسب: ${imageCount} تصویر برای ${totalWords} کلمه ✓`;
            detail = null;
        } else {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `نسبت نامناسب: ${Math.round(wordsPerImage)} کلمه به ازای هر تصویر`;
            detail = `توصیه می‌شود حداقل ${Math.ceil(totalWords / CONFIG.SEO_LIMITS.WORDS_PER_IMAGE)} تصویر داشته باشید`;
        }
        
        return {
            status,
            title: 'نسبت تصویر به متن',
            tooltip: 'برای خوانایی بهتر و جلوگیری از خستگی خواننده، توصیه می‌شود هر 300 تا 400 کلمه یک تصویر در محتوا قرار گیرد.',
            desc,
            detail
        };
    },

    /**
     * چک لینک‌دهی با کلمات کلیدی (بهینه شده)
     */
    checkKeywordLinking(content, mainKeyword, secondaryKeywords) {
        const temp = document.createElement('div');
        temp.innerHTML = content;
        const allLinks = temp.querySelectorAll('a[href]');
        
        if (allLinks.length === 0) {
            return {
                status: CONFIG.CHECK_STATUS.WARNING,
                title: 'لینک‌دهی با کلمات کلیدی',
                tooltip: 'استفاده از کلمات کلیدی در لینک‌ها به بهبود سئو و تجربه کاربری کمک می‌کند. لینک‌ها باید با کلمات کلیدی اصلی یا فرعی مرتبط باشند.',
                desc: 'هیچ لینکی در محتوا یافت نشد',
                detail: 'توصیه می‌شود حداقل یک لینک مرتبط با کلمات کلیدی اضافه کنید'
            };
        }

        const mainKeywordLower = mainKeyword.toLowerCase();
        const secondaryKeywordsLower = secondaryKeywords.map(k => k.toLowerCase());
        
        let totalKeywordLinks = 0;
        
        for (let link of allLinks) {
            const linkText = link.textContent.toLowerCase().trim();
            
            if (linkText.includes(mainKeywordLower) || 
                secondaryKeywordsLower.some(kw => linkText.includes(kw))) {
                totalKeywordLinks++;
            }
        }

        const keywordLinkPercentage = (totalKeywordLinks / allLinks.length) * 100;

        let status, desc, detail;
        
        if (keywordLinkPercentage >= 50) {
            status = CONFIG.CHECK_STATUS.SUCCESS;
            desc = `${totalKeywordLinks} از ${allLinks.length} لینک با کلمات کلیدی مرتبط است ✓`;
            detail = `درصد لینک‌های مرتبط: ${Math.round(keywordLinkPercentage)}%`;
        } else if (keywordLinkPercentage >= 25) {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `${totalKeywordLinks} از ${allLinks.length} لینک با کلمات کلیدی مرتبط است`;
            detail = `توصیه: لینک‌های بیشتری با کلمات کلیدی مرتبط کنید (درصد فعلی: ${Math.round(keywordLinkPercentage)}%)`;
        } else {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `${totalKeywordLinks} از ${allLinks.length} لینک با کلمات کلیدی مرتبط است`;
            detail = `توصیه: لینک‌های بیشتری با کلمات کلیدی اصلی یا فرعی اضافه کنید (درصد فعلی: ${Math.round(keywordLinkPercentage)}%)`;
        }

        return {
            status,
            title: 'لینک‌دهی با کلمات کلیدی',
            tooltip: 'استفاده از کلمات کلیدی در لینک‌ها به بهبود سئو و تجربه کاربری کمک می‌کند. لینک‌ها باید با کلمات کلیدی اصلی یا فرعی مرتبط باشند.',
            desc,
            detail
        };
    },

    /**
     * انجام چک‌های خوانایی
     */
    performReadabilityChecks(content, plainText) {
        const checks = [];
        
        checks.push(this.checkSentenceLength(plainText));
        checks.push(this.checkParagraphLength(content));
        
        return checks;
    },

    /**
     * چک طول جملات (بهبود یافته)
     */
    checkSentenceLength(plainText) {
        const sentences = Utils.splitIntoSentences(plainText);
        
        if (sentences.length === 0) {
            return {
                status: CONFIG.CHECK_STATUS.WARNING,
                title: 'طول جملات',
                tooltip: 'جملات بلند (بیش از 20 کلمه) خوانایی را کاهش می‌دهند. در متن فارسی، جملات باید حداکثر 18-20 کلمه باشند.',
                desc: 'هیچ جمله‌ای یافت نشد',
                detail: 'لطفاً محتوای بیشتری اضافه کنید'
            };
        }
        
        const shortSentences = [];
        const mediumSentences = [];
        const longSentences = [];
        const veryLongSentences = [];
        
        sentences.forEach(sentence => {
            const wordCount = Utils.countWords(sentence);
            
            if (wordCount <= 12) {
                shortSentences.push(sentence);
            } else if (wordCount <= 18) {
                mediumSentences.push(sentence);
            } else if (wordCount <= 25) {
                longSentences.push(sentence);
            } else {
                veryLongSentences.push(sentence);
            }
        });
        
        const totalSentences = sentences.length;
        const longPercentage = ((longSentences.length + veryLongSentences.length) / totalSentences) * 100;
        const veryLongPercentage = (veryLongSentences.length / totalSentences) * 100;
        
        let status, desc, detail;
        
        if (veryLongSentences.length === 0 && longSentences.length <= 2) {
            status = CONFIG.CHECK_STATUS.SUCCESS;
            desc = `عالی! ${shortSentences.length + mediumSentences.length} جمله در طول مناسب ✓`;
            detail = `کوتاه: ${shortSentences.length} | متوسط: ${mediumSentences.length} | بلند: ${longSentences.length}`;
        } else if (veryLongPercentage > 20) {
            status = CONFIG.CHECK_STATUS.ERROR;
            desc = `⚠️ ${veryLongSentences.length} جمله خیلی بلند (بیش از 25 کلمه) - ${veryLongPercentage.toFixed(0)}% از کل`;
            detail = `این جملات خوانایی را به شدت کاهش می‌دهند و باید حتماً کوتاه‌تر شوند. برای مشاهده، دکمه چشم را فعال کنید.`;
        } else if (longPercentage > 30) {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `${longSentences.length + veryLongSentences.length} جمله بلند (بیش از 18 کلمه) - ${longPercentage.toFixed(0)}% از کل`;
            detail = `توصیه: حداقل ${longPercentage > 40 ? 'نیمی از' : 'تعدادی از'} این جملات را به جملات کوتاه‌تر تبدیل کنید.`;
        } else if (veryLongSentences.length > 0) {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `${veryLongSentences.length} جمله خیلی بلند + ${longSentences.length} جمله بلند یافت شد`;
            detail = `جملات خیلی بلند (بیش از 25 کلمه) حتماً باید کوتاه‌تر شوند.`;
        } else {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `${longSentences.length} جمله بلند (19-25 کلمه) یافت شد`;
            detail = `این جملات قابل قبول هستند اما کوتاه‌تر کردن آنها خوانایی را بهبود می‌بخشد.`;
        }
        
        const stats = `\n\n📊 آمار جملات:\n` +
            `🟢 کوتاه (تا 12 کلمه): ${shortSentences.length} جمله (${((shortSentences.length / totalSentences) * 100).toFixed(0)}%)\n` +
            `🟡 متوسط (13-18 کلمه): ${mediumSentences.length} جمله (${((mediumSentences.length / totalSentences) * 100).toFixed(0)}%)\n` +
            `🟠 بلند (19-25 کلمه): ${longSentences.length} جمله (${((longSentences.length / totalSentences) * 100).toFixed(0)}%)\n` +
            `🔴 خیلی بلند (+25 کلمه): ${veryLongSentences.length} جمله (${veryLongPercentage.toFixed(0)}%)\n` +
            `\n💡 توصیه سئو: حداقل 70% جملات باید کوتاه یا متوسط باشند.`;
        
        return {
            status,
            title: 'طول جملات (بهینه‌سازی فارسی)',
            tooltip: `در متن فارسی، جملات کوتاه (تا 12 کلمه) و متوسط (13-18 کلمه) خوانایی بهتری دارند. جملات بلندتر از 20 کلمه خواندن را سخت می‌کنند و برای سئو مضر هستند. معیار یانک: حداقل 70% جملات باید کمتر از 20 کلمه باشند.`,
            desc,
            detail: detail + stats,
            longSentences: [...longSentences, ...veryLongSentences]
        };
    },

    /**
     * چک طول پاراگراف‌ها (بهبود یافته)
     */
    checkParagraphLength(content) {
        const paragraphs = Utils.extractParagraphs(content);
        
        if (paragraphs.length === 0) {
            return {
                status: CONFIG.CHECK_STATUS.WARNING,
                title: 'طول پاراگراف‌ها',
                tooltip: 'پاراگراف‌های بلند (بیش از 150 کلمه) خواننده را خسته می‌کنند. در متن فارسی، پاراگراف‌ها باید حداکثر 100-120 کلمه باشند.',
                desc: 'هیچ پاراگرافی یافت نشد',
                detail: 'لطفاً محتوای بیشتری اضافه کنید'
            };
        }
        
        const shortParagraphs = [];
        const mediumParagraphs = [];
        const longParagraphs = [];
        const veryLongParagraphs = [];
        
        paragraphs.forEach(paragraph => {
            const wordCount = Utils.countWords(paragraph);
            
            if (wordCount <= 50) {
                shortParagraphs.push({ text: paragraph, wordCount });
            } else if (wordCount <= 100) {
                mediumParagraphs.push({ text: paragraph, wordCount });
            } else if (wordCount <= 150) {
                longParagraphs.push({ text: paragraph, wordCount });
            } else {
                veryLongParagraphs.push({ text: paragraph, wordCount });
            }
        });
        
        const totalParagraphs = paragraphs.length;
        const longPercentage = ((longParagraphs.length + veryLongParagraphs.length) / totalParagraphs) * 100;
        const veryLongPercentage = (veryLongParagraphs.length / totalParagraphs) * 100;
        
        let status, desc, detail;
        
        if (veryLongParagraphs.length === 0 && longParagraphs.length <= 1) {
            status = CONFIG.CHECK_STATUS.SUCCESS;
            desc = `عالی! ${shortParagraphs.length + mediumParagraphs.length} پاراگراف در طول مناسب ✓`;
            detail = `کوتاه: ${shortParagraphs.length} | متوسط: ${mediumParagraphs.length} | بلند: ${longParagraphs.length}`;
        } else if (veryLongPercentage > 25) {
            status = CONFIG.CHECK_STATUS.ERROR;
            desc = `⚠️ ${veryLongParagraphs.length} پاراگراف خیلی بلند (بیش از 150 کلمه) - ${veryLongPercentage.toFixed(0)}% از کل`;
            detail = `این پاراگراف‌ها خواننده را خسته می‌کنند و باید حتماً تقسیم شوند. برای مشاهده، دکمه چشم را فعال کنید.`;
        } else if (longPercentage > 40) {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `${longParagraphs.length + veryLongParagraphs.length} پاراگراف بلند (بیش از 100 کلمه) - ${longPercentage.toFixed(0)}% از کل`;
            detail = `توصیه: حداقل ${longPercentage > 50 ? 'نیمی از' : 'تعدادی از'} این پاراگراف‌ها را به بخش‌های کوچک‌تر تقسیم کنید.`;
        } else if (veryLongParagraphs.length > 0) {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `${veryLongParagraphs.length} پاراگراف خیلی بلند + ${longParagraphs.length} پاراگراف بلند یافت شد`;
            detail = `پاراگراف‌های خیلی بلند (بیش از 150 کلمه) حتماً باید تقسیم شوند.`;
        } else {
            status = CONFIG.CHECK_STATUS.WARNING;
            desc = `${longParagraphs.length} پاراگراف بلند (101-150 کلمه) یافت شد`;
            detail = `این پاراگراف‌ها قابل قبول هستند اما کوچک‌تر کردن آنها خوانایی را بهبود می‌بخشد.`;
        }
        
        const longestParagraph = [...veryLongParagraphs, ...longParagraphs]
            .sort((a, b) => b.wordCount - a.wordCount)[0];
        
        const longestInfo = longestParagraph 
            ? `\n\n🔴 طولانی‌ترین پاراگراف: ${longestParagraph.wordCount} کلمه`
            : '';
        
        const stats = `\n\n📊 آمار پاراگراف‌ها:\n` +
            `🟢 کوتاه (تا 50 کلمه): ${shortParagraphs.length} پاراگراف (${((shortParagraphs.length / totalParagraphs) * 100).toFixed(0)}%)\n` +
            `🟡 متوسط (51-100 کلمه): ${mediumParagraphs.length} پاراگراف (${((mediumParagraphs.length / totalParagraphs) * 100).toFixed(0)}%)\n` +
            `🟠 بلند (101-150 کلمه): ${longParagraphs.length} پاراگراف (${((longParagraphs.length / totalParagraphs) * 100).toFixed(0)}%)\n` +
            `🔴 خیلی بلند (+150 کلمه): ${veryLongParagraphs.length} پاراگراف (${veryLongPercentage.toFixed(0)}%)` +
            longestInfo +
            `\n\n💡 توصیه سئو: حداقل 70% پاراگراف‌ها باید کوتاه یا متوسط باشند.`;
        
        return {
            status,
            title: 'طول پاراگراف‌ها (بهینه‌سازی فارسی)',
            tooltip: `در متن فارسی، پاراگراف‌های کوتاه (تا 50 کلمه) و متوسط (51-100 کلمه) خوانایی بهتری دارند. پاراگراف‌های بلندتر از 120 کلمه خواننده را خسته می‌کنند. معیار یانک: حداقل 70% پاراگراف‌ها باید کمتر از 100 کلمه باشند.`,
            desc,
            detail: detail + stats,
            longParagraphs: [...longParagraphs, ...veryLongParagraphs]
        };
    },

    /**
     * تشخیص کلمه کلیدی اصلی
     */
    detectMainKeyword(plainText) {
        const suggestions = Utils.detectMainKeyword(plainText, 3);
        
        if (suggestions.length === 0) {
            return {
                status: CONFIG.CHECK_STATUS.WARNING,
                title: 'تشخیص کلمه کلیدی اصلی',
                tooltip: 'کلمه کلیدی اصلی مهم‌ترین عبارت در محتوا است که باید در عنوان، پاراگراف اول و چندین بار در متن تکرار شود.',
                desc: 'هیچ کلمه کلیدی اصلی مناسب یافت نشد',
                detail: 'محتوا باید حداقل 200 کلمه داشته باشد و شامل عبارات معنادار باشد',
                suggestions: []
            };
        }

        const suggestionText = suggestions
            .map(s => `${s.keyword} (کیفیت: ${s.quality}, ارتباط: ${s.relevance})`)
            .join('، ');

        return {
            status: CONFIG.CHECK_STATUS.SUCCESS,
            title: 'تشخیص کلمه کلیدی اصلی',
            tooltip: 'کلمه کلیدی اصلی مهم‌ترین عبارت در محتوا است که باید در عنوان، پاراگراف اول و چندین بار در متن تکرار شود.',
            desc: `پیشنهادات کلمه کلیدی اصلی: ${suggestionText}`,
            detail: suggestions.map(s => 
                `${s.keyword}: ${s.frequency} بار (کیفیت: ${s.quality}, ارتباط: ${s.relevance})`
            ).join('\n'),
            suggestions: suggestions
        };
    },

    /**
     * تشخیص کلمات کلیدی فرعی
     */
    detectSecondaryKeywords(plainText) {
        const suggestions = Utils.detectSecondaryKeywords(plainText, 5);
        
        if (suggestions.length === 0) {
            return {
                status: CONFIG.CHECK_STATUS.WARNING,
                title: 'تشخیص کلمات کلیدی فرعی',
                tooltip: 'کلمات کلیدی فرعی عبارات مرتبط با موضوع اصلی هستند که به بهبود سئو و جذب ترافیک بیشتر کمک می‌کنند.',
                desc: 'هیچ کلمه کلیدی فرعی مناسب یافت نشد',
                detail: 'محتوا باید شامل عبارات متنوع و مرتبط با موضوع باشد',
                suggestions: []
            };
        }

        const suggestionText = suggestions
            .map(s => `${s.keyword} (کیفیت: ${s.quality})`)
            .join('، ');

        return {
            status: CONFIG.CHECK_STATUS.SUCCESS,
            title: 'تشخیص کلمات کلیدی فرعی',
            tooltip: 'کلمات کلیدی فرعی عبارات مرتبط با موضوع اصلی هستند که به بهبود سئو و جذب ترافیک بیشتر کمک می‌کنند.',
            desc: `پیشنهادات کلمات کلیدی فرعی: ${suggestionText}`,
            detail: suggestions.map(s => 
                `${s.keyword}: ${s.frequency} بار (کیفیت: ${s.quality}, ارتباط: ${s.relevance})`
            ).join('\n'),
            suggestions: suggestions
        };
    },

    /**
     * محاسبه امتیاز کلی SEO
     */
    calculateScore(checks) {
        // فیلتر کردن چک‌هایی که در محاسبه امتیاز تأثیر ندارند
        const scoreAffectingChecks = checks.filter(c => 
            c.title !== 'لینک‌دهی با کلمات کلیدی' && 
            c.title !== 'تشخیص کلمه کلیدی اصلی' &&
            c.title !== 'تشخیص کلمات کلیدی فرعی'
        );
        
        const successCount = scoreAffectingChecks.filter(c => 
            c.status === CONFIG.CHECK_STATUS.SUCCESS
        ).length;
        
        return Math.round((successCount / scoreAffectingChecks.length) * 100);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SEOAnalyzer;
}
