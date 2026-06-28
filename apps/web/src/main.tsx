import './index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { SessionProvider } from '@/contexts/SessionContext'
import { GarageProvider } from '@/contexts/GarageContext'
import { WishlistProvider } from '@/contexts/WishlistContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <GarageProvider>
            <WishlistProvider>
              <App />
            </WishlistProvider>
          </GarageProvider>
        </SessionProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)
