
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import Location from './pages/Location';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { Toaster } from 'sonner';
import { Suspense, lazy } from 'react';
import { LoadingSpinner } from './components/ui/loading-spinner';

// Lazy-loaded components
const WorkerDetails = lazy(() => import('./pages/WorkerDetails'));
const AssignWorkers = lazy(() => import('./pages/AssignWorkers'));

function App() {
  // Check if user is authenticated
  const isAuthenticated = true; // Replace with actual auth check

  // Simple loading fallback
  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-screen">
      <LoadingSpinner />
    </div>
  );

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workers" element={<Workers />} />
        <Route 
          path="/workers/:workerId" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <WorkerDetails />
            </Suspense>
          } 
        />
        <Route 
          path="/assign-workers" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <AssignWorkers />
            </Suspense>
          } 
        />
        <Route path="/location" element={<Location />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
