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
} from '@mui/material';
import { useTable, useSortBy } from 'react-table';
import * as XLSX from 'xlsx';

const ScoreTable = React.memo(({ data }) => {
  const [searchInput, setSearchInput] = useState('');

  const columns = useMemo(
    () => [
      { Header: 'Page URL', accessor: 'pageUrl' },
      { Header: 'Mobile SEO', accessor: 'mobileScore.seo' },
      { Header: 'Mobile Accessibility', accessor: 'mobileScore.accessibility' },
      { Header: 'Mobile Best Practice', accessor: 'mobileScore.bestPractice' },
      { Header: 'Mobile Performance', accessor: 'mobileScore.performance' },
      { Header: 'Desktop SEO', accessor: 'desktopScore.seo' },
      { Header: 'Desktop Accessibility', accessor: 'desktopScore.accessibility' },
      { Header: 'Desktop Best Practice', accessor: 'desktopScore.bestPractice' },
      { Header: 'Desktop Performance', accessor: 'desktopScore.performance' },
    ],
    []
  );

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      item.pageUrl.toLowerCase().includes(searchInput.toLowerCase())
    );
  }, [data, searchInput]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable(
    {
      columns,
      data: filteredData,
    },
    useSortBy
  );

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Scores');
    XLSX.writeFile(workbook, 'PageScores.xlsx');
  };

  return (
    <Paper elevation={2} style={{ padding: '16px', borderRadius: '8px' }}>
      <TextField
        label="Search by Page URL"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        size="small" // Smaller text field
      />
      <Button variant="contained" color="primary" onClick={handleExport} style={{ marginBottom: '16px' }}>
        Export to Excel
      </Button>
      <TableContainer>
        <Table {...getTableProps()} size="small"> {/* Use small size for the table */}
          <TableHead>
            {headerGroups.map((headerGroup) => (
              <TableRow {...headerGroup.getHeaderGroupProps()} style={{ backgroundColor: '#f0f0f0' }}>
                {headerGroup.headers.map((column) => (
                  <TableCell {...column.getHeaderProps(column.getSortByToggleProps())} style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                    <TableSortLabel
                      active={column.isSorted}
                      direction={column.isSortedDesc ? 'desc' : 'asc'}
                      style={{ fontSize: '0.875rem' }}
                    >
                      {column.render('Header')}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody {...getTableBodyProps()}>
            {rows.length > 0 ? (
              rows.map((row) => {
                prepareRow(row);
                return (
                  <TableRow {...row.getRowProps()} hover>
                    {row.cells.map((cell) => (
                      <TableCell {...cell.getCellProps()} style={{ fontSize: '0.875rem', padding: '8px' }}>
                        {cell.render('Cell')}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} style={{ textAlign: 'center', fontSize: '0.875rem' }}>
                  No data available
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