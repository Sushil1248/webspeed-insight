import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import SitemapList from './SitemapList';

const fetchSitemaps = async (url) => {
    const response = await axios.post('http://localhost:5000/api/sitemap/fetch', { url });
    if (response.data.status !== 200) {
        throw new Error(response.data.message); // Handle errors appropriately
    }
    return response.data.data.sitemaps; // Return the fetched sitemaps
};

const UrlInput = () => {
    const [url, setUrl] = useState('https://rooftek.com');
    const [error, setError] = useState(null);

    const { mutate: fetchSitemapsMutation, data: sitemaps, isPending: isLoading } = useMutation({
        mutationFn: fetchSitemaps,
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
        <Box
            className="w-full flex justify-center items-center py-8 rounded-lg relative top-[-130px]"
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                margin: '0 auto',
                padding: '32px',
                borderRadius: '16px',
                animation: 'fadeIn 0.8s ease-in-out',
                gap: 3,
            }}
        >
            <h2 className="text-3xl font-semibold text-white ">Enter a URL to Search</h2>
            <TextField
                className="w-full text-white"
                label="Your Website Url"
                variant="outlined"
                value={url}
                onChange={handleInputChange}
                size="medium"
                InputLabelProps={{
                    style: {
                        color: 'black',
                        position: 'absolute',
                        right:0,
                        fontWeight: 600
                    },
                }}
                InputProps={{
                    style: {
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                    },
                }}
                sx={{
                    width: '100%',
                    maxWidth: '500px',
                }}
            />
            <Button
                className="w-full mt-4 font-semibold transition-transform duration-200 ease-out hover:scale-105"
                variant="contained"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                disabled={isLoading} // Disable button when loading
                sx={{
                    backgroundColor: '#226a31',
                    padding: '12px 24px',
                    fontSize: '16px',
                    textTransform: 'none',
                    borderRadius: '8px',
                    '&:hover': {
                        backgroundColor: '#109181',
                    },
                    width: '100%',
                    maxWidth: '500px',
                }}
            >
                {isLoading ? 'Loading...' : 'Search'}
            </Button>

            {error && <p className="text-red-500">{error}</p>}

            {sitemaps && (
                <SitemapList sitemaps={sitemaps} />
            )}
        </Box>
    );
};

export default UrlInput;