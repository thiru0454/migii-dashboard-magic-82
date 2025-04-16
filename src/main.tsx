
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from "@clerk/clerk-react";
import App from './App.tsx';
import './index.css';

// Read environment variable or use fallback key
// Note: The key should be defined in your .env file as VITE_CLERK_PUBLISHABLE_KEY
const PUBLISHABLE_KEY = import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_ZmFzdC1taW5ub3ctMC5jbGVyay5hY2NvdW50cy5kZXYk";

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
);
