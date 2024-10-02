const { parentPort } = require('worker_threads');
const axios = require('axios');

// Function to make the request with retry logic
async function fetchWithRetry(apiUrl, retries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(apiUrl);
            return response.data; // If successful, return the response data
        } catch (error) {
            console.error(`Attempt ${attempt} failed: ${error.message}`);
            if (attempt === retries) {
                throw error; // If all retries failed, throw the error
            }
            await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
        }
    }
}

// Listen for messages from the main thread
parentPort.on('message', async (data) => {
    const { url, apiKey } = data;

    try {
        // Add fields parameter to limit the data requested to scores only
        const apiUrlDesktop = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${apiKey}&category=performance&category=accessibility&category=seo&category=best-practices&category=pwa&strategy=desktop`;
        const apiUrlMobile = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${apiKey}&category=performance&category=accessibility&category=seo&category=best-practices&category=pwa&strategy=mobile`;

        // Fetch desktop and mobile scores with retry logic
        const [desktopScore, mobileScore] = await Promise.all([
            fetchWithRetry(apiUrlDesktop, 3, 2000), // Retry 3 times with a 2-second delay
            fetchWithRetry(apiUrlMobile, 3, 2000),
        ]);

        // Performance objects for desktop and mobile
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

        // Send results back to the main thread
        parentPort.postMessage({
            site_url: url,
            desktop: performanceObjectDesktop,
            mobile: performanceObjectMobile,
        });
    } catch (error) {
        console.error('Error fetching PageSpeed Insights:', error.response?.data?.error?.message || error.message);
        parentPort.postMessage({ error: error.response?.data?.error?.message || error.message });
    }
});