
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import Location from './pages/Location';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { LoadingSpinner } from './components/ui/loading-spinner';
import { LanguageProvider } from '../../src/contexts/LanguageContext';
import { Jobs } from './pages/Jobs'; // Import Jobs page

// Lazy-loaded components
const WorkerDetails = lazy(() => import('./pages/WorkerDetails'));
const AssignWorkers = lazy(() => import('./pages/AssignWorkers'));

function App() {
  // Check if user is authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Default to false to show login screen first
  
  useEffect(() => {
    // Check for authentication
    const user = localStorage.getItem('currentUser');
    setIsAuthenticated(!!user);
  }, []);

  // Simple loading fallback
  const LoadingFallback = () => (
    <div className="flex items-center justify-center h-screen">
      <LoadingSpinner />
    </div>
  );

  return (
    <LanguageProvider>
      <Toaster position="top-right" />
      <Routes>
        {/* Always redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Public routes - accessible without authentication */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/worker-registration" element={<Navigate to="/worker-registration" replace />} />
        
        {/* Protected routes - require authentication */}
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/workers" element={isAuthenticated ? <Workers /> : <Navigate to="/login" replace />} />
        <Route 
          path="/workers/:workerId" 
          element={
            isAuthenticated ? (
              <Suspense fallback={<LoadingFallback />}>
                <WorkerDetails />
              </Suspense>
            ) : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/assign-workers" 
          element={
            isAuthenticated ? (
              <Suspense fallback={<LoadingFallback />}>
                <AssignWorkers />
              </Suspense>
            ) : <Navigate to="/login" replace />
          } 
        />
        <Route path="/location" element={isAuthenticated ? <Location /> : <Navigate to="/login" replace />} />
        <Route path="/analytics" element={isAuthenticated ? <Analytics /> : <Navigate to="/login" replace />} />
        <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" replace />} />
        
        {/* Fallback route for any other path */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </LanguageProvider>
  );
}

export default App;
