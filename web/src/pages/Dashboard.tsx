import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Title,
  Text,
  Tab,
  TabList,
  TabGroup,
  TabPanel,
  TabPanels,
  Grid,
} from '@tremor/react';
import { Users, MapPin, ChartBar, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data - replace with actual API calls
const fetchDashboardStats = async () => {
  return {
    totalWorkers: 150,
    activeWorkers: 120,
    inactiveWorkers: 30,
    locationsTracked: 45,
    recentUpdates: [
      { id: 1, message: 'New worker registered', timestamp: '2024-03-20 14:30' },
      { id: 2, message: 'Location update received', timestamp: '2024-03-20 14:25' },
      { id: 3, message: 'Worker status changed', timestamp: '2024-03-20 14:20' },
    ],
  };
};

export default function Dashboard() {
  const [selectedView, setSelectedView] = useState('overview');
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <Title>Dashboard</Title>
        <div className="flex gap-4">
          <Link to="/workers" className="flex items-center gap-2 text-blue-600">
            <Users size={20} />
            <span>Workers</span>
          </Link>
          <Link to="/location" className="flex items-center gap-2 text-blue-600">
            <MapPin size={20} />
            <span>Location</span>
          </Link>
          <Link to="/analytics" className="flex items-center gap-2 text-blue-600">
            <ChartBar size={20} />
            <span>Analytics</span>
          </Link>
          <Link to="/settings" className="flex items-center gap-2 text-blue-600">
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      <TabGroup>
        <TabList className="mb-8">
          <Tab>Overview</Tab>
          <Tab>Recent Updates</Tab>
          <Tab>Analytics</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6">
              <Card>
                <Title>Total Workers</Title>
                <Text className="mt-2">{stats.totalWorkers}</Text>
              </Card>
              <Card>
                <Title>Active Workers</Title>
                <Text className="mt-2">{stats.activeWorkers}</Text>
              </Card>
              <Card>
                <Title>Locations Tracked</Title>
                <Text className="mt-2">{stats.locationsTracked}</Text>
              </Card>
            </Grid>
          </TabPanel>
          <TabPanel>
            <Card>
              <Title>Recent Updates</Title>
              <div className="mt-4 space-y-4">
                {stats.recentUpdates.map((update) => (
                  <div key={update.id} className="border-b pb-2">
                    <Text>{update.message}</Text>
                    <Text className="text-sm text-gray-500">{update.timestamp}</Text>
                  </div>
                ))}
              </div>
            </Card>
          </TabPanel>
          <TabPanel>
            <Card>
              <Title>Analytics Overview</Title>
              <Text className="mt-2">Detailed analytics coming soon...</Text>
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
} 