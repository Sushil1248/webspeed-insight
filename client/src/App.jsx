import React, { useState } from 'react';
import UrlInput from './components/UrlInput ';
import UrlSitemap from './components/SitemapList';

const App = () => {
  const [sitemapData, setSitemapData] = useState([]);

  const handleSearch = async (url) => {
    // Example API call (replace with your actual API endpoint)
    const response = await fetch(`https://example.com/api/sitemap?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    // Assuming the API returns an array of URLs
    setSitemapData(data.sitemap);
  };

  return (
    <div className="min-h-screen ">
      <UrlInput onSearch={handleSearch} />
    </div>
  );
};

export default App;
