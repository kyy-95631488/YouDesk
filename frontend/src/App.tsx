import { Sidebar } from './components/Sidebar';
import { DownloadsView } from './views/DownloadsView';
import { useState, useEffect, useRef } from 'react';
import './App.css';
// @ts-ignore
import { SearchVideos, GetPopularVideos, GetChannelVideos, GetChannelInfo, GetChannelPlaylists, CheckYtDlp, EnsureYtDlp, UpdateYtDlp, GetVideoDetails, SetCookieBrowser, DownloadMedia } from '../wailsjs/go/main/App';
import { EventsOn, EventsOff, BrowserOpenURL } from '../wailsjs/runtime/runtime';
import YouTube from 'react-youtube';
import { Search, Home, TrendingUp, PlaySquare, Clock, Settings, ArrowLeft, AlertCircle, Loader2, Download, RefreshCw, ListMusic, Plus, X, Trash2, FolderPlus, Menu, ThumbsUp, Share2, MessageSquare, MoreHorizontal, ChevronLeft, ChevronRight, LogIn, Music, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, VolumeX } from 'lucide-react';

function App() {
  const [initStatus, setInitStatus] = useState<'checking' | 'downloading' | 'updating' | 'ready'>('checking');

  // Progress state
  const [dlPercent, setDlPercent] = useState(0);
  const [dlSpeed, setDlSpeed] = useState(0);
  const [dlDownloaded, setDlDownloaded] = useState(0);
  const [dlTotal, setDlTotal] = useState(0);

  const [activeTab, setActiveTab] = useState<'home' | 'trending' | 'history' | 'playlists' | 'settings' | 'channel' | 'downloads'>('home');
  const [toasts, setToasts] = useState<{ id: number, message: string }[]>([]);
  const addToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };
  const [downloadTasks, setDownloadTasks] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('youdesk_downloads');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('youdesk_downloads', JSON.stringify(downloadTasks));
  }, [downloadTasks]);

  // MP3 Player State
  const [mp3Queue, setMp3Queue] = useState<any[]>([]);
  const [mp3Index, setMp3Index] = useState(-1);
  const [mp3Playing, setMp3Playing] = useState(false);
  const [mp3CurrentTime, setMp3CurrentTime] = useState(0);
  const [mp3Duration, setMp3Duration] = useState(0);
  const [mp3Loop, setMp3Loop] = useState(false);
  const [mp3Shuffle, setMp3Shuffle] = useState(false);
  const [mp3Volume, setMp3Volume] = useState(1);
  const [mp3Muted, setMp3Muted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [playingVideo, setPlayingVideo] = useState<any | null>(null);
  
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [history, setHistory] = useState<any[]>([]);
  const [watchProgress, setWatchProgress] = useState<Record<string, number>>({});
  const ytPlayerRef = useRef<any>(null);
  const [autoUpdate, setAutoUpdate] = useState<boolean>(true);

  // Playlists state
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [cookieBrowser, setCookieBrowserState] = useState<string>('none');
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => { } });

  // Watch Page state
  const [videoDetails, setVideoDetails] = useState<any | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [activeChip, setActiveChip] = useState('Semua');
  const [descExpanded, setDescExpanded] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [relatedOffset, setRelatedOffset] = useState(0);
  const [relatedHasMore, setRelatedHasMore] = useState(true);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const chipsRef = useRef<HTMLDivElement>(null);
  const feedQueriesRef = useRef<string[]>([]);

  // Channel state
  const [activeChannel, setActiveChannel] = useState<{
    url: string;
    name: string;
    id?: string;
    uploaderUrl?: string;
    description?: string;
    subscribers?: number;
    avatarUrl?: string;
    bannerUrl?: string;
  } | null>(null);
  const [channelVideos, setChannelVideos] = useState<any[]>([]);
  const [channelOffset, setChannelOffset] = useState(0);
  const [channelHasMore, setChannelHasMore] = useState(true);
  const [isLoadingChannel, setIsLoadingChannel] = useState(false);
  const [isLoadingChannelInfo, setIsLoadingChannelInfo] = useState(false);
  const [channelTab, setChannelTab] = useState<'home' | 'videos' | 'shorts' | 'live' | 'playlists' | 'posts' | 'about'>('videos');
  const [channelSearchQuery, setChannelSearchQuery] = useState('');
  // Playlist-inside-channel state
  const [channelPlaylists, setChannelPlaylists] = useState<any[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [activePlaylistDetail, setActivePlaylistDetail] = useState<{ id: string; title: string; url: string; thumbnail: string } | null>(null);
  const [playlistDetailVideos, setPlaylistDetailVideos] = useState<any[]>([]);
  const [isLoadingPlaylistVideos, setIsLoadingPlaylistVideos] = useState(false);
  const [playlistDetailOffset, setPlaylistDetailOffset] = useState(0);
  const [playlistDetailHasMore, setPlaylistDetailHasMore] = useState(true);
  // Now-playing playlist context (for watch page sidebar)
  const [nowPlayingPlaylist, setNowPlayingPlaylist] = useState<{ id: string; title: string; videos: any[] } | null>(null);
  const [nowPlayingIndex, setNowPlayingIndex] = useState<number>(-1);
  const playlistSidebarRef = useRef<HTMLDivElement>(null);

  // Mini-player dragging
  const [miniPos, setMiniPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMiniPlayer) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    dragStart.current = {
      x: clientX,
      y: clientY,
      initialX: miniPos.x,
      initialY: miniPos.y
    };
  };

  useEffect(() => {
    const handleDrag = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const dx = clientX - dragStart.current.x;
      const dy = clientY - dragStart.current.y;

      setMiniPos({
        x: dragStart.current.initialX + dx,
        y: dragStart.current.initialY + dy
      });
    };

    const handleDragEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

  // Polling for watch progress
  useEffect(() => {
    let interval: any;
    if (playingVideo) {
      interval = setInterval(() => {
        if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime && ytPlayerRef.current.getDuration) {
          const time = ytPlayerRef.current.getCurrentTime();
          const duration = ytPlayerRef.current.getDuration();
          if (time > 0 && duration > 0) {
            const pct = (time / duration) * 100;
            setWatchProgress(prev => {
              const next = { ...prev, [playingVideo.id]: pct };
              localStorage.setItem('ytWatchProgress', JSON.stringify(next));
              return next;
            });
          }
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [playingVideo]);

  const LIMIT = 20;
  // Initialization
  useEffect(() => {
    // Setup event listener for progress
    const listener = (data: any) => {
      setDlPercent(data.percent);
      setDlSpeed(data.speed);
      setDlDownloaded(data.downloaded);
      setDlTotal(data.total);
    };
    (window as any).runtime.EventsOn("download_progress", listener);

    // Load saved settings, history, and playlists
    const savedAutoUpdate = localStorage.getItem('autoUpdateYtDlp');
    const savedHistory = localStorage.getItem('ytHistory');
    const savedWatchProgress = localStorage.getItem('ytWatchProgress');
    const savedPlaylists = localStorage.getItem('ytCustomPlaylists');

    let isAutoUpdate = true;
    if (savedAutoUpdate !== null) {
      isAutoUpdate = savedAutoUpdate === 'true';
      setAutoUpdate(isAutoUpdate);
    }

    if (savedWatchProgress) { try { setWatchProgress(JSON.parse(savedWatchProgress)); } catch (e) { } }
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { }
    }

    if (savedPlaylists) {
      try { setPlaylists(JSON.parse(savedPlaylists)); } catch (e) { }
    }

    const savedBrowser = localStorage.getItem('ytCookieBrowser');
    if (savedBrowser) {
      setCookieBrowserState(savedBrowser);
      SetCookieBrowser(savedBrowser);
    }

    const initApp = async () => {
      setInitStatus('checking');
      try {
        const exists = await CheckYtDlp();
        if (!exists) {
          setInitStatus('downloading');
          await EnsureYtDlp();
        } else if (isAutoUpdate) {
          setInitStatus('updating');
          await UpdateYtDlp();
        }
      } catch (e) {
        console.error("Init Error:", e);
      }
      setInitStatus('ready');
      loadPopular(true);
    };

    initApp();

    return () => {
      (window as any).runtime.EventsOff("download_progress");
    };
  }, []);

  // Handle DPAPI errors and download status
  useEffect(() => {
    EventsOn('download_status', (msg: string) => {
      setDownloadStatus(msg);
      if (msg.includes("Selesai") || msg.includes("Error")) {
        setTimeout(() => setDownloadStatus(''), 3000);
      }
    });

    EventsOn('download_progress_update', (data: any) => {
      setDownloadTasks(prev => {
        const prevTask = prev[data.task_id] || {};
        const text = data.text;
        let progress = prevTask.progress || 0;
        if (text.includes('%')) {
          const match = text.match(/([\d.]+)%/);
          if (match) progress = parseFloat(match[1]);
        }
        return {
          ...prev,
          [data.task_id]: {
            ...prevTask,
            id: data.task_id,
            progressText: text.replace('[download]', '').trim(),
            progress: progress,
            savePath: data.save_path
          }
        };
      });
    });

    EventsOn('download_complete', (data: any) => {
      setDownloadTasks(prev => ({
        ...prev,
        [data.task_id]: {
          ...(prev[data.task_id] || {}),
          status: data.error ? 'error' : 'completed',
          error: data.error,
          savePath: data.save_path || (prev[data.task_id] ? prev[data.task_id].savePath : '')
        }
      }));
      if (!data.error) {
        addToast('Download Selesai!');
      }
    });

    EventsOn('dpapi_error', (msg: string) => {
      // Auto-disable cookie sync to prevent spamming
      setCookieBrowserState('none');
      localStorage.setItem('ytCookieBrowser', 'none');
      SetCookieBrowser('none');

      setConfirmModal({
        isOpen: true,
        message: msg,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
    });
    return () => {
      EventsOff('dpapi_error');
    };
  }, []);

  const loadPopular = async (reset: boolean = false) => {
    if (loading) return;
    setLoading(true);

    if (reset) {
      setErrorMsg('');
      setVideos([]);
      setHasMore(true);

      let localHistory: any[] = [];
      try {
        const h = localStorage.getItem('ytHistory');
        if (h) localHistory = JSON.parse(h);
      } catch (e) { }

      let localSearches: string[] = [];
      try {
        const s = localStorage.getItem('ytSearchHistory');
        if (s) localSearches = JSON.parse(s);
      } catch (e) { }

      const allQueries = new Set<string>();
      localSearches.forEach(s => allQueries.add(s));
      localHistory.forEach(h => { if (h.uploader) allQueries.add(h.uploader); });

      feedQueriesRef.current = Array.from(allQueries).sort(() => 0.5 - Math.random());
    }

    const currentOffset = reset ? 0 : offset;

    try {

      let results;
      const historyItems = feedQueriesRef.current;

      const pageIndex = Math.floor(currentOffset / LIMIT);

      if (historyItems.length > 0 && pageIndex < historyItems.length) {
        const recQuery = historyItems[pageIndex];
        results = await SearchVideos(recQuery, LIMIT, 0);

        if (!results || results.length === 0) {
          results = await GetPopularVideos(LIMIT, currentOffset);
        }
      } else {
        const fallbackOffset = historyItems.length > 0 ? currentOffset - (historyItems.length * LIMIT) : currentOffset;
        results = await GetPopularVideos(LIMIT, fallbackOffset);
      }

      if (results && results.length > 0) {
        setVideos(prev => reset ? results : [...prev, ...results]);
        setOffset(currentOffset + LIMIT);
      } else {
        setHasMore(false);
      }
    } catch (e: any) {
      setErrorMsg(e.toString());
      console.error(e);
    }
    setLoading(false);
  };

  const handleSearch = async (e?: React.FormEvent, isNewSearch: boolean = false) => {
    if (e) e.preventDefault();
    if (!query.trim()) return loadPopular(isNewSearch);
    if (loading) return;

    setLoading(true);
    const currentOffset = isNewSearch ? 0 : offset;
    if (isNewSearch) {
      setErrorMsg('');
      setVideos([]);
      setHasMore(true);
      setActiveTab('home');

      if (query.trim() !== 'Trending Videos') {
        const savedSearchesStr = localStorage.getItem('ytSearchHistory');
        let savedSearches: string[] = [];
        if (savedSearchesStr) {
          try { savedSearches = JSON.parse(savedSearchesStr); } catch (e) { }
        }
        const newSearches = [query.trim(), ...savedSearches.filter(q => q !== query.trim())].slice(0, 10);
        localStorage.setItem('ytSearchHistory', JSON.stringify(newSearches));
      }
    }

    try {
      const results = await SearchVideos(query, LIMIT, currentOffset);
      if (results && results.length > 0) {
        setVideos(prev => isNewSearch ? results : [...prev, ...results]);
        setOffset(currentOffset + LIMIT);
      } else {
        setHasMore(false);
      }
    } catch (e: any) {
      setErrorMsg(e.toString());
      console.error(e);
    }
    setLoading(false);
  };

  const CHANNEL_LIMIT = 20;

  const loadChannel = async (url: string, isNew: boolean = false) => {
    if (isLoadingChannel) return;
    setIsLoadingChannel(true);
    const currentOffset = isNew ? 0 : channelOffset;
    if (isNew) {
      setChannelVideos([]);
      setChannelOffset(0);
      setChannelHasMore(true);
    }
    try {
      const results = await GetChannelVideos(url, CHANNEL_LIMIT, currentOffset);
      if (results && results.length > 0) {
        setChannelVideos(prev => isNew ? results : [...prev, ...results]);
        setChannelOffset(currentOffset + CHANNEL_LIMIT);
        if (results.length < CHANNEL_LIMIT) setChannelHasMore(false);
      } else {
        setChannelHasMore(false);
      }
    } catch (e: any) {
      setErrorMsg(e.toString());
      setChannelHasMore(false);
      console.error(e);
    }
    setIsLoadingChannel(false);
  };

  const openChannel = (name: string, rawUrl: string) => {
    let url = rawUrl || playingVideo?.channel_url || '';
    if (!url && videoDetails?.channel_id) {
      url = `https://www.youtube.com/channel/${videoDetails.channel_id}`;
    }
    if (!url) {
      setErrorMsg('URL channel tidak ditemukan, tunggu detail video selesai dimuat.');
      return;
    }
    const baseUrl = url.replace(/\/(videos|streams|shorts|playlists|community|posts)\/?$/, '').replace(/\/+$/, '');
    const videosUrl = baseUrl + '/videos';

    setErrorMsg('');
    setChannelTab('videos');
    setChannelSearchQuery('');
    setActiveChannel({ url: videosUrl, name: name || 'Channel' });
    setActiveTab('channel');
    setIsMiniPlayer(true);
    // Reset playlist state
    setChannelPlaylists([]);
    setActivePlaylistDetail(null);
    setPlaylistDetailVideos([]);
    loadChannel(videosUrl, true);

    // Fetch channel metadata in background
    setIsLoadingChannelInfo(true);
    GetChannelInfo(baseUrl).then((info: any) => {
      if (info) {
        setActiveChannel(prev => prev ? {
          ...prev,
          id: info.ID || info.channel_id || '',
          uploaderUrl: baseUrl,
          description: info.Description || info.description || '',
          subscribers: info.Subscribers || info.channel_follower_count || 0,
          avatarUrl: info.AvatarURL || info.avatar_url || '',
          bannerUrl: info.BannerURL || info.banner_url || '',
        } : prev);
      }
    }).catch(console.error).finally(() => setIsLoadingChannelInfo(false));
  };

  // Load videos of a specific playlist (from channel), accumulate all videos for now-playing context
  const loadPlaylistVideos = async (pl: { id: string; title: string; url: string; thumbnail: string }, isNew: boolean = false) => {
    if (isLoadingPlaylistVideos && !isNew) return;
    if (isNew) {
      setActivePlaylistDetail(pl);
      setPlaylistDetailVideos([]);
      setPlaylistDetailOffset(0);
      setPlaylistDetailHasMore(true);
      // Reset playlist context
      setNowPlayingPlaylist({ id: pl.id, title: pl.title, videos: [] });
      setNowPlayingIndex(-1);
    }
    setIsLoadingPlaylistVideos(true);
    const currentOffset = isNew ? 0 : playlistDetailOffset;
    try {
      const results = await GetChannelVideos(pl.url, 20, currentOffset);
      if (results && results.length > 0) {
        setPlaylistDetailVideos(prev => {
          const updated = isNew ? results : [...prev, ...results];
          // Keep nowPlayingPlaylist videos in sync
          setNowPlayingPlaylist(prev2 => prev2 ? { ...prev2, videos: updated } : null);
          return updated;
        });
        setPlaylistDetailOffset(currentOffset + 20);
        if (results.length < 20) setPlaylistDetailHasMore(false);
      } else {
        setPlaylistDetailHasMore(false);
      }
    } catch (e) {
      console.error(e);
      setPlaylistDetailHasMore(false);
    }
    setIsLoadingPlaylistVideos(false);
  };

  // Play a video with playlist context
  const playVideoFromPlaylist = (video: any, index: number) => {
    setNowPlayingIndex(index);
    playVideo(video);
    // Scroll the playlist sidebar to the active item
    setTimeout(() => {
      if (playlistSidebarRef.current) {
        const activeEl = playlistSidebarRef.current.querySelector('.playlist-sidebar-item.active') as HTMLElement;
        if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Navigate playlist: +1 = next, -1 = prev
  const navigatePlaylist = (dir: 1 | -1) => {
    if (!nowPlayingPlaylist) return;
    const newIdx = nowPlayingIndex + dir;
    if (newIdx < 0 || newIdx >= nowPlayingPlaylist.videos.length) return;
    playVideoFromPlaylist(nowPlayingPlaylist.videos[newIdx], newIdx);
  };

  const handleScroll = (e: any) => {
    if (activeTab === 'settings' || activeTab === 'history' || activeTab === 'playlists') return;
    if (activeTab === 'channel') {
      const nearBottom = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight < 100;
      if (nearBottom && !isLoadingChannel && channelHasMore && activeChannel) {
        loadChannel(activeChannel.url, false);
      }
      return;
    }

    const bottom = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight < 100;
    if (bottom && !loading && !errorMsg && hasMore) {
      if (activeTab === 'home' && query.trim()) {
        handleSearch(undefined, false);
      } else {
        loadPopular(false);
      }
    }
  };

  const handlePlayerScroll = (e: any) => {
    if (isMiniPlayer || !playingVideo) return;
    const bottom = e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight < 200;
    if (bottom && !isLoadingRelated && relatedHasMore) {
      fetchMoreRelated();
    }
  };

  const fetchMoreRelated = async () => {
    setIsLoadingRelated(true);
    let searchQuery = playingVideo?.uploader || 'trending';
    if (activeChip === 'Terkait' && videoDetails?.tags?.length > 0) {
      searchQuery = videoDetails.tags[0];
    } else if (activeChip === 'Dari Channel') {
      searchQuery = playingVideo?.uploader;
    } else if (activeChip === 'Baru diupload') {
      searchQuery = 'newly uploaded';
    } else if (activeChip === 'Untuk Anda') {
      searchQuery = 'recommended';
    }

    try {
      const moreRelated = await SearchVideos(searchQuery, 15, relatedOffset);
      if (moreRelated && moreRelated.length > 0) {
        setRelatedVideos(prev => [...prev, ...moreRelated]);
        setRelatedOffset(prev => prev + 15);
      } else {
        setRelatedHasMore(false);
      }
    } catch (e) { }
    setIsLoadingRelated(false);
  };

  const playVideo = async (v: any) => {
    setPlayingVideo(v);
    setIsMiniPlayer(false);
    setVideoDetails(null);
    setRelatedVideos([]);
    setActiveChip('Semua');
    setDescExpanded(false);
    setIsLoadingDetails(true);
    setRelatedOffset(0);
    setRelatedHasMore(true);

    // Save to history
    const newHistory = [v, ...history.filter((item) => item.id !== v.id)].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem('ytHistory', JSON.stringify(newHistory));

    try {
      const details = await GetVideoDetails(`https://www.youtube.com/watch?v=${v.id}`);
      setVideoDetails(details);

      // Fetch related using tags or uploader
      const relatedTag = details.tags && details.tags.length > 0 ? details.tags[0] : v.uploader;
      const related = await SearchVideos(relatedTag, 15, 0);
      setRelatedVideos(related);
      setRelatedOffset(15);
    } catch (e) {
      console.error(e);
      // Fallback
      const related = await SearchVideos(v.uploader, 15, 0);
      setRelatedVideos(related);
      setRelatedOffset(15);
    }
    setIsLoadingDetails(false);
  };

  const handleChipClick = async (chip: string) => {
    setActiveChip(chip);
    setRelatedVideos([]);
    setIsLoadingDetails(true);
    setRelatedOffset(0);
    setRelatedHasMore(true);

    let searchQuery = playingVideo?.uploader || 'trending';
    if (chip === 'Terkait' && videoDetails?.tags?.length > 0) {
      searchQuery = videoDetails.tags[0];
    } else if (chip === 'Dari Channel') {
      searchQuery = playingVideo?.uploader;
    } else if (chip === 'Baru diupload') {
      searchQuery = 'newly uploaded';
    } else if (chip === 'Untuk Anda') {
      searchQuery = 'recommended';
    }

    try {
      const related = await SearchVideos(searchQuery, 15, 0);
      setRelatedVideos(related);
      setRelatedOffset(15);
    } catch (e) { }
    setIsLoadingDetails(false);
  };

  const scrollChips = (dir: 'left' | 'right') => {
    if (chipsRef.current) {
      chipsRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  // --- Playlist Logic ---
  const savePlaylists = (newPlaylists: any[]) => {
    setPlaylists(newPlaylists);
    localStorage.setItem('ytCustomPlaylists', JSON.stringify(newPlaylists));
  };

  const handleCookieBrowserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCookieBrowserState(val);
    localStorage.setItem('ytCookieBrowser', val);
    SetCookieBrowser(val);
  };

  const addToPlaylist = (playlistId: string) => {
    if (!playingVideo) return;
    const pList = playlists.find(p => p.id === playlistId);
    if (pList) {
      if (!pList.videos.some((v: any) => v.id === playingVideo.id)) {
        pList.videos.push(playingVideo);
        savePlaylists([...playlists]);
      }
    }
    setShowPlaylistModal(false);
  };

  const createAndAddToPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const newP = { id: Date.now().toString(), name: newPlaylistName, videos: playingVideo ? [playingVideo] : [] };
    savePlaylists([...playlists, newP]);
    setNewPlaylistName('');
    setShowPlaylistModal(false);
  };

  const removeFromPlaylist = (playlistId: string, videoId: string) => {
    const pList = playlists.find(p => p.id === playlistId);
    if (pList) {
      pList.videos = pList.videos.filter((v: any) => v.id !== videoId);
      savePlaylists([...playlists]);
    }
  };

  const deletePlaylist = (playlistId: string) => {
    savePlaylists(playlists.filter(p => p.id !== playlistId));
    if (activePlaylistId === playlistId) setActivePlaylistId(null);
  };

  // --- Utility ---
  const toggleAutoUpdate = () => {
    const newVal = !autoUpdate;
    setAutoUpdate(newVal);
    localStorage.setItem('autoUpdateYtDlp', String(newVal));
  };

  const formatDuration = (sec: number) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatViews = (views: number) => {
    if (!views) return '0 views';
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M views';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K views';
    return views + ' views';
  };

  const formatBytes = (bytes: number, decimals = 1) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const date = new Date(`${year}-${month}-${day}`);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (initStatus !== 'ready') {
    return (
      <div className="init-fullscreen">
        <div className="init-ambient-bg"></div>
        
        <div className="init-center-content">
          <div className="init-logo-container">
            <div className="init-logo-glow"></div>
            <svg className="init-logo-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="15" y="25" width="70" height="50" rx="12" className="init-logo-rect" />
              <path d="M43 40L61 50L43 60V40Z" className="init-logo-play" />
            </svg>
          </div>
        </div>

        <div className="init-bottom-content">
          <div className="init-text-wrapper">
            <h1 className="init-title">
              {initStatus === 'checking' && "Initializing YouDesk"}
              {initStatus === 'downloading' && "Acquiring Core Engines"}
              {initStatus === 'updating' && "Verifying Engine Version"}
            </h1>
            <p className="init-subtitle">
              {initStatus === 'checking' && "Establishing secure local environment..."}
              {initStatus === 'downloading' && "This is a one-time process. Setting up core media engine..."}
              {initStatus === 'updating' && "Ensuring maximum compatibility with latest standards..."}
            </p>
          </div>

          {initStatus === 'downloading' && (
            <div className="init-stats-row">
              <span>{formatBytes(dlSpeed)}/s</span>
              <span>{formatBytes(dlDownloaded)} / {formatBytes(dlTotal)} ({dlPercent.toFixed(1)}%)</span>
            </div>
          )}
        </div>

        {initStatus === 'downloading' && (
          <div className="init-progress-line-container">
            <div className="init-progress-line" style={{ width: `${dlPercent}%` }}></div>
          </div>
        )}
      </div>
    );
  }

  const handleDownload = async (url: string, formatId: string, isAudio: boolean) => {
    const title = videoDetails?.title || 'Video';
    const taskId = await DownloadMedia(url, formatId, isAudio, title);
    if (taskId && taskId !== "Cancelled" && taskId !== "Error") {
      setDownloadTasks(prev => ({
        ...prev,
        [taskId]: {
          id: taskId,
          title: videoDetails?.title || 'Video',
          thumbnail: videoDetails?.thumbnail || '',
          isAudio,
          status: 'downloading',
          progress: 0,
          progressText: 'Memulai...'
        }
      }));
      addToast('Download Dimulai!');
      setShowDownloadModal(false);
    }
  };

  const getUniqueVideoFormats = (formats: any[]) => {
    if (!formats) return [];
    const videoFormats = formats.filter((f: any) => f.vcodec !== 'none' && f.ext === 'mp4');

    const grouped = new Map<string, any>();
    for (const f of videoFormats) {
      const hasAudio = f.acodec !== 'none';
      const fps = f.fps ? Math.round(f.fps) : 30;
      const key = `${f.resolution}-${fps}`;

      if (!grouped.has(key)) {
        grouped.set(key, f);
      } else {
        const existing = grouped.get(key);
        if (hasAudio && existing.acodec === 'none') {
          grouped.set(key, f);
        }
        else if (hasAudio === (existing.acodec !== 'none')) {
          if ((f.vbr || 0) > (existing.vbr || 0)) {
            grouped.set(key, f);
          }
        }
      }
    }

    return Array.from(grouped.values()).sort((a, b) => {
      const h1 = parseInt(a.resolution.split('x')[1]) || 0;
      const h2 = parseInt(b.resolution.split('x')[1]) || 0;
      if (h2 !== h1) return h2 - h1; // descending resolution
      return (b.fps || 0) - (a.fps || 0); // descending fps
    });
  };

  const getUniqueAudioFormats = (formats: any[]) => {
    if (!formats) return [];
    const audioFormats = formats.filter((f: any) => f.acodec !== 'none' && f.vcodec === 'none');

    const grouped = new Map<string, any>();
    for (const f of audioFormats) {
      if (!f.abr) continue;
      const kbps = Math.round(f.abr / 10) * 10;
      const key = `${kbps}kbps`;
      if (!grouped.has(key) || f.abr > grouped.get(key).abr) {
        grouped.set(key, f);
      }
    }

    // Sort descending by bitrate
    return Array.from(grouped.values()).sort((a, b) => (b.abr || 0) - (a.abr || 0));
  };

  return (
    <div className="app-container glass-panel">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setQuery={setQuery}
        loadPopular={loadPopular}
        handleSearch={handleSearch}
        setActivePlaylistId={setActivePlaylistId}
        downloadTasks={downloadTasks}
      />

      {/* Main Content */}
      <div className="main-content" onScroll={handleScroll}>
        <div className="topbar">
          <button className="hamburger-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu size={24} />
          </button>
          <form className="search-container" onSubmit={(e) => handleSearch(e, true)}>
            <input
              type="text"
              className="search-input glass-panel"
              placeholder="Search for videos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="search-btn">
              <Search size={20} />
            </button>
          </form>
          {activeTab === 'home' && (
            <button
              className="topbar-action-btn"
              onClick={() => loadPopular(true)}
              title="Refresh Recommendations"
              disabled={loading}
            >
              <RefreshCw size={20} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          )}
        </div>

        {/* Channel View */}
        {activeTab === 'channel' && activeChannel && (
          <div className="channel-view">

            {/* === BANNER === */}
            <div className="channel-banner">
              {activeChannel.bannerUrl ? (
                <img
                  src={activeChannel.bannerUrl}
                  alt="Channel Banner"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = 'none';
                  }}
                />
              ) : (
                <div className="channel-banner-placeholder" />
              )}
            </div>

            {/* === HEADER: Avatar + Info + Subscribe === */}
            <div className="channel-info-row">
              {/* Avatar */}
              <div className="channel-avatar-lg">
                {activeChannel.avatarUrl ? (
                  <img
                    src={activeChannel.avatarUrl}
                    alt={activeChannel.name}
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                      const fb = el.nextSibling as HTMLElement;
                      if (fb) fb.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="channel-avatar-fallback" style={{ display: activeChannel.avatarUrl ? 'none' : 'flex' }}>
                  {activeChannel.name.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Meta */}
              <div className="channel-meta">
                <h1 className="channel-name">{activeChannel.name}</h1>
                <div className="channel-stats">
                  {isLoadingChannelInfo ? (
                    <span className="channel-stat-loading">Memuat info…</span>
                  ) : (
                    <>
                      {activeChannel.id && (
                        <span className="channel-stat-item">@{activeChannel.name.toLowerCase().replace(/\s+/g, '')}</span>
                      )}
                      {activeChannel.subscribers ? (
                        <span className="channel-stat-item">
                          {activeChannel.id && <span className="channel-stat-sep">•</span>}
                          {formatViews(activeChannel.subscribers)} subscriber
                        </span>
                      ) : null}
                      {channelVideos.length > 0 && (
                        <span className="channel-stat-item">
                          <span className="channel-stat-sep">•</span>
                          {channelVideos.length}+ video
                        </span>
                      )}
                    </>
                  )}
                </div>
                {activeChannel.description && (
                  <p className="channel-desc-short">
                    {activeChannel.description.split('\n')[0].slice(0, 150)}
                    {activeChannel.description.length > 150 ? '…' : ''}
                  </p>
                )}
              </div>

              {/* Subscribe → open real YouTube */}
              <button
                className="channel-subscribe-btn"
                onClick={() => {
                  const ytUrl = activeChannel.uploaderUrl || activeChannel.url.replace('/videos', '');
                  BrowserOpenURL(ytUrl);
                }}
              >
                Subscribe
              </button>
            </div>

            {/* === TABS + SEARCH === */}
            <div className="channel-tabs-bar">
              <div className="channel-tabs">
                {([
                  { key: 'home', label: 'Beranda' },
                  { key: 'videos', label: 'Video' },
                  { key: 'shorts', label: 'Shorts' },
                  { key: 'live', label: 'Live' },
                  { key: 'playlists', label: 'Playlist' },
                  { key: 'posts', label: 'Postingan' },
                  { key: 'about', label: 'Tentang' },
                ] as const).map(t => (
                  <button
                    key={t.key}
                    className={`channel-tab-btn ${channelTab === t.key ? 'active' : ''}`}
                    onClick={() => {
                      setChannelTab(t.key);
                      setActivePlaylistDetail(null);
                      setChannelSearchQuery('');
                      if (t.key === 'playlists') {
                        // Fetch channel playlists list
                        setChannelPlaylists([]);
                        setIsLoadingPlaylists(true);
                        const baseUrl = (activeChannel!.uploaderUrl || activeChannel!.url.replace('/videos', '')).replace(/\/+$/, '');
                        GetChannelPlaylists(baseUrl).then((res: any[]) => {
                          setChannelPlaylists(res || []);
                        }).catch(console.error).finally(() => setIsLoadingPlaylists(false));
                      } else if (t.key !== 'about' && t.key !== 'posts') {
                        const baseUrl = (activeChannel!.uploaderUrl || activeChannel!.url.replace('/videos', '')).replace(/\/+$/, '');
                        const newUrl = t.key === 'home' ? baseUrl + '/videos' : baseUrl + `/${t.key}`;
                        setActiveChannel(prev => prev ? { ...prev, url: newUrl } : prev);
                        loadChannel(newUrl, true);
                      }
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Search inside channel */}
              <div className="channel-search-box">
                <Search size={16} style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder={`Cari di ${activeChannel.name}…`}
                  value={channelSearchQuery}
                  onChange={(e) => setChannelSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && channelSearchQuery.trim()) {
                      // search within channel by name + query
                      setChannelVideos([]);
                      setChannelHasMore(true);
                      setIsLoadingChannel(true);
                      SearchVideos(`${activeChannel.name} ${channelSearchQuery}`, 20, 0)
                        .then((res: any[]) => { setChannelVideos(res || []); })
                        .catch(console.error)
                        .finally(() => setIsLoadingChannel(false));
                    }
                  }}
                  className="channel-search-input"
                />
                {channelSearchQuery && (
                  <button onClick={() => {
                    setChannelSearchQuery('');
                    loadChannel(activeChannel.url, true);
                  }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* === CONTENT AREA === */}
            <div className="channel-content">

              {/* About tab */}
              {channelTab === 'about' ? (
                <div className="channel-about">
                  <div className="channel-about-card">
                    <h3>Deskripsi</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                      {activeChannel.description || 'Tidak ada deskripsi.'}
                    </p>
                  </div>
                  <div className="channel-about-card">
                    <h3>Detail Channel</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {activeChannel.id && (
                        <div className="channel-detail-row">
                          <span>🆔</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{activeChannel.id}</span>
                        </div>
                      )}
                      {activeChannel.subscribers ? (
                        <div className="channel-detail-row">
                          <span>👥</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{formatViews(activeChannel.subscribers)} subscriber</span>
                        </div>
                      ) : null}
                      <div className="channel-detail-row">
                        <span>🔗</span>
                        <button
                          onClick={() => BrowserOpenURL(activeChannel.uploaderUrl || activeChannel.url)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.9rem', padding: 0, textAlign: 'left' }}
                        >
                          Buka di YouTube ↗
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : channelTab === 'posts' ? (
                /* Postingan (Community) — open in browser */
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Postingan komunitas tidak dapat ditampilkan di dalam aplikasi.
                  </p>
                  <button className="action-btn" onClick={() => {
                    const base = (activeChannel.uploaderUrl || activeChannel.url.replace('/videos', '')).replace(/\/+$/, '');
                    BrowserOpenURL(base + '/community');
                  }}>
                    Buka Postingan di YouTube ↗
                  </button>
                </div>
              ) : channelTab === 'playlists' ? (
                /* === PLAYLISTS TAB === */
                activePlaylistDetail ? (
                  /* Playlist Detail — show videos inside a playlist */
                  <div className="channel-videos-grid">
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                      <button
                        className="action-btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                        onClick={() => { setActivePlaylistDetail(null); setPlaylistDetailVideos([]); }}
                      >
                        <ChevronLeft size={16} /> Kembali ke Playlist
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {activePlaylistDetail.thumbnail && (
                          <img src={activePlaylistDetail.thumbnail} alt="" style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                        )}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{activePlaylistDetail.title}</div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{playlistDetailVideos.length} video dimuat</div>
                        </div>
                      </div>
                    </div>

                    {/* Playlist videos list */}
                    {playlistDetailVideos.length === 0 && !isLoadingPlaylistVideos ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <ListMusic size={40} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                        <p>Tidak ada video ditemukan</p>
                      </div>
                    ) : (
                      <div className="playlist-video-list">
                        {playlistDetailVideos.map((video: any, i: number) => (
                          <div
                            key={`plv-${video.id}-${i}`}
                            className={`playlist-video-row ${nowPlayingIndex === i ? 'now-playing' : ''}`}
                            onClick={() => playVideoFromPlaylist(video, i)}
                          >
                            <div className="playlist-video-num">
                              {nowPlayingIndex === i ? (
                                <span style={{ color: 'var(--accent-color)' }}>▶</span>
                              ) : i + 1}
                            </div>
                            <div className="playlist-video-thumb">
                              <img src={video.thumbnail} alt={video.title} />
                              <div className="duration-badge" style={{ bottom: 4, right: 4, fontSize: '0.7rem' }}>{formatDuration(video.duration)}</div>
                              {watchProgress[video.id] > 0 && <div className="watch-progress-bar" style={{ width: `${watchProgress[video.id]}%` }} />}
                            </div>
                            <div className="playlist-video-info">
                              <div className="video-title" style={{ fontSize: '0.9rem', WebkitLineClamp: 2, color: nowPlayingIndex === i ? 'var(--accent-color)' : undefined }}>{video.title}</div>
                              <div className="video-meta" style={{ marginTop: '0.3rem' }}>{video.uploader} • {formatViews(video.view_count)}</div>
                            </div>
                            <button
                              className="watch-btn"
                              style={{ flexShrink: 0, marginLeft: 'auto' }}
                              onClick={(e) => { e.stopPropagation(); playVideoFromPlaylist(video, i); }}
                              title="Putar"
                            >
                              <PlaySquare size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {isLoadingPlaylistVideos && (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', gap: '0.75rem', alignItems: 'center' }}>
                        <div className="spinner" /> <span style={{ color: 'var(--text-secondary)' }}>Memuat video…</span>
                      </div>
                    )}
                    {!isLoadingPlaylistVideos && playlistDetailHasMore && playlistDetailVideos.length > 0 && (
                      <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                        <button className="action-btn" style={{ margin: '0 auto' }} onClick={() => loadPlaylistVideos(activePlaylistDetail, false)}>
                          Muat Lebih Banyak
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Playlist grid list */
                  <div className="channel-videos-grid">
                    {isLoadingPlaylists ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', gap: '0.75rem', alignItems: 'center' }}>
                        <div className="spinner" /> <span style={{ color: 'var(--text-secondary)' }}>Memuat playlist…</span>
                      </div>
                    ) : channelPlaylists.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                        <ListMusic size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
                        <p>Tidak ada playlist ditemukan</p>
                      </div>
                    ) : (
                      <div className="video-grid">
                        {channelPlaylists.map((pl: any, i: number) => (
                          <div
                            key={`pl-${pl.id || i}`}
                            className="video-card playlist-card"
                            onClick={() => loadPlaylistVideos({ id: pl.id, title: pl.title || pl.Title || 'Playlist', url: pl.url || pl.URL || `https://www.youtube.com/playlist?list=${pl.id}`, thumbnail: pl.thumbnail || pl.Thumbnail || '' }, true)}
                          >
                            <div className="thumbnail-container" style={{ position: 'relative' }}>
                              {pl.thumbnail || pl.Thumbnail ? (
                                <img src={pl.thumbnail || pl.Thumbnail} alt={pl.title} className="thumbnail" />
                              ) : (
                                <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <ListMusic size={36} style={{ opacity: 0.3 }} />
                                </div>
                              )}
                              {/* Playlist count overlay */}
                              <div style={{
                                position: 'absolute', right: 0, top: 0, bottom: 0, width: '35%',
                                background: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                                backdropFilter: 'blur(2px)'
                              }}>
                                <ListMusic size={18} color="white" />
                                <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 700 }}>
                                  {pl.VideoCount || pl.playlist_count || '?'}
                                </span>
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem' }}>video</span>
                              </div>
                            </div>
                            <div className="video-info">
                              <div className="video-title">{pl.title || pl.Title || 'Playlist'}</div>
                              <div className="video-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                                <span>{pl.VideoCount || pl.playlist_count || 0} video</span>
                                <span style={{ opacity: 0.6 }}>• Klik untuk lihat</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              ) : (
                /* Video grid for all other tabs */
                <div className="channel-videos-grid">
                  {channelVideos.length === 0 && !isLoadingChannel ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                      <PlaySquare size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                      <p>Belum ada video yang dimuat</p>
                    </div>
                  ) : (
                    <div className="video-grid">
                      {channelVideos.map((video: any, i: number) => (
                        <div className="video-card" key={`ch-${video.id}-${i}`} onClick={() => playVideo(video)}>
                          <div className="thumbnail-container">
                            <img src={video.thumbnail} alt={video.title} className="thumbnail" />
                            <div className="duration-badge">{formatDuration(video.duration)}</div>
                            {watchProgress[video.id] > 0 && <div className="watch-progress-bar" style={{ width: `${watchProgress[video.id]}%` }} />}
                          </div>
                          <div className="video-info">
                            <div className="video-title">{video.title}</div>
                            <div className="video-meta">{formatViews(video.view_count)} penonton</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isLoadingChannel && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', gap: '0.75rem', alignItems: 'center' }}>
                      <div className="spinner" />
                      <span style={{ color: 'var(--text-secondary)' }}>Memuat…</span>
                    </div>
                  )}

                  {!isLoadingChannel && channelHasMore && channelVideos.length > 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <button className="action-btn" style={{ margin: '0 auto' }} onClick={() => loadChannel(activeChannel.url, false)}>
                        Muat Lebih Banyak
                      </button>
                    </div>
                  )}
                  {!isLoadingChannel && !channelHasMore && channelVideos.length > 0 && (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      ✓ Semua video sudah ditampilkan
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Settings View */}
        {activeTab === 'settings' && (
          <div className="settings-container">
            <h2 className="section-title" style={{ padding: '0 0 1rem 0', border: 'none' }}>
              <Settings className="mr-2" size={24} /> Pengaturan Akun & Anti-Limit
            </h2>

            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogIn size={20} style={{ color: 'var(--accent-color)' }} />
                Sinkronisasi YouTube Otomatis (via Cookie)
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Pilih browser utama Anda di bawah ini! Aplikasi akan membaca sesi aktif YouTube Anda secara aman untuk:
                <br />1. Melewati batasan limit kecepatan atau captcha dari YouTube.
                <br />2. Mencatat otomatis setiap video yang ditonton di aplikasi ini ke <b>Watch History asli YouTube Anda</b>.
              </p>
              <select
                value={cookieBrowser}
                onChange={handleCookieBrowserChange}
                style={{
                  background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', padding: '0.75rem', borderRadius: '8px', width: '100%', maxWidth: '300px', cursor: 'pointer', outline: 'none'
                }}
              >
                <option value="none">Jangan Gunakan Cookie</option>
                <option value="chrome">Google Chrome</option>
                <option value="edge">Microsoft Edge</option>
                <option value="firefox">Mozilla Firefox</option>
                <option value="brave">Brave</option>
                <option value="opera">Opera</option>
              </select>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Download size={20} style={{ color: 'var(--accent-color)' }} />
                Media Engine & Downloader
              </h3>
              <div className="setting-item" style={{ border: 'none', padding: 0 }}>
                <div className="setting-info">
                  <h4>Auto Update Core Component</h4>
                  <p>Automatically update core engine when YouDesk starts.</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={autoUpdate} onChange={toggleAutoUpdate} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <div className="setting-item" style={{ marginTop: '2rem' }}>
              <div className="setting-info">
                <h4>Clear History</h4>
                <p>Remove all videos from your watch history.</p>
              </div>
              <button
                className="action-btn danger"
                onClick={() => { setHistory([]); localStorage.removeItem('ytHistory'); }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Playlists Main View */}
        {activeTab === 'playlists' && activePlaylistId === null && (
          <div>
            <div className="section-title">Your Playlists</div>
            <div className="video-grid" style={{ padding: '2rem' }}>
              <div className="playlist-card create-playlist-card" onClick={() => { setPlayingVideo(null); setShowPlaylistModal(true); }}>
                <Plus size={32} />
                <div className="playlist-title" style={{ marginTop: '1rem' }}>Create New Playlist</div>
              </div>
              {playlists.map(p => (
                <div className="playlist-card" key={p.id} onClick={() => setActivePlaylistId(p.id)} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    height: '120px',
                    background: p.videos.length > 0 ? `url(${p.videos[0].thumbnail}) center/cover` : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {p.videos.length === 0 && <ListMusic size={32} color="rgba(255,255,255,0.2)" />}
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <div className="playlist-title">{p.name}</div>
                      <div className="playlist-meta">{p.videos.length} videos</div>
                    </div>
                    <div style={{ alignSelf: 'flex-end', marginTop: '1rem' }}>
                      <button className="action-btn danger" onClick={(e) => { e.stopPropagation(); deletePlaylist(p.id); }}>
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Playlist Detail View */}
        {activeTab === 'playlists' && activePlaylistId !== null && (
          <div>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button className="action-btn" onClick={() => setActivePlaylistId(null)}>
                <ArrowLeft size={16} /> Back
              </button>
              {playlists.find(p => p.id === activePlaylistId)?.name}
            </div>
            {playlists.find(p => p.id === activePlaylistId)?.videos.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>This playlist is empty.</div>
            ) : (
              <div className="video-grid">
                {playlists.find(p => p.id === activePlaylistId)?.videos.map((v: any, i: number) => (
                  <div className="video-card" key={i} onClick={() => playVideo(v)}>
                    <div className="thumbnail-container">
                      <img src={v.thumbnail} alt={v.title} className="thumbnail" />
                      <div className="duration-badge">{formatDuration(v.duration)}</div>
                      {watchProgress[v.id] > 0 && <div className="watch-progress-bar" style={{ width: `${watchProgress[v.id]}%` }} />}
                    </div>
                    <div className="video-info">
                      <div className="video-title">{v.title}</div>
                      <div className="video-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <span>{v.uploader}</span>
                        <button className="action-btn danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={(e) => { e.stopPropagation(); removeFromPlaylist(activePlaylistId, v.id); }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className="section-title">Watch History</div>
            {history.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No history available.</div>
            ) : (
              <div className="video-grid">
                {history.map((v, i) => (
                  <div className="video-card" key={i} onClick={() => playVideo(v)}>
                    <div className="thumbnail-container">
                      <img src={v.thumbnail} alt={v.title} className="thumbnail" />
                      <div className="duration-badge">{formatDuration(v.duration)}</div>
                      {watchProgress[v.id] > 0 && <div className="watch-progress-bar" style={{ width: `${watchProgress[v.id]}%` }} />}
                    </div>
                    <div className="video-info">
                      <div className="video-title">{v.title}</div>
                      <div className="video-meta">
                        {v.uploader} • {formatViews(v.view_count)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(activeTab === 'home' || activeTab === 'trending') && (
          <>
            {errorMsg && (
              <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#ff4d4f' }}>
                <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                <h3>Failed to load videos</h3>
                <p style={{ maxWidth: '600px', textAlign: 'center', marginTop: '1rem' }}>{errorMsg}</p>
              </div>
            )}

            {!errorMsg && (
              <div className="video-grid">
                {videos.map((v, i) => (
                  <div className="video-card" key={i} onClick={() => playVideo(v)}>
                    <div className="thumbnail-container">
                      <img src={v.thumbnail} alt={v.title} className="thumbnail" />
                      <div className="duration-badge">{formatDuration(v.duration)}</div>
                      {watchProgress[v.id] > 0 && <div className="watch-progress-bar" style={{ width: `${watchProgress[v.id]}%` }} />}
                    </div>
                    <div className="video-info">
                      <div className="video-title">{v.title}</div>
                      <div className="video-meta">
                        {v.uploader} • {formatViews(v.view_count)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loading && !errorMsg && (
              <div className="loader-container" style={{ padding: '2rem' }}>
                <div className="spinner"></div>
              </div>
            )}
          </>
        )}

        {/* Downloads Page */}
        {activeTab === 'downloads' && (
          <DownloadsView
            downloadTasks={downloadTasks} setDownloadTasks={setDownloadTasks}
            mp3Queue={mp3Queue} setMp3Queue={setMp3Queue}
            mp3Index={mp3Index} setMp3Index={setMp3Index}
            mp3Playing={mp3Playing} setMp3Playing={setMp3Playing}
            mp3CurrentTime={mp3CurrentTime} mp3Duration={mp3Duration}
            mp3Loop={mp3Loop} setMp3Loop={setMp3Loop}
            mp3Shuffle={mp3Shuffle} setMp3Shuffle={setMp3Shuffle}
            mp3Volume={mp3Volume} setMp3Volume={setMp3Volume}
            mp3Muted={mp3Muted} setMp3Muted={setMp3Muted}
            audioRef={audioRef} formatDuration={formatDuration}
            setPlayingVideo={setPlayingVideo}
          />
        )}
      </div>

      {/* Invisible Audio Element for MP3 Player */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setMp3CurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setMp3Duration(e.currentTarget.duration)}
        onEnded={() => {
          if (mp3Loop) {
            if (audioRef.current) audioRef.current.play();
          } else {
            if (mp3Shuffle) {
              const ni = Math.floor(Math.random() * mp3Queue.length);
              setMp3Index(ni);
              if (audioRef.current) { audioRef.current.src = 'http://127.0.0.1:34567/media?path=' + encodeURIComponent(mp3Queue[ni]?.savePath || ''); audioRef.current.play(); }
            } else if (mp3Index < mp3Queue.length - 1) {
              const ni = mp3Index + 1;
              setMp3Index(ni);
              if (audioRef.current) { audioRef.current.src = 'http://127.0.0.1:34567/media?path=' + encodeURIComponent(mp3Queue[ni]?.savePath || ''); audioRef.current.play(); }
            } else {
              setMp3Playing(false);
            }
          }
        }}
        onPlay={() => setMp3Playing(true)}
        onPause={() => setMp3Playing(false)}
      />

      {/* Video Player Overlay */}
      {playingVideo && (
        <div
          className={`global-player ${isMiniPlayer ? 'mini-mode' : 'full-mode glass-panel'}`}
          style={isMiniPlayer ? { transform: `translate(${miniPos.x}px, ${miniPos.y}px)`, transition: isDragging ? 'none' : 'transform 0.1s' } : {}}
        >
          {!isMiniPlayer && (
            <div className="player-header glass-panel">
              <button className="back-btn" onClick={() => setIsMiniPlayer(true)}>
                <ArrowLeft size={20} style={{ transform: 'rotate(-90deg)' }} /> Minimize
              </button>
            </div>
          )}

          {isMiniPlayer && (
            <div
              className="mini-player-controls"
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <button className="mini-btn" onClick={() => { setMiniPos({ x: 0, y: 0 }); setIsMiniPlayer(false); }} title="Expand">
                <ArrowLeft size={16} style={{ transform: 'rotate(90deg)' }} />
              </button>
              <button className="mini-btn" onClick={() => { setPlayingVideo(null); setIsMiniPlayer(false); setMiniPos({ x: 0, y: 0 }); }} title="Close">
                <X size={16} />
              </button>
            </div>
          )}

            <div className="player-content" onScroll={handlePlayerScroll}>
              {/* Left Column: Video and Details */}
              <div className="watch-main">
                <div className="video-wrapper">
                  {playingVideo.isLocalMp4 ? (
                    <video 
                      src={'http://127.0.0.1:34567/media?path=' + encodeURIComponent(playingVideo.savePath)}
                      controls
                      autoPlay
                      style={{ width: '100%', height: '100%', outline: 'none', backgroundColor: '#000' }}
                    />
                  ) : (
                    <YouTube
                      videoId={playingVideo.id}
                      opts={{
                        width: '100%',
                        height: '100%',
                        playerVars: { autoplay: 1, rel: 0, modestbranding: 1 }
                      }}
                      onReady={(e: any) => { ytPlayerRef.current = e.target; }}
                      iframeClassName="video-element"
                      style={{ width: '100%', height: '100%' }}
                    />
                  )}
                </div>

              {!isMiniPlayer && (
                <>
                  <div className="watch-title">{playingVideo.title}</div>

                  <div className="watch-stats-row">
                    <div
                      className="watch-channel-info"
                      onClick={() => openChannel(playingVideo.uploader, videoDetails?.channel_url || '')}
                      style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      {videoDetails?.channel_id ? (
                        <img
                          src={`https://unavatar.io/youtube/${videoDetails.channel_id}?fallback=false`}
                          alt="Avatar"
                          className="channel-avatar"
                          onError={(e) => { (e.target as any).style.display = 'none'; (e.target as any).nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div className="channel-avatar" style={{ display: videoDetails?.channel_id ? 'none' : 'flex' }}>
                        {playingVideo.uploader?.substring(0, 1).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{playingVideo.uploader}</span>
                      </div>
                    </div>

                    <div className="watch-actions">
                      <button className="watch-btn">
                        <ThumbsUp size={18} /> {videoDetails?.like_count ? formatViews(videoDetails.like_count) : 'Like'}
                      </button>
                      <button className="watch-btn" onClick={() => {
                        navigator.clipboard.writeText(`https://youtu.be/${playingVideo.id}`);
                        addToast('Link disalin ke clipboard!');
                      }}>
                        <Share2 size={18} /> Share
                      </button>
                      <button className="watch-btn" onClick={() => setShowPlaylistModal(true)}>
                        <FolderPlus size={18} /> Save
                      </button>
                      <button className="watch-btn" onClick={() => setShowDownloadModal(true)}>
                        <Download size={18} /> Download
                      </button>
                    </div>
                  </div>

                  <div className={`description-box ${descExpanded ? 'expanded' : ''}`} onClick={() => setDescExpanded(!descExpanded)}>
                    <div className="description-stats">
                      {formatViews(videoDetails?.view_count || playingVideo.view_count)} • {formatDate(videoDetails?.upload_date)}
                    </div>
                    {videoDetails?.description ? (
                      <div className="description-text">{videoDetails.description}</div>
                    ) : (
                      <div className="description-text" style={{ opacity: 0.5 }}>
                        {isLoadingDetails ? 'Loading description...' : 'No description available.'}
                      </div>
                    )}
                  </div>

                  {/* Comments Section Mock */}
                  <div className="comments-section">
                    <div className="section-title" style={{ padding: 0, marginBottom: '1.5rem', border: 'none' }}>Comments</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.5 }}>
                      <MessageSquare size={24} />
                      <span>Comments are loading or restricted to native app...</span>
                    </div>
                  </div>

                  {/* Related Videos when Playing a Playlist (moved below comments) */}
                  {nowPlayingPlaylist && (
                    <div className="below-comments-related-videos" style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                      <div className="section-title" style={{ padding: 0, marginBottom: '1.5rem', border: 'none' }}>Video Terkait</div>

                      <div className="chips-wrapper" style={{ marginBottom: '1.5rem' }}>
                        <button className="chips-scroll-btn left" onClick={() => scrollChips('left')}>
                          <ChevronLeft size={20} />
                        </button>
                        <div className="chips-container" ref={chipsRef}>
                          {['Semua', 'Dari Channel', 'Terkait', 'Baru diupload', 'Untuk Anda'].map(chip => (
                            <button
                              key={chip}
                              className={`filter-chip ${activeChip === chip ? 'active' : ''}`}
                              onClick={() => handleChipClick(chip)}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                        <button className="chips-scroll-btn right" onClick={() => scrollChips('right')}>
                          <ChevronRight size={20} />
                        </button>
                      </div>

                      <div className="video-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                        {isLoadingDetails ? (
                          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                            <Loader2 className="spinner" size={32} />
                          </div>
                        ) : relatedVideos.map((v, i) => (
                          <div className="video-card" key={i} onClick={() => playVideo(v)}>
                            <div className="thumbnail-container">
                              <img src={v.thumbnail} alt={v.title} className="thumbnail" />
                              <div className="duration-badge">{formatDuration(v.duration)}</div>
                              {watchProgress[v.id] > 0 && <div className="watch-progress-bar" style={{ width: `${watchProgress[v.id]}%` }} />}
                            </div>
                            <div className="video-info">
                              <div className="video-title" style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>{v.title}</div>
                              <div className="video-meta">{v.uploader}</div>
                              <div className="video-meta">{formatViews(v.view_count)}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {isLoadingRelated && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                          <Loader2 className="spinner" size={24} />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Column: Playlist Panel or Related Videos */}
            {!isMiniPlayer && (
              <div className="watch-sidebar">
                {nowPlayingPlaylist ? (
                  /* === PLAYLIST PANEL === */
                  <div className="playlist-watch-panel">
                    {/* Panel Header */}
                    <div className="playlist-watch-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                        <ListMusic size={18} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {nowPlayingPlaylist.title}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                            {nowPlayingIndex + 1} / {nowPlayingPlaylist.videos.length} video
                          </div>
                        </div>
                      </div>
                      {/* Prev / Next */}
                      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                        <button
                          className="watch-btn"
                          style={{ padding: '0.35rem 0.6rem' }}
                          disabled={nowPlayingIndex <= 0}
                          onClick={() => navigatePlaylist(-1)}
                          title="Video Sebelumnya"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          className="watch-btn"
                          style={{ padding: '0.35rem 0.6rem' }}
                          disabled={nowPlayingIndex >= nowPlayingPlaylist.videos.length - 1}
                          onClick={() => navigatePlaylist(1)}
                          title="Video Berikutnya"
                        >
                          <ChevronRight size={18} />
                        </button>
                        <button
                          className="watch-btn"
                          style={{ padding: '0.35rem 0.6rem' }}
                          onClick={() => { setNowPlayingPlaylist(null); setNowPlayingIndex(-1); }}
                          title="Tutup Playlist"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="playlist-watch-progress">
                      <div
                        className="playlist-watch-progress-fill"
                        style={{ width: `${nowPlayingPlaylist.videos.length > 0 ? ((nowPlayingIndex + 1) / nowPlayingPlaylist.videos.length) * 100 : 0}%` }}
                      />
                    </div>

                    {/* Video list */}
                    <div className="playlist-watch-list" ref={playlistSidebarRef}>
                      {nowPlayingPlaylist.videos.map((v: any, i: number) => {
                        const isActive = i === nowPlayingIndex;
                        return (
                          <div
                            key={`pws-${v.id}-${i}`}
                            className={`playlist-sidebar-item ${isActive ? 'active' : ''}`}
                            onClick={() => playVideoFromPlaylist(v, i)}
                          >
                            <div className="playlist-sidebar-num">
                              {isActive ? <PlaySquare size={14} style={{ color: 'var(--accent-color)' }} /> : i + 1}
                            </div>
                            <div className="playlist-sidebar-thumb">
                              <img src={v.thumbnail} alt={v.title} />
                              <div className="duration-badge" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>{formatDuration(v.duration)}</div>
                              {watchProgress[v.id] > 0 && <div className="watch-progress-bar" style={{ width: `${watchProgress[v.id]}%`, height: '2px' }} />}
                            </div>
                            <div className="playlist-sidebar-info">
                              <div className="playlist-sidebar-title">{v.title}</div>
                              <div className="playlist-sidebar-meta">{v.uploader} • {formatViews(v.view_count)}</div>
                            </div>
                          </div>
                        );
                      })}
                      {/* Load more if needed */}
                      {playlistDetailHasMore && !isLoadingPlaylistVideos && activePlaylistDetail && (
                        <div style={{ textAlign: 'center', padding: '0.75rem' }}>
                          <button className="action-btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                            onClick={() => loadPlaylistVideos(activePlaylistDetail, false)}>
                            Muat lebih banyak
                          </button>
                        </div>
                      )}
                      {isLoadingPlaylistVideos && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem' }}>
                          <div className="spinner" style={{ width: 20, height: 20 }} />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* === NORMAL RELATED SIDEBAR === */
                  <>
                    <div className="chips-wrapper">
                      <button className="chips-scroll-btn left" onClick={() => scrollChips('left')}>
                        <ChevronLeft size={20} />
                      </button>
                      <div className="chips-container" ref={chipsRef}>
                        {['Semua', 'Dari Channel', 'Terkait', 'Baru diupload', 'Untuk Anda'].map(chip => (
                          <button
                            key={chip}
                            className={`filter-chip ${activeChip === chip ? 'active' : ''}`}
                            onClick={() => handleChipClick(chip)}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                      <button className="chips-scroll-btn right" onClick={() => scrollChips('right')}>
                        <ChevronRight size={20} />
                      </button>
                    </div>

                    <div className="related-videos-list">
                      {isLoadingDetails ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                          <Loader2 className="spinner" size={32} />
                        </div>
                      ) : relatedVideos.map((v, i) => (
                        <div className="related-video-card" key={i} onClick={() => playVideo(v)}>
                          <div className="thumbnail-container">
                            <img src={v.thumbnail} alt={v.title} className="thumbnail" />
                            <div className="duration-badge">{formatDuration(v.duration)}</div>
                            {watchProgress[v.id] > 0 && <div className="watch-progress-bar" style={{ width: `${watchProgress[v.id]}%` }} />}
                          </div>
                          <div className="video-info">
                            <div className="video-title">{v.title}</div>
                            <div className="video-meta">{v.uploader}</div>
                            <div className="video-meta">{formatViews(v.view_count)}</div>
                          </div>
                        </div>
                      ))}
                      {isLoadingRelated && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                          <Loader2 className="spinner" size={24} />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Save to Playlist Modal */}
      {showPlaylistModal && (
        <div className="modal-overlay" onClick={() => setShowPlaylistModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {playingVideo ? 'Save to Playlist' : 'Create Playlist'}
              <X className="modal-close" onClick={() => setShowPlaylistModal(false)} />
            </div>

            {playingVideo && playlists.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Add to existing:</div>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {playlists.map(p => {
                    const isAdded = p.videos.some((v: any) => v.id === playingVideo.id);
                    return (
                      <div className="playlist-list-item" key={p.id} onClick={() => !isAdded && addToPlaylist(p.id)} style={{ opacity: isAdded ? 0.5 : 1, cursor: isAdded ? 'default' : 'pointer' }}>
                        <span>{p.name}</span>
                        {isAdded && <span style={{ fontSize: '0.8rem' }}>Added</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Or create new:</div>
              <input
                type="text"
                className="new-playlist-input"
                placeholder="Playlist Name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                autoFocus
              />
              <button
                className="action-btn primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                onClick={createAndAddToPlaylist}
                disabled={!newPlaylistName.trim()}
              >
                Create {playingVideo ? '& Add' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="modal-overlay" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-header">
              <h3>Konfirmasi</h3>
              <button className="modal-close" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ margin: '1.5rem 0', lineHeight: 1.5 }}>
              <p>{confirmModal.message}</p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                style={{
                  background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flex: 1
                }}
              >
                Batal
              </button>
              <button
                onClick={confirmModal.onConfirm}
                style={{
                  background: 'var(--accent-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flex: 1
                }}
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Modal */}
      {showDownloadModal && videoDetails && (
        <div className="modal-overlay" onClick={() => setShowDownloadModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', backgroundColor: 'var(--bg-primary)', opacity: 1 }}>
            <div className="modal-header">
              <h3>Download Video</h3>
              <button className="modal-close" onClick={() => setShowDownloadModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1rem 0' }}>
              {downloadStatus && (
                <div style={{ padding: '1rem', background: 'var(--accent-color)', color: 'white', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
                  {downloadStatus}
                </div>
              )}
              <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>MP4 Video</h4>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {getUniqueVideoFormats(videoDetails.formats).map((f: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <div>
                      <strong>{f.resolution}</strong> {f.fps ? `@ ${f.fps}fps` : ''}
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>{f.acodec === 'none' ? '(HQ Video)' : '(Video + Audio)'}</span>
                    </div>
                    <button onClick={() => handleDownload(videoDetails.webpage_url || `https://youtu.be/${videoDetails.id}`, f.format_id, false)} style={{ background: 'var(--accent-color)', color: 'white', padding: '0.4rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                      Download
                    </button>
                  </div>
                ))}
              </div>

              <h4 style={{ marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>MP3 Audio</h4>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <div>
                    <strong>Best Audio Quality</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>Auto MP3</span>
                  </div>
                  <button onClick={() => handleDownload(videoDetails.webpage_url || `https://youtu.be/${videoDetails.id}`, "bestaudio", true)} style={{ background: 'var(--accent-color)', color: 'white', padding: '0.4rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    Download
                  </button>
                </div>
                {getUniqueAudioFormats(videoDetails.formats).map((f: any, i: number) => (
                  <div key={`audio-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <div>
                      <strong>~{Math.round(f.abr || 0)} kbps</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>MP3 Format</span>
                    </div>
                    <button onClick={() => handleDownload(videoDetails.webpage_url || `https://youtu.be/${videoDetails.id}`, f.format_id, true)} style={{ background: 'var(--accent-color)', color: 'white', padding: '0.4rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">{t.message}</div>
        ))}
      </div>
    </div>
  );
}

export default App;
