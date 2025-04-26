
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initBusinessDatabase } from './utils/businessDatabase.ts';

// Initialize our mock business database
initBusinessDatabase();

// Log that we're using the client-side mock email service
console.log("Using client-side mock email service for development");

createRoot(document.getElementById("root")!).render(
  <App />
);
