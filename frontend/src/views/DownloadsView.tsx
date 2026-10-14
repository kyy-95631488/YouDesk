import React from 'react';
import { Download, Music, Play, Pause, X, Shuffle, SkipBack, SkipForward, Repeat, Volume2, VolumeX, Trash2, ExternalLink, Video } from 'lucide-react';
import { DeleteFile, OpenFileExternally } from '../../wailsjs/go/main/App';

interface DownloadsViewProps {
  downloadTasks: Record<string, any>;
  setDownloadTasks: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  mp3Queue: any[];
  setMp3Queue: React.Dispatch<React.SetStateAction<any[]>>;
  mp3Index: number;
  setMp3Index: React.Dispatch<React.SetStateAction<number>>;
  mp3Playing: boolean;
  setMp3Playing: React.Dispatch<React.SetStateAction<boolean>>;
  mp3CurrentTime: number;
  mp3Duration: number;
  mp3Loop: boolean;
  setMp3Loop: React.Dispatch<React.SetStateAction<boolean>>;
  mp3Shuffle: boolean;
  setMp3Shuffle: React.Dispatch<React.SetStateAction<boolean>>;
  mp3Volume: number;
  setMp3Volume: React.Dispatch<React.SetStateAction<number>>;
  mp3Muted: boolean;
  setMp3Muted: React.Dispatch<React.SetStateAction<boolean>>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  formatDuration: (sec: number) => string;
  setPlayingVideo: React.Dispatch<React.SetStateAction<any | null>>;
}

const getLocalUrl = (path: string) => {
  if (!path) return '';
  return 'http://127.0.0.1:34567/media?path=' + encodeURIComponent(path);
};

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  downloadTasks, setDownloadTasks,
  mp3Queue, setMp3Queue,
  mp3Index, setMp3Index,
  mp3Playing, setMp3Playing,
  mp3CurrentTime, mp3Duration,
  mp3Loop, setMp3Loop,
  mp3Shuffle, setMp3Shuffle,
  mp3Volume, setMp3Volume,
  mp3Muted, setMp3Muted,
  audioRef, formatDuration, setPlayingVideo
}) => {
  return (
    <div className="downloads-page">
      <div className="downloads-layout">
        {/* Left: Task list */}
        <div className="downloads-list-panel">
          <div className="downloads-list-header">
            <Download size={20} style={{ color: 'var(--accent-color)' }} />
            <span>Downloads</span>
            <span className="downloads-count-chip">{Object.keys(downloadTasks).length}</span>
          </div>

          {Object.keys(downloadTasks).length === 0 ? (
            <div className="downloads-empty">
              <Download size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No downloads yet.</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Play a video and click Download.</p>
            </div>
          ) : (
            <div className="downloads-task-list">
              {Object.values(downloadTasks).map((task: any) => {
                const isAudio = task.isAudio;
                const isDone = task.status === 'completed';
                const isErr = task.status === 'error';
                const isDl = task.status === 'downloading';
                const isCurrentMp3 = isAudio && mp3Queue[mp3Index]?.id === task.id;

                return (
                  <div
                    key={task.id}
                    className={`download-task-card ${isCurrentMp3 ? 'mp3-active' : ''}`}
                  >
                    {/* Thumbnail */}
                    <div className="download-task-thumb">
                      {task.thumbnail ? (
                        <img src={task.thumbnail} alt={task.title} />
                      ) : (
                        <div className="download-task-thumb-placeholder">
                          {isAudio ? <Music size={24} style={{ opacity: 0.4 }} /> : <Download size={24} style={{ opacity: 0.4 }} />}
                        </div>
                      )}
                      {isAudio && isDone && (
                        <div className="download-thumb-type-badge">MP3</div>
                      )}
                      {!isAudio && isDone && (
                        <div className="download-thumb-type-badge" style={{ background: 'var(--accent-color)' }}>MP4</div>
                      )}
                      {isDl && (
                        <div className="download-thumb-overlay">
                          <div className="download-spinner-sm" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="download-task-info">
                      <div className="download-task-title">{task.title || 'Unknown'}</div>
                      {isDl && (
                        <>
                          <div className="download-task-progress-bar">
                            <div className="download-task-progress-fill" style={{ width: `${task.progress || 0}%` }} />
                          </div>
                          <div className="download-task-progress-text">{task.progressText}</div>
                        </>
                      )}
                      {isDone && (
                        <div className="download-task-status done">✓ Selesai</div>
                      )}
                      {isErr && (
                        <div className="download-task-status error">✕ Error: {task.error}</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="download-task-actions">
                      {!isAudio && isDone && task.savePath && (
                        <>
                          <button className="dl-action-btn play" title="Play in App" onClick={() => setPlayingVideo({ ...task, isLocalMp4: true, id: 'local_' + task.id, uploader: 'Local File' })}>
                            <Video size={16} />
                          </button>
                          <button className="dl-action-btn play" title="Play Externally" onClick={() => OpenFileExternally(task.savePath)}>
                            <ExternalLink size={16} />
                          </button>
                        </>
                      )}
                      {isAudio && isDone && task.savePath && (
                        <button
                          className="dl-action-btn play"
                          title={isCurrentMp3 && mp3Playing ? 'Pause' : 'Play'}
                          onClick={() => {
                            // Add to queue or play directly
                            const allAudio = Object.values(downloadTasks).filter((t: any) => t.isAudio && t.status === 'completed' && t.savePath);
                            setMp3Queue(allAudio as any[]);
                            const idx = (allAudio as any[]).findIndex((t: any) => t.id === task.id);
                            if (idx === mp3Index && audioRef.current) {
                              if (mp3Playing) audioRef.current.pause();
                              else audioRef.current.play();
                            } else {
                              setMp3Index(idx >= 0 ? idx : 0);
                              if (audioRef.current) {
                                audioRef.current.src = getLocalUrl(task.savePath);
                                audioRef.current.play();
                              }
                            }
                          }}
                        >
                          {isCurrentMp3 && mp3Playing ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                      )}
                      <button
                        className="dl-action-btn cancel"
                        onClick={() => {
                          if (isDone && task.savePath) DeleteFile(task.savePath);
                          setDownloadTasks(prev => {
                            const next = { ...prev };
                            delete next[task.id];
                            return next;
                          });
                          if (mp3Queue[mp3Index]?.id === task.id && audioRef.current) {
                            audioRef.current.pause();
                            setMp3Playing(false);
                          }
                        }}
                        title={isDone ? "Delete File & Task" : "Cancel"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: MP3 Player */}
        <div className="mp3-player-panel">
          {mp3Queue.length === 0 || mp3Index < 0 ? (
            <div className="mp3-player-idle">
              <div className="mp3-idle-disc">
                <Music size={48} style={{ opacity: 0.3 }} />
              </div>
              <p style={{ color: 'var(--text-secondary)', marginTop: '1.5rem', fontSize: '0.95rem' }}>Pilih MP3 untuk diputar</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.4rem' }}>Klik tombol ▶ pada file audio di atas</p>
            </div>
          ) : (() => {
            const currentTrack = mp3Queue[mp3Index];
            const progressPct = mp3Duration > 0 ? (mp3CurrentTime / mp3Duration) * 100 : 0;
            return (
              <div className="mp3-player">
                {/* Album Art */}
                <div className={`mp3-album-art ${mp3Playing ? 'spinning' : ''}`}>
                  {currentTrack?.thumbnail ? (
                    <img src={currentTrack.thumbnail} alt={currentTrack.title} />
                  ) : (
                    <div className="mp3-album-placeholder">
                      <Music size={52} style={{ opacity: 0.5 }} />
                    </div>
                  )}
                  <div className="mp3-album-vinyl" />
                </div>

                {/* Track Info */}
                <div className="mp3-track-info">
                  <div className="mp3-track-title">{currentTrack?.title || 'Unknown'}</div>
                  <div className="mp3-track-queue">
                    {mp3Index + 1} / {mp3Queue.length} · MP3
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mp3-progress-wrap">
                  <span className="mp3-time">{formatDuration(mp3CurrentTime)}</span>
                  <div
                    className="mp3-progress-track"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pct = (e.clientX - rect.left) / rect.width;
                      if (audioRef.current) audioRef.current.currentTime = pct * mp3Duration;
                    }}
                  >
                    <div className="mp3-progress-fill" style={{ width: `${progressPct}%` }}>
                      <div className="mp3-progress-knob" />
                    </div>
                  </div>
                  <span className="mp3-time">{formatDuration(mp3Duration)}</span>
                </div>

                {/* Controls */}
                <div className="mp3-controls">
                  <button
                    className={`mp3-ctrl-btn secondary ${mp3Shuffle ? 'active' : ''}`}
                    onClick={() => setMp3Shuffle(!mp3Shuffle)}
                    title="Shuffle"
                  >
                    <Shuffle size={18} />
                  </button>

                  <button
                    className="mp3-ctrl-btn"
                    disabled={!mp3Shuffle && mp3Index <= 0}
                    onClick={() => {
                      if (mp3Shuffle) {
                        const ni = Math.floor(Math.random() * mp3Queue.length);
                        setMp3Index(ni);
                        if (audioRef.current) { audioRef.current.src = getLocalUrl(mp3Queue[ni]?.savePath || ''); audioRef.current.play(); }
                      } else {
                        const ni = mp3Index - 1;
                        setMp3Index(ni);
                        if (audioRef.current) { audioRef.current.src = getLocalUrl(mp3Queue[ni]?.savePath || ''); audioRef.current.play(); }
                      }
                    }}
                    title="Previous"
                  >
                    <SkipBack size={22} />
                  </button>

                  <button
                    className="mp3-ctrl-btn play-pause"
                    onClick={() => {
                      if (!audioRef.current) return;
                      if (mp3Playing) audioRef.current.pause();
                      else audioRef.current.play();
                    }}
                    title={mp3Playing ? 'Pause' : 'Play'}
                  >
                    {mp3Playing ? <Pause size={28} /> : <Play size={28} />}
                  </button>

                  <button
                    className="mp3-ctrl-btn"
                    disabled={!mp3Shuffle && mp3Index >= mp3Queue.length - 1}
                    onClick={() => {
                      if (mp3Shuffle) {
                        const ni = Math.floor(Math.random() * mp3Queue.length);
                        setMp3Index(ni);
                        if (audioRef.current) { audioRef.current.src = getLocalUrl(mp3Queue[ni]?.savePath || ''); audioRef.current.play(); }
                      } else {
                        const ni = mp3Index + 1;
                        setMp3Index(ni);
                        if (audioRef.current) { audioRef.current.src = getLocalUrl(mp3Queue[ni]?.savePath || ''); audioRef.current.play(); }
                      }
                    }}
                    title="Next"
                  >
                    <SkipForward size={22} />
                  </button>

                  <button
                    className={`mp3-ctrl-btn secondary ${mp3Loop ? 'active' : ''}`}
                    onClick={() => { setMp3Loop(!mp3Loop); if (audioRef.current) audioRef.current.loop = !mp3Loop; }}
                    title="Loop"
                  >
                    <Repeat size={18} />
                  </button>
                </div>

                {/* Volume */}
                <div className="mp3-volume-row">
                  <button
                    className="mp3-vol-btn"
                    onClick={() => {
                      setMp3Muted(!mp3Muted);
                      if (audioRef.current) audioRef.current.muted = !mp3Muted;
                    }}
                  >
                    {mp3Muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={mp3Muted ? 0 : mp3Volume}
                    className="mp3-vol-slider"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setMp3Volume(val);
                      setMp3Muted(val === 0);
                      if (audioRef.current) { audioRef.current.volume = val; audioRef.current.muted = val === 0; }
                    }}
                  />
                </div>

                {/* Queue list */}
                {mp3Queue.length > 1 && (
                  <div className="mp3-queue">
                    <div className="mp3-queue-title">Queue ({mp3Queue.length})</div>
                    <div className="mp3-queue-list">
                      {mp3Queue.map((t: any, i: number) => (
                        <div
                          key={t.id}
                          className={`mp3-queue-item ${i === mp3Index ? 'active' : ''}`}
                          onClick={() => {
                            setMp3Index(i);
                            if (audioRef.current) { audioRef.current.src = getLocalUrl(t.savePath); audioRef.current.play(); }
                          }}
                        >
                          <div className="mp3-queue-num">
                            {i === mp3Index && mp3Playing ? <div className="mp3-eq-bar" /> : i + 1}
                          </div>
                          <div className="mp3-queue-name">{t.title || 'Track ' + (i + 1)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
