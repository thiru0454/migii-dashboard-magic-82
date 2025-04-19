
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initBusinessDatabase } from './utils/businessDatabase.ts';

// Initialize our mock business database
initBusinessDatabase();

createRoot(document.getElementById("root")!).render(
  <App />
);
