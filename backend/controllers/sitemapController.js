const axios = require('axios');
const cheerio = require('cheerio');
const { Response } = require('../models/response');

// Function to fetch sitemap URLs from multiple sources
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
                const groupedSitemaps = await parseSitemaps(sitemapUrls, url);
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
            sitemapUrls.push({ url: defaultSitemapUrl, lastModified: null }); // No last modified date for this check
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
                    sitemapUrls.push({ url: sitemapUrl, lastModified: null }); // No last modified date for this check
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

                // Include found URLs from scraping in the final response
                foundUrls.forEach((foundUrl) => {
                    sitemapUrls.push({ url: foundUrl, lastModified: null }); // No last modified date for scraped URLs
                });
            } catch (error) {
                console.warn('Error scraping the main page:', error.message);
            }
        }

        // Parse additional URLs from the gathered sitemaps
        const groupedSitemaps = await parseSitemaps(sitemapUrls, url);

        if (Object.keys(groupedSitemaps).length === 0) {
            return next(new Response(404, 'No sitemap URLs found'));
        }

        // Final response with all gathered sitemap URLs
        startPageSpeedJob(groupedSitemaps, io);
        res.status(200).json(new Response(200, 'Sitemap URLs fetched successfully', { sitemaps: groupedSitemaps }));

    } catch (error) {
        next(new Response(500, 'Error fetching sitemap', error.message));
    }
};

// Function to parse sitemaps and extract URLs along with their titles
// Function to parse sitemaps and extract URLs along with their titles
const parseSitemaps = async (sitemapUrls, baseUrl) => {
    const groupedUrls = {}; // This will be filled dynamically
    const titleFetchQueue = []; // Queue to manage concurrent title fetches
    const maxConcurrentFetches = 5; // Limit concurrent title fetches

    for (const sitemap of sitemapUrls) {
        try {
            const response = await axios.get(sitemap.url);
            const $ = cheerio.load(response.data, { xmlMode: true });

            // Extract URLs from the sitemap
            $('url loc').each((i, el) => {
                const url = $(el).text();
                const lastModified = $(el).next('url lastmod').text();

                // Create a promise for fetching title and add to the queue
                const titleFetchPromise = fetchTitle(url).then((title) => {
                    // Determine the category based on the URL path
                    const category = getCategory(url, baseUrl);

                    // Initialize the category array if it doesn't exist
                    if (!groupedUrls[category]) {
                        groupedUrls[category] = [];
                    }

                    groupedUrls[category].push({ url, title, lastModified });
                });

                titleFetchQueue.push(titleFetchPromise);

                // If the queue reaches the max limit, wait for the current batch to finish
                if (titleFetchQueue.length >= maxConcurrentFetches) {
                    return Promise.all(titleFetchQueue).then(() => {
                        titleFetchQueue.length = 0; // Clear the queue
                    });
                }
            });

            // For sitemap indexes, extract nested sitemaps
            $('sitemap loc').each((i, el) => {
                const nestedSitemapUrl = $(el).text();
                groupedUrls.others = groupedUrls.others || []; // Initialize if it doesn't exist
                groupedUrls.others.push({ url: nestedSitemapUrl, title: null, lastModified: null }); // No title for nested sitemaps
            });
        } catch (error) {
            console.warn(`Error fetching or parsing sitemap at ${sitemap.url}:`, error.message);
        }
    }

    // Wait for any remaining title fetch promises to resolve
    await Promise.all(titleFetchQueue);
    return groupedUrls;
};

// Function to get the category of a URL based on its path
const getCategory = (url, baseUrl) => {
    const relativeUrl = url.replace(baseUrl, ''); // Get the path relative to the base URL

    if (relativeUrl.includes('/event/')) {
        return 'events';
    } else if (relativeUrl.includes('/case-studies/')) {
        return 'caseStudies';
    } else if (relativeUrl.includes('/resource/')) {
        return 'resources';
    } else if (relativeUrl.includes('/partner/')) {
        return 'partners';
    } else if (/\d{4}\/\d{2}\/\d{2}/.test(relativeUrl)) {
        return 'posts';
    } else {
        return 'others';
    }
};

// Function to fetch the title of a given URL
// Function to fetch the title of a given URL with retry logic
const fetchTitle = async (url, retries = 3) => {
    return "TITLe";
};


const startPageSpeedJob = (groupedSitemaps, io) => {
    const allUrls = Object.values(groupedSitemaps).flat(); // Flatten the grouped URLs

    allUrls.forEach(async (urlObj) => {
        const pageSpeedData = await fetchPageSpeedInsights(urlObj.url, ['performance', 'seo', 'accessibility'], 'mobile');
        // Emit real-time updates to the frontend via socket.io
        io.emit('pagespeed_report', {
            url: urlObj.url,
            pageSpeedData,
        });
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

    // Create performance objects for desktop and mobile
    const performanceObjectDesktop = {
        performance: desktopScore?.lighthouseResult?.categories?.performance?.score,
        accessibility: desktopScore?.lighthouseResult?.categories?.accessibility?.score,
        best_practices: desktopScore?.lighthouseResult?.categories?.['best-practices']?.score,
        seo: desktopScore?.lighthouseResult?.categories?.seo?.score,
    }


    const performanceObjectMobile = {
        performance: mobileScore?.lighthouseResult?.categories?.performance?.score,
        accessibility: mobileScore?.lighthouseResult?.categories?.accessibility?.score,
        best_practices: mobileScore?.lighthouseResult?.categories?.['best-practices']?.score,
        seo: mobileScore?.lighthouseResult?.categories?.seo?.score,
    }

    // Dynamic analysis URL for the PageSpeed report
    const pagespeedAnalysisUrl = `https://developers.google.com/speed/pagespeed/insights/?url=${encodeURIComponent(url)}`;

    console.log(performanceObjectDesktop, performanceObjectMobile)
    return {
        desktop: performanceObjectDesktop,
        mobile: performanceObjectMobile,
        analysisUrl: pagespeedAnalysisUrl,
    };
};


module.exports = { fetchSitemap };