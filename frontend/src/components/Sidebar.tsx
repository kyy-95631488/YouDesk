import React from 'react';
import { Home, TrendingUp, ListMusic, Clock, Download, Settings } from 'lucide-react';
import { PlaySquare } from 'lucide-react';

interface SidebarProps {
  isSidebarOpen: boolean;
  activeTab: 'home' | 'trending' | 'history' | 'playlists' | 'settings' | 'channel' | 'downloads' | string;
  setActiveTab: React.Dispatch<React.SetStateAction<'home' | 'trending' | 'history' | 'playlists' | 'settings' | 'channel' | 'downloads' | any>>;
  setQuery: (query: string) => void;
  loadPopular: (reset: boolean) => void;
  handleSearch: (e: any, isNewSearch: boolean) => void;
  setActivePlaylistId: (id: string | null) => void;
  downloadTasks: Record<string, any>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  activeTab,
  setActiveTab,
  setQuery,
  loadPopular,
  handleSearch,
  setActivePlaylistId,
  downloadTasks
}) => {
  return (
    <div className={`sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
      <div className="brand">
        <PlaySquare className="brand-icon" size={28} />
        <span>YouDesk</span>
      </div>
      <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => { setActiveTab('home'); setQuery(''); loadPopular(true); }}>
        <Home size={20} />
        <span>Home</span>
      </div>
      <div className={`nav-item ${activeTab === 'trending' ? 'active' : ''}`} onClick={() => { setActiveTab('trending'); setQuery('Trending Videos'); handleSearch(undefined, true); }}>
        <TrendingUp size={20} />
        <span>Trending</span>
      </div>
      <div className={`nav-item ${activeTab === 'playlists' ? 'active' : ''}`} onClick={() => { setActiveTab('playlists'); setActivePlaylistId(null); }}>
        <ListMusic size={20} />
        <span>Playlists</span>
      </div>
      <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
        <Clock size={20} />
        <span>History</span>
      </div>
      <div className={`nav-item ${activeTab === 'downloads' ? 'active' : ''}`} onClick={() => setActiveTab('downloads')}>
        <Download size={20} />
        <span>Downloads</span>
        {Object.values(downloadTasks).filter((t: any) => t.status === 'downloading').length > 0 && (
          <span className="downloads-badge">
            {Object.values(downloadTasks).filter((t: any) => t.status === 'downloading').length}
          </span>
        )}
      </div>
      <div style={{ flex: 1 }}></div>
      <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
        <Settings size={20} />
        <span>Settings</span>
      </div>
    </div>
  );
};
