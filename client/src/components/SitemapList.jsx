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
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import { AssessmentOutlined } from '@mui/icons-material';
import io from 'socket.io-client';
import PageSpeedReport from './PageSpeedReport';

const SitemapList = ({ sitemaps }) => {
  const [pageSpeedData, setPageSpeedData] = useState({});
  const [open, setOpen] = useState(false);
  const [selectedUrlData, setSelectedUrlData] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:5000'); // Replace with your backend server URL

    // Listen for PageSpeed data
    socket.on('pagespeed_report', (data) => {
      const { score, metrics } = data.pageSpeedData; // Destructure the additional metrics
      setPageSpeedData((prevState) => ({
        ...prevState,
        [data.url]: { score, metrics, data }, // Store both the score and metrics
      }));
    });

    return () => {
      socket.disconnect(); // Cleanup when the component unmounts
    };
  }, []);

  const handleClickOpen = (url) => {
    console.log(pageSpeedData[url], pageSpeedData)
    setSelectedUrlData(pageSpeedData[url]); // Set the selected URL's data
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUrlData(null);
  };

  const renderItems = (items, startIndex) => {
    return items.map((item, index) => (
      <ListItem
        key={index}
        component="a"
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          backgroundColor: '#f2f0ef',
          height: '100%',
        }}
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
            onClick={() => handleClickOpen(item.url)} // Open modal with PageSpeed data
            disabled={!pageSpeedData[item.url]} // Disable until PageSpeed data is received
            title="View PageSpeed Insight Report"
            rel="noopener noreferrer"
          >
            <AssessmentOutlined />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    ));
  };

  return (
    <Grid sx={{ textAlign: 'left', margin: '2' }}>
      <Typography variant="h5" fontWeight={600} marginBottom={2}>
        SITEMAP
      </Typography>
      <Card variant="outlined">
        <CardContent>
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
                            {renderItems([item], index)}
                          </div>
                        </Grid>
                      ))}
                    </Grid>
                  </List>
                </div>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Modal to display PageSpeed data */}
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth >
        <DialogTitle>PageSpeed Insights Data</DialogTitle>
        <DialogContent>
          {selectedUrlData ? (
            <>
              <PageSpeedReport reportData={selectedUrlData} />
            </>
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
    </Grid >
  );
};

export default SitemapList;