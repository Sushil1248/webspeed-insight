import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { AssessmentOutlined } from '@mui/icons-material';
import io from 'socket.io-client';
import PageSpeedReport from './PageSpeedReport';
import ScoreTable from './ScoreTable';

const SitemapList = ({ sitemaps }) => {
  const [pageSpeedData, setPageSpeedData] = useState({});
  const [open, setOpen] = useState(false);
  const [selectedUrlData, setSelectedUrlData] = useState(null);
  const [viewType, setViewType] = useState('grid'); // New state for view type
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = io('http://localhost:5000'); 
    setSocket(socketInstance);

    socketInstance.on('pagespeed_report', (data) => {
      const { score, metrics } = data.pageSpeedData;
      setPageSpeedData((prevState) => ({
        ...prevState,
        [data.url]: { score, metrics, data },
      }));
    });

    const handleBeforeUnload = () => {
      socketInstance.emit('user_disconnected');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      socketInstance.disconnect();
    };
  }, []);

  const handleClickOpen = (url) => {
    setSelectedUrlData(pageSpeedData[url]);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUrlData(null);
  };

  const handleViewTypeChange = (event, newViewType) => {
    if (newViewType) {
      setViewType(newViewType);
    }
  };

  const renderGridItems = (items, startIndex) => {
    return items.map((item, index) => (
      <ListItem
        key={index}
        component="a"
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ backgroundColor: '#f2f0ef', height: '100%' }}
      >
        <ListItemText
          primary={
            <>
              <strong>{`${startIndex + index + 1}. ${item.title}`}</strong>
              <br />
              <span style={{ color: '#888' }}>{item.url}</span>
            </>
          }
          secondary={`Last Modified: ${new Date(item.lastModified).toLocaleDateString()}`}
        />
        <ListItemSecondaryAction sx={{ top: 25, right: 0 }}>
          <IconButton
            color={pageSpeedData[item.url] ? 'success' : 'primary'}
            onClick={() => handleClickOpen(item.url)}
            disabled={!pageSpeedData[item.url]}
            title="View PageSpeed Insight Report"
            rel="noopener noreferrer"
          >
            <AssessmentOutlined />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    ));
  };

  const renderTableItems = (items) => {
    return (
      <ScoreTable reportData={items} /> // Use your ScoreTable component here
    );
  };

  return (
    <Grid sx={{ textAlign: 'left', margin: '2' }}>
      <Typography variant="h5" fontWeight={600} marginBottom={2}>
        SITEMAP
      </Typography>
      <ToggleButtonGroup
        value={viewType}
        exclusive
        onChange={handleViewTypeChange}
        sx={{ marginBottom: 2 }}
      >
        <ToggleButton value="grid">Grid View</ToggleButton>
        <ToggleButton value="table">Table View</ToggleButton>
      </ToggleButtonGroup>

      <Card variant="outlined">
        <CardContent>
          {viewType === 'grid' ? (
            <Grid container spacing={2}>
              {Object.keys(sitemaps).map((key) => (
                <Grid item xs={12} key={key}>
                  <div style={{ marginTop: '16px' }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ borderBottom: '1px solid black', fontWeight: '600' }}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Typography>
                    <List>
                      <Grid container spacing={2}>
                        {sitemaps[key].map((item, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index} sx={{ display: 'flex' }}>
                            <div style={{ flex: 1 }}>
                              {renderGridItems([item], index)}
                            </div>
                          </Grid>
                        ))}
                      </Grid>
                    </List>
                  </div>
                </Grid>
              ))}
            </Grid>
          ) : (
            // If table view is selected, render table
            renderTableItems(Object.values(sitemaps).flat())
          )}
        </CardContent>
      </Card>

      {/* Modal to display PageSpeed data */}
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>PageSpeed Insights Data</DialogTitle>
        <DialogContent>
          {selectedUrlData ? (
            <PageSpeedReport reportData={selectedUrlData} />
          ) : (
            <DialogContentText>No data available for this URL.</DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default SitemapList;