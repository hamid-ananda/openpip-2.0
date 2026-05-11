import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/Layout'
import { ThemeProvider } from './components/ThemeProvider'
import { HomePage } from './features/home/HomePage'
import { SearchResultsPage } from './features/search/SearchResultsPage'
import { AdminSettingsPage } from './features/admin/AdminSettingsPage'
import { AdminRoute } from './features/admin/AdminRoute'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { ProfilePage } from './features/auth/ProfilePage'
import { DownloadPage } from './features/static/DownloadPage'
import { AboutPage } from './features/static/AboutPage'
import { FAQPage } from './features/static/FAQPage'
import { ContactPage } from './features/static/ContactPage'
import { DocumentationPage } from './features/static/DocumentationPage'

const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Layout />
        </ThemeProvider>
      </QueryClientProvider>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchResultsPage /> },
      { path: 'search/:term', element: <SearchResultsPage /> },
      { path: 'download', element: <DownloadPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'faq', element: <FAQPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'documentation', element: <DocumentationPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'profile', element: <ProfilePage /> },
      {
        path: 'admin/settings',
        element: <AdminRoute><AdminSettingsPage /></AdminRoute>,
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
