import React from 'react';
import { Typography, Grid, Box } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

// Function to dynamically set the color based on the score
const getColor = (score) => {
    if (score >= 0.85) return '#4caf50'; // Green
    if (score >= 0.65) return '#ffeb3b'; // Yellow
    return '#f44336'; // Red
};

const PageSpeedReport = ({ reportData }) => {
    console.log(reportData?.data?.pageSpeedData, "TEST")
    if (!reportData) {
        return <Typography variant="h6">No PageSpeed report data available.</Typography>;
    }
    
    const curentPageSpeedData = reportData?.data?.pageSpeedData;
    console.log(curentPageSpeedData, "CYs")
    const url = curentPageSpeedData?.site_url;
    const analysisUrl = curentPageSpeedData?.analysisUrl;
    const desktopData = curentPageSpeedData?.desktop;
    const mobileData = curentPageSpeedData?.mobile;

    const renderSinglePieChart = (data, title, description) => {
        const value = data[0]?.value || 0;
        const emptyValue = 100 - value;

        return (
            <Grid item xs={12} md={3}>
                <Box mb={1} sx={{ position: 'relative', border: '1px solid #e0e0e0', borderRadius: '8px', padding: 1 }}> {/* Reduced padding */}
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{title} {`${value}%`}</Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>{description}</Typography>

                    {/* Pie Chart */}
                    <PieChart width={150} height={150}> {/* Reduced size */}
                        <Pie
                            data={[
                                { name: 'Filled', value: value },
                                { name: 'Empty', value: emptyValue }
                            ]}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            outerRadius={50} // Reduced outer radius for a smaller pie
                            innerRadius={40}  // Reduced inner radius for a smaller pie
                            startAngle={90}
                            endAngle={-270}
                            labelLine={false}
                        >
                            <Cell key="filled" fill={getColor(value / 100)} />
                            <Cell key="empty" fill="#e0e0e0" />
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </Box>
            </Grid>
        );
    };

    return (
        <Grid elevation={3} sx={{ padding: 2, maxWidth: '95%', margin: '0 auto' }}> {/* Reduced overall padding */}
            <Typography variant="p" gutterBottom sx={{ textAlign: 'center' }}>Page Url: {url}</Typography>
            <Box mb={2}><a href={analysisUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#1976d2' }}>
                See Full Page Analysis Here
            </a>
            </Box>

            {/* Individual Desktop Charts */}
            <Typography variant='h5' mb={1} sx={{ borderBottom: '2px solid', fontWeight: 600 }}>Desktop Metrics</Typography>
            <Grid container spacing={1}> {/* Reduced spacing */}
                {renderSinglePieChart([{ name: 'Performance', value: desktopData?.performance * 100 }], 'Performance', 'Measures the loading speed of the page.')}
                {renderSinglePieChart([{ name: 'Accessibility', value: desktopData?.accessibility * 100 }], 'Accessibility', 'How easily users with disabilities can use the page.')}
                {renderSinglePieChart([{ name: 'Best Practices', value: desktopData?.best_practices * 100 }], 'Best Practices', 'Compliance with modern web standards.')}
                {renderSinglePieChart([{ name: 'SEO', value: desktopData?.seo * 100 }], 'SEO', 'Search engine optimization score of the page.')}
            </Grid>

            {/* Individual Mobile Charts */}
            <Typography variant='h5' mb={1} sx={{ borderBottom: '2px solid', fontWeight: 600 }}>Mobile Metrics</Typography>
            <Grid container spacing={1}> {/* Reduced spacing */}
                {renderSinglePieChart([{ name: 'Performance', value: mobileData?.performance * 100 }], 'Performance', 'Measures the loading speed of the mobile page.')}
                {renderSinglePieChart([{ name: 'Accessibility', value: mobileData?.accessibility * 100 }], 'Accessibility', 'Mobile accessibility for users with disabilities.')}
                {renderSinglePieChart([{ name: 'Best Practices', value: mobileData?.best_practices * 100 }], 'Best Practices', 'Best practices for mobile web development.')}
                {renderSinglePieChart([{ name: 'SEO', value: mobileData?.seo * 100 }], 'SEO', 'Search engine optimization score of the page on mobile.')}
            </Grid>
        </Grid>
    );
};

export default PageSpeedReport;