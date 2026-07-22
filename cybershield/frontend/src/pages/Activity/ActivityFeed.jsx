import { useState, useEffect } from "react";
import { Box, Typography, CircularProgress, Card, CardContent, Button } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

import Timeline from "../../components/Activity/Timeline";
import automationApi from "../../api/automationApi";

export default function ActivityFeed() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await automationApi.getActivityFeed();
      setEvents(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight={800}>
          Security Activity
        </Typography>
        <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </Box>

      <Card variant="outlined">
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" mt={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Timeline events={events} />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
