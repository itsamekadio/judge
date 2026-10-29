import React, { useState, useEffect, useRef } from 'react';
import { extractYouTubeId } from '../lib/coursesService';
import { Play, AlertCircle } from 'lucide-react';

interface VideoPlayerProps {
  youtubeId: string;
  title?: string;
  autoPlay?: boolean;
  onCompleted?: () => void;
  isCompleted?: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  youtubeId, 
  title, 
  autoPlay = false,
  onCompleted,
  isCompleted = false
}) => {
  const [hasStarted, setHasStarted] = useState(autoPlay);
  const cleanId = extractYouTubeId(youtubeId);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const hasTriggeredRef = useRef<boolean>(isCompleted);

  useEffect(() => {
    hasTriggeredRef.current = isCompleted;
  }, [isCompleted]);

  // Load YouTube IFrame Player API script if not already present
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize YT.Player when video has started
  useEffect(() => {
    if (!hasStarted || !cleanId) return;

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player(`yt-player-${cleanId}`, {
          events: {
            onStateChange: (event: any) => {
              // 0 = YT.PlayerState.ENDED
              if (event.data === 0) {
                if (!hasTriggeredRef.current && onCompleted) {
                  hasTriggeredRef.current = true;
                  onCompleted();
                }
              }
              // 1 = YT.PlayerState.PLAYING
              if (event.data === 1) {
                if (!intervalRef.current) {
                  intervalRef.current = setInterval(() => {
                    try {
                      if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
                        const current = playerRef.current.getCurrentTime();
                        const duration = playerRef.current.getDuration();
                        if (duration > 0 && (current / duration) >= 0.8) {
                          if (!hasTriggeredRef.current && onCompleted) {
                            hasTriggeredRef.current = true;
                            onCompleted();
                          }
                        }
                      }
                    } catch (e) {}
                  }, 1500);
                }
              } else {
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
                }
              }
            }
          }
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hasStarted, cleanId, onCompleted]);

  if (!cleanId) {
    return (
      <div className="w-full aspect-video bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
        <h3 className="text-lg font-bold text-slate-200 mb-1">معرّف الفيديو غير متوفر</h3>
        <p className="text-sm text-slate-400 max-w-md">
          لم يتم تحديد معرّف فيديو صالح لهذا الدرس. يرجى مراجعة لوحة التحكم للتأكد من معرّف يوتيوب.
        </p>
      </div>
    );
  }

  const embedUrl = `https://www.youtube-nocookie.com/embed/${cleanId}?enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=3${
    hasStarted ? '&autoplay=1' : ''
  }`;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group">
      {/* 16:9 aspect ratio container */}
      <div className="relative w-full aspect-video">
        {!hasStarted ? (
          // Custom Thumbnail Cover with Play Button
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-900">
            <img 
              src={`https://img.youtube.com/vi/${cleanId}/maxresdefault.jpg`} 
              alt={title || "Video preview"}
              className="absolute inset-0 w-full h-full object-cover opacity-40 blur-xs transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`;
              }}
            />
            
            {/* Play Button */}
            <button
              onClick={() => setHasStarted(true)}
              className="relative z-20 flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-xl shadow-sky-500/30 hover:scale-110 active:scale-95 transition-all duration-300"
              aria-label="تشغيل الفيديو"
            >
              <Play className="w-8 h-8 fill-current translate-x-0.5" />
            </button>

            {title && (
              <div className="relative z-20 mt-4 px-6 text-center">
                <span className="text-sm md:text-base font-bold text-slate-100 drop-shadow-md">
                  {title}
                </span>
              </div>
            )}
          </div>
        ) : (
          <iframe
            id={`yt-player-${cleanId}`}
            src={embedUrl}
            title={title || "YouTube video player"}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
      </div>

      {/* Video Footer Bar with Protection Notice */}
      <div className="bg-slate-900/95 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>بث فيديو مشفّر عالي الدقة (YouTube Unlisted HD)</span>
        </div>
        <span className="text-[11px] font-mono text-slate-500">منصة جادج • Eng. Abdelrahman Elkady</span>
      </div>
    </div>
  );
};
