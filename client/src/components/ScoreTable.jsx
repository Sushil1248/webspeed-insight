import React, { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Button,
  Paper,
  Skeleton,
  Toolbar,
  Typography,
  Box,
} from '@mui/material';
import * as XLSX from 'xlsx';

const ScoreTable = React.memo(({ data }) => {
  const [searchInput, setSearchInput] = useState('');

  // Columns for the table
  const columns = useMemo(
    () => [
      { Header: 'Page URL', accessor: 'url' },
      { Header: 'Title', accessor: 'title' },
      { Header: 'Desktop SEO', accessor: 'desktopSEO' },
      { Header: 'Desktop Performance', accessor: 'desktopPerformance' },
      { Header: 'Desktop Accessibility', accessor: 'desktopAccessibility' },
      { Header: 'Desktop Best Practices', accessor: 'desktopBestPractices' },
      { Header: 'Mobile SEO', accessor: 'mobileSEO' },
      { Header: 'Mobile Performance', accessor: 'mobilePerformance' },
      { Header: 'Mobile Accessibility', accessor: 'mobileAccessibility' },
      { Header: 'Mobile Best Practices', accessor: 'mobileBestPractices' },
    ],
    []
  );

  // Filter the data based on search input
  const filteredData = useMemo(() => {
    if (!searchInput) return data;
    return data.filter(row =>
      row.url.toLowerCase().includes(searchInput.toLowerCase()) ||
      row.title.toLowerCase().includes(searchInput.toLowerCase())
    );
  }, [data, searchInput]);

  // Handle export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, 'Rooftek_Pages.xlsx');
  };

  // Function to render scores or a Skeleton view when scores are loading
  const renderScore = (score) => {
    if (score === null || score === undefined) {
      return <Skeleton variant="text" width={60} />;
    }
    return score.toFixed(2); // Format score to 2 decimal places
  };

  // Render the table
  return (
    <Paper className='relative overflow-x-auto '>
      <Toolbar className='flex justify-between' style={{ padding: '8px 16px' }}>
        <Typography variant="p" component="div" className='font-semibold ' style={{ fontSize: '1rem' }}>
          Score Table
        </Typography>
        <Box className="flex align-middle items-center">
          <TextField
            label="Search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            variant="outlined"
            size="small"
            style={{ marginRight: '10px', width: '400px' }}
          />
          <Button onClick={exportToExcel} variant="text" size="small" style={{ padding: '6px 12px' }}>
            <img src="/xls.svg" alt="" style={{ height: '20px', marginRight: '4px' }} />Export Excel
          </Button>
        </Box>
      </Toolbar>
      <TableContainer>
        <Table size="small" className='w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400'>
          <TableHead className='text-xs text-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-gray-400'>
            <TableRow>
              <TableCell rowSpan={2} style={{ padding: '4px 8px' }}>Page URL</TableCell>
              <TableCell rowSpan={2} style={{ padding: '4px 8px' }}>Title</TableCell>
              <TableCell colSpan={4} align="center" style={{ padding: '4px 8px' }}>Desktop</TableCell>
              <TableCell colSpan={4} align="center" style={{ padding: '4px 8px' }}>Mobile</TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={{ padding: '4px 8px' }}>
                <TableSortLabel>SEO</TableSortLabel>
              </TableCell>
              <TableCell style={{ padding: '4px 8px' }}>
                <TableSortLabel>Performance</TableSortLabel>
              </TableCell>
              <TableCell style={{ padding: '4px 8px' }}>
                <TableSortLabel>Accessibility</TableSortLabel>
              </TableCell>
              <TableCell style={{ padding: '4px 8px' }}>
                <TableSortLabel>Practices</TableSortLabel>
              </TableCell>
              <TableCell style={{ padding: '4px 8px' }}>
                <TableSortLabel>SEO</TableSortLabel>
              </TableCell>
              <TableCell style={{ padding: '4px 8px' }}>
                <TableSortLabel>Performance</TableSortLabel>
              </TableCell>
              <TableCell style={{ padding: '4px 8px' }}>
                <TableSortLabel>Accessibility</TableSortLabel>
              </TableCell>
              <TableCell style={{ padding: '4px 8px' }}>
                <TableSortLabel>Practices</TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <TableRow key={index} style={{ height: '32px' }} className='odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700'> {/* Reduce row height */}
                  <TableCell style={{ padding: '4px 8px' }}>{row.url}</TableCell>
                  <TableCell style={{ padding: '4px 8px' }}>{row.title}</TableCell>
                  <TableCell style={{ padding: '4px 8px' }}>{renderScore((row.desktopSEO ?? 0) * 100)}</TableCell>
                  <TableCell style={{ padding: '4px 8px' }}>{renderScore((row.desktopPerformance ?? 0) * 100)}</TableCell>
                  <TableCell style={{ padding: '4px 8px' }}>{renderScore((row.desktopAccessibility ?? 0) * 100)}</TableCell>
                  <TableCell style={{ padding: '4px 8px' }}>{renderScore((row.desktopBestPractices ?? 0) * 100)}</TableCell>
                  <TableCell style={{ padding: '4px 8px' }}>{renderScore((row.mobileSEO ?? 0) * 100)}</TableCell>
                  <TableCell style={{ padding: '4px 8px' }}>{renderScore((row.mobilePerformance ?? 0) * 100)}</TableCell>
                  <TableCell style={{ padding: '4px 8px' }}>{renderScore((row.mobileAccessibility ?? 0) * 100)}</TableCell>
                  <TableCell style={{ padding: '4px 8px' }}>{renderScore((row.mobileBestPractices ?? 0) * 100)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography variant="body2">No matching records found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
});

export default ScoreTable;