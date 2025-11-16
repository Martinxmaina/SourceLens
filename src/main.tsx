import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from './integrations/supabase/client'

// Expose supabase client globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}

createRoot(document.getElementById("root")!).render(<App />);
