import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Video from './pages/Video';
import SearchPage from './pages/SearchPage';
import CategoryPage from './pages/CategoryPage';
import CategoriesPage from './pages/CategoriesPage';
import ChannelPage from './pages/ChannelPage';
import ChannelsPage from './pages/ChannelsPage';
import ActorsPage from './pages/ActorsPage';
import ActorProfilePage from './pages/ActorProfilePage';
import Admin from './pages/Admin';
import VideoGridPage from './pages/VideoGridPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading Auth...</div>;
  if (!user || !user.isAdmin) return <Navigate to="/" />;
  
  return <>{children}</>;
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
      <Navbar toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/videos" element={<Home />} />
            <Route path="/watch/:id" element={<Video />} />
            <Route path="/search/:term" element={<SearchPage />} />
            <Route path="/category/:id" element={<CategoryPage />} />
            <Route path="/trending" element={<VideoGridPage type="trending" title="Trending Videos" />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/channels" element={<ChannelsPage />} />
            <Route path="/channel/:id" element={<ChannelPage />} />
            <Route path="/pornstars" element={<ActorsPage />} />
            <Route path="/actor/:id" element={<ActorProfilePage />} />
            <Route path="/history" element={<VideoGridPage type="history" title="Watch History" />} />
            <Route path="/liked" element={<VideoGridPage type="liked" title="Liked Videos" />} />
            <Route path="/watch-later" element={<VideoGridPage type="watch-later" title="Watch Later" />} />
            
            <Route path="/admin" element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}
