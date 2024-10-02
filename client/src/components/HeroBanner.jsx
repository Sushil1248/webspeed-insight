import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Box } from '@mui/material';
import SitemapList from './SitemapList';

const HeroBanner = () => {
  const [url, setUrl] = useState('https://rooftek.com');
  const [error, setError] = useState(null);
  const fetchSitemaps = async (url) => {
    const response = await axios.post('http://localhost:5000/api/sitemap/fetch', { url });
    if (response.data.status !== 200) {
      throw new Error(response.data.message); // Handle errors appropriately
    }
    return response.data.data.sitemaps; // Return the fetched sitemaps
  };
  const { mutate: fetchSitemapsMutation, data: sitemaps, isPending: isLoading } = useMutation({
    mutationFn: fetchSitemaps, // Replace fetchSitemaps with your actual API function
    onSuccess: () => {
      setError(null); // Clear any previous error
    },
    onError: (error) => {
      setError(error.message); // Set error message
    },
  });

  const handleInputChange = (event) => {
    setUrl(event.target.value);
  };

  const handleSearch = () => {
    if (url.trim()) {
      fetchSitemapsMutation(url); // Trigger the mutation with the URL
    }
  };

  return (
    <section className="relative py-14 pt-24 lg:pb-24 ">
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
        <div className="w-full max-w-6xl mx-auto sm:px-12 mb-10 lg:mb-20">
          <h1 className="font-manrope font-bold text-4xl leading-snug sm:text-5xl text-center mb-5 text-black ">
            Effortless Website Analysis and Optimization
          </h1>
          <p className="text-xl font-medium leading-8 text-gray-400 text-center mb-14 max-w-5xl mx-auto">
            Analyze any website with real-time insights on accessibility, performance, SEO, and best practices. Automatically generate sitemaps and categorized reports for mobile and desktop optimization
          </p>
          <div className="parent flex flex-col sm:flex-row items-center max-w-xl mx-auto justify-center gap-y-4 sm:justify-between pr-2 sm:pr-1  rounded-full mb-5 relative group transition-all duration-500 border border-transparent border-indigo-600 bg-gray-100 focus-within:border-indigo-600 shadow-md ">
            <input
              value={url}
              onChange={handleInputChange}
              type="url"
              className="block w-full px-6 py-3.5 text-base max-sm:text-center bg-indigo-600 font-normal  max-sm:bg-white text-gray-900 bg-transparent border-none rounded-full placeholder-gray-400 focus:outline-none leading-normal"
              placeholder="Enter the website URL"
              required
            />
            <button
              className={`py-3 px-6 max-sm:w-full rounded-full bg-indigo-600 text-white text-sm leading-4 font-medium whitespace-nowrap transition-all duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
                } sm:absolute top-1.5 right-3`}
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Get Started'}
            </button>
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <p className="text-sm font-normal text-gray-500 text-center">
            Enter a website URL to generate an instant analysis of its SEO, performance, and more.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center justify-center">
          <img
            src="/performance.svg"
            alt="Performance"
            className="object-cover"
          />
          <img
            src="/accessibility.svg"
            alt="Accessibility"
            className="mx-auto w-56 object-cover"
          />
          <img
            src="/seo.svg"
            alt="SEO"
            className="object-cover"
          />
          <img
            src="/best-practices.svg"
            alt="Best Practices"
            className="object-cover"
          />
        </div>

      </div>
      <Box className="px-8">
        {sitemaps && (
          <SitemapList sitemaps={sitemaps} />
        )}
      </Box>
    </section>
  );
};

export default HeroBanner;