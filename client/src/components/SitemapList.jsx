import React, { useEffect, useState } from "react";
import {
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
  Typography,
  Tooltip,
} from "@mui/material";
import { AssessmentOutlined } from "@mui/icons-material";
import io from "socket.io-client";
import PageSpeedReport from "./PageSpeedReport";
import ScoreTable from "./ScoreTable";

const SitemapList = ({ sitemaps }) => {
  const [currentSitemaps, setCurrentSitemaps] = useState(sitemaps);
  const [pageSpeedData, setPageSpeedData] = useState({});
  const [open, setOpen] = useState(false);
  const [selectedUrlData, setSelectedUrlData] = useState(null);
  const [viewType, setViewType] = useState("grid");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = io("http://localhost:5000");
    setSocket(socketInstance);

    socketInstance.on("pagespeed_report", (data) => {
      const { score, metrics } = data.pageSpeedData;
      
      setPageSpeedData((prevState) => ({
        ...prevState,
        [data.url]: { score, metrics, data },
      }));

      setCurrentSitemaps((prevSitemaps) => {
        const updatedSitemaps = { ...prevSitemaps };

        Object.keys(updatedSitemaps).forEach((key) => {
          updatedSitemaps[key] = updatedSitemaps[key].map((item) => {
            if (item.url === data.url) {
              let desktopScoreData = data.pageSpeedData.desktop;
              let mobileScoreData = data.pageSpeedData.mobile;
              return {
                ...item,
                desktopSEO: desktopScoreData?.seo || "N/A",
                desktopPerformance: desktopScoreData?.performance || "N/A",
                desktopAccessibility: desktopScoreData?.accessibility || "N/A",
                desktopBestPractices: desktopScoreData?.best_practices || "N/A",
                mobileSEO: mobileScoreData?.seo || "N/A",
                mobilePerformance: mobileScoreData?.performance || "N/A",
                mobileAccessibility: mobileScoreData?.accessibility || "N/A",
                mobileBestPractices: mobileScoreData?.best_practices || "N/A",
              };
            }
            return item;
          });
        });

        return updatedSitemaps;
      });
    });

    const handleBeforeUnload = () => {
      socketInstance.emit("user_disconnected");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
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
        className="bg-gray-100 rounded-lg shadow-lg mb-4 p-2 hover:bg-gray-200 transition duration-300 ease-in-out h-32 px-6"
      >
        <ListItemText
          primary={
            <>
              <strong className="text-md text-left">{`${startIndex + index + 1}. ${item.title}`}</strong>
              <br />
              <Tooltip title={item.url} arrow>
                <span className="text-gray-500 truncate" style={{ display: 'block', maxWidth: '100%' }}>
                  {item.url}
                </span>
              </Tooltip>
            </>
          }
          secondary={`Last Modified: ${new Date(item.lastModified).toLocaleDateString()}`}
        />
        <ListItemSecondaryAction>
          <IconButton
            color={pageSpeedData[item.url] ? "success" : "primary"}
            onClick={() => handleClickOpen(item.url)}
            disabled={!pageSpeedData[item.url]}
            title="View PageSpeed Insight Report"
            className="transition-transform transform hover:scale-110"
          >
            <AssessmentOutlined />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    ));
  };
  return (
    <div className="p-6">
      <Typography variant="h4" className="text-2xl font-semibold text-gray-800 mb-4 text-center">
        Sitemap Overview
      </Typography>
      <ToggleButtonGroup
        value={viewType}
        exclusive
        onChange={handleViewTypeChange}
        className="mb-4"
      >
        <ToggleButton value="grid" className="px-4 py-2 transition text-indigo-600 hover:bg-indigo-200 rounded-l-full">
          Grid View
        </ToggleButton>
        <ToggleButton value="table" className="px-4 py-2 transition hover:bg-indigo-200 rounded-r-full">
          Table View
        </ToggleButton>
      </ToggleButtonGroup>

      <div className="bg-white shadow-md rounded-lg p-4">
        {viewType === "grid" ? (
          <Grid container spacing={3}>
            {Object.keys(currentSitemaps).map((key) => (
              <Grid item xs={12} key={key}>
                <Typography variant="subtitle1" className="font-bold text-xl border-b pb-2 mb-4 text-gray-700">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Typography>
                <List>
                  <Grid container spacing={2}>
                    {currentSitemaps[key].map((item, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        {renderGridItems([item], index)}
                      </Grid>
                    ))}
                  </Grid>
                </List>
              </Grid>
            ))}
          </Grid>
        ) : (
          <ScoreTable data={Object.values(currentSitemaps).flat()} />
        )}
      </div>

      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle className="text-lg font-semibold">PageSpeed Insights Data</DialogTitle>
        <DialogContent>
          {selectedUrlData ? (
            <PageSpeedReport reportData={selectedUrlData} />
          ) : (
            <DialogContentText>No data available for this URL.</DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} className="text-indigo-600">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SitemapList;
