const axios = require('axios');
const cheerio = require('cheerio');
const { Response } = require('../models/response');
const { Worker } = require('worker_threads');

// Function to fetch sitemap URLs from multiple sources with batching
// Function to fetch sitemap URLs from multiple sources with batching
const fetchSitemap = async (req, res, next) => {
    const { url } = req.body;
    const io = req.app.get('io'); // Access the io instance
    if (!url) {
        return next(new Response(400, 'URL is required'));
    }

    try {
        let sitemapUrls = [];

        // Step 1: Check for sitemap index at standard location
        const sitemapIndexUrl = `${url}/sitemap_index.xml`;
        try {
            const sitemapIndexResponse = await axios.get(sitemapIndexUrl);
            const $ = cheerio.load(sitemapIndexResponse.data, { xmlMode: true });

            // Extract individual sitemap URLs from the sitemap index
            $('sitemap loc').each((i, el) => {
                const sitemapUrl = $(el).text();
                const lastModified = $(el).next('sitemap lastmod').text();
                sitemapUrls.push({ url: sitemapUrl, lastModified });
            });

            if (sitemapUrls.length > 0) {
                // Send partial response to the frontend
                io.emit('sitemap_partial', { sitemaps: sitemapUrls });
                
                // Batch sitemap fetching and processing
                const groupedSitemaps = await parseSitemapsInBatches(sitemapUrls, url);
                startPageSpeedJob(groupedSitemaps, io);
                return res.status(200).json(new Response(200, 'Sitemap URLs fetched successfully', { sitemaps: groupedSitemaps }));
            }
        } catch (err) {
            console.warn('No sitemap index found, continuing to other checks...');
        }

        // Step 2: Check for default sitemap.xml
        const defaultSitemapUrl = `${url}/sitemap.xml`;
        try {
            const defaultSitemapResponse = await axios.get(defaultSitemapUrl);
            sitemapUrls.push({ url: defaultSitemapUrl, lastModified: null });
        } catch (err) {
            console.warn('Default sitemap.xml not found.');
        }

        // Step 3: Check robots.txt for additional sitemap URLs
        const robotsTxtUrl = `${url}/robots.txt`;
        try {
            const robotsResponse = await axios.get(robotsTxtUrl);
            const robotsData = robotsResponse.data;

            const sitemapMatches = robotsData.match(/Sitemap:\s*(.*)/gi);
            if (sitemapMatches) {
                sitemapMatches.forEach((match) => {
                    const sitemapUrl = match.split(':')[1].trim();
                    sitemapUrls.push({ url: sitemapUrl, lastModified: null });
                });
            }
        } catch (err) {
            console.warn('robots.txt not found.');
        }

        // Step 4: If still no sitemaps found, scrape the main page for links
        if (sitemapUrls.length === 0) {
            try {
                const html = await axios.get(url);
                const $ = cheerio.load(html.data);
                const foundUrls = [];

                $('a').each((i, el) => {
                    const href = $(el).attr('href');
                    if (href && href.includes('sitemap')) {
                        foundUrls.push(href);
                    }
                });

                if (foundUrls.length === 0) {
                    return next(new Response(404, 'No sitemap URLs found'));
                }

                foundUrls.forEach((foundUrl) => {
                    sitemapUrls.push({ url: foundUrl, lastModified: null });
                });
            } catch (error) {
                console.warn('Error scraping the main page:', error.message);
            }
        }

        // Batch sitemap fetching and processing
        const groupedSitemaps = await parseSitemapsInBatches(sitemapUrls, url);

        if (Object.keys(groupedSitemaps).length === 0) {
            return next(new Response(404, 'No sitemap URLs found'));
        }

        startPageSpeedJob(groupedSitemaps, io);
        res.status(200).json(new Response(200, 'Sitemap URLs fetched successfully', { sitemaps: groupedSitemaps }));

    } catch (error) {
        next(new Response(500, 'Error fetching sitemap', error.message));
    }
};

// Function to parse sitemaps and extract URLs along with their titles with batching
const parseSitemapsInBatches = async (sitemapUrls, baseUrl, batchSize = 5) => {
    const groupedUrls = {};
    const titleFetchQueue = [];

    // Helper to process sitemaps in batches
    const processBatch = async (batch) => {
        await Promise.all(batch.map(async (sitemap) => {
            try {
                const response = await axios.get(sitemap.url);
                const $ = cheerio.load(response.data, { xmlMode: true });

                const urls = $('url loc');
                for (let i = 0; i < urls.length; i++) {
                    const url = $(urls[i]).text();
                    const lastModified = $(urls[i]).next('url lastmod').text();

                    const titleFetchPromise = fetchTitle(url).then((title) => {
                        const category = getCategory(url, baseUrl);
                        if (!groupedUrls[category]) {
                            groupedUrls[category] = [];
                        }
                        groupedUrls[category].push({ url, title, lastModified });
                    });
                    titleFetchQueue.push(titleFetchPromise);
                }

                const nestedSitemaps = $('sitemap loc');
                for (let i = 0; i < nestedSitemaps.length; i++) {
                    const nestedSitemapUrl = $(nestedSitemaps[i]).text();
                    groupedUrls.others = groupedUrls.others || [];
                    groupedUrls.others.push({ url: nestedSitemapUrl, title: null, lastModified: null });
                }
            } catch (error) {
                console.warn(`Error fetching or parsing sitemap at ${sitemap.url}:`, error.message);
            }
        }));

        // Wait for title fetches in this batch
        await Promise.all(titleFetchQueue);
        titleFetchQueue.length = 0;
    };

    // Process sitemaps in batches
    for (let i = 0; i < sitemapUrls.length; i += batchSize) {
        const batch = sitemapUrls.slice(i, i + batchSize);
        await processBatch(batch); // Process each batch
    }

    return groupedUrls;
};

// Function to get the category of a URL based on its path
const getCategory = (url, baseUrl) => {
    const relativeUrl = url.replace(baseUrl, ''); // Get the path relative to the base URL
    const pathParts = relativeUrl.split('/').filter(Boolean); // Split path and filter out empty parts
    const category = pathParts[0] || 'others'; // Use the first segment after the base URL as the category
    return category;
};

// Function to fetch the title of a given URL
// Function to fetch title with retry logic and exponential backoff
const fetchTitle = async (url, retries = 3) => {
    const fetchWithRetry = async (attempt) => {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            return $('title').text();
        } catch (error) {
            if (error.response && error.response.status === 429 && attempt < retries) {
                const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
                console.warn(`Rate limited for ${url}. Retrying in ${waitTime / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return fetchWithRetry(attempt + 1); // Retry the request
            } else {
                console.warn(`Error fetching title for ${url}:`, error.message);
                return 'Untitled'; // Return default title if not recoverable
            }
        }
    };

    return fetchWithRetry(1);
};


const startPageSpeedJob = (groupedSitemaps, io) => {
    const allUrls = Object.values(groupedSitemaps).flat(); // Flatten the grouped URLs

    allUrls.forEach(async (urlObj) => {
        const maxRetries = 5;
        let pageSpeedData = null;

        // Retry logic with a max number of retries
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            pageSpeedData = await fetchPageSpeedInsightsWithWorker(urlObj.url);

            if (pageSpeedData && (pageSpeedData.desktop.performance || pageSpeedData.mobile.performance)) {
                // Emit the real-time update only if the performance data is available
                io.emit('pagespeed_report', {
                    url: urlObj.url,
                    pageSpeedData,
                });
                break; // Stop retrying once we have valid data
            } else {
                console.log(`Retrying PageSpeed Insights for ${urlObj.url} (attempt ${attempt})...`);
            }

            if (attempt === maxRetries) {
                console.warn(`Failed to retrieve PageSpeed data after ${maxRetries} attempts for ${urlObj.url}`);
            }
        }
    });
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchPageSpeedInsights = async (url, retries = 5) => {
    const apiKey = 'AIzaSyC49tW7GBu3LrBp3PcGYoPo9-ut9IjF5eo'; // Replace with your actual API key
    const apiUrlDesktop = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${apiKey}&category=performance&category=accessibility&category=seo&category=best-practices&category=pwa&strategy=desktop`;
    const apiUrlMobile = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${apiKey}&category=performance&category=accessibility&category=seo&category=best-practices&category=pwa&strategy=mobile`;

    const fetchWithRetry = async (apiUrl, attempt = 1) => {
        try {
            await sleep(2000); // Delay of 2 seconds between requests
            const response = await axios.get(apiUrl);
            const score = response.data; // Handle response data accordingly
            return score;
        } catch (error) {
            console.warn(`Error fetching PageSpeed Insights (attempt ${attempt}):`, error.message);
            if (error.response && (error.response.status === 429 || error.response.status === 500) && attempt < retries) {
                const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
                console.warn(`Retrying in ${waitTime / 1000} seconds...`);
                await sleep(waitTime);
                return fetchWithRetry(apiUrl, attempt + 1); // Retry the request
            }
            return null; // Return null if not recoverable
        }
    };

    // Fetch both desktop and mobile reports
    const desktopScore = await fetchWithRetry(apiUrlDesktop);
    const mobileScore = await fetchWithRetry(apiUrlMobile);

    // If both desktop and mobile scores are null, return null
    if (!desktopScore && !mobileScore) {
        return null;
    }

    // Create performance objects for desktop and mobile
    const performanceObjectDesktop = {
        performance: desktopScore?.lighthouseResult?.categories?.performance?.score,
        accessibility: desktopScore?.lighthouseResult?.categories?.accessibility?.score,
        best_practices: desktopScore?.lighthouseResult?.categories?.['best-practices']?.score,
        seo: desktopScore?.lighthouseResult?.categories?.seo?.score,
    };

    const performanceObjectMobile = {
        performance: mobileScore?.lighthouseResult?.categories?.performance?.score,
        accessibility: mobileScore?.lighthouseResult?.categories?.accessibility?.score,
        best_practices: mobileScore?.lighthouseResult?.categories?.['best-practices']?.score,
        seo: mobileScore?.lighthouseResult?.categories?.seo?.score,
    };

    // Dynamic analysis URL for the PageSpeed report
    const pagespeedAnalysisUrl = `https://developers.google.com/speed/pagespeed/insights/?url=${encodeURIComponent(url)}`;

    console.log(performanceObjectDesktop, performanceObjectMobile);

    return {
        site_url: url,
        desktop: performanceObjectDesktop,
        mobile: performanceObjectMobile,
        analysisUrl: pagespeedAnalysisUrl,
    };
};

const fetchPageSpeedInsightsWithWorker = (url) => {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./worker/pageSpeedWorker.js');
        const apiKey = 'AIzaSyCdc_n0FN2yInxObTb5GKat5lY4wBK7IpM'; // Replace with your actual API key

        worker.onmessage = (event) => {
            const { desktopScore, mobileScore } = event.data;
            resolve({ desktopScore, mobileScore });
            worker.terminate(); // Terminate worker once done
        };

        worker.onerror = (error) => {
            console.error('Worker error:', error);
            reject(error);
            worker.terminate(); // Terminate worker on error
        };

        worker.postMessage({ url, apiKey });
    });
};



module.exports = { fetchSitemap };