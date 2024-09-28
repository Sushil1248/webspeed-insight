const express = require('express');
const { fetchSitemap } = require('../controllers/sitemapController');
const router = express.Router();

// POST request to fetch sitemap URL
router.post('/fetch', fetchSitemap);

module.exports = router;