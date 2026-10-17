import React, { useState } from 'react';
import { extractYouTubeId } from '../lib/coursesService';
import { Play, AlertCircle, Maximize2 } from 'lucide-react';

interface VideoPlayerProps {
  youtubeId: string;
  title?: string;
  autoPlay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  youtubeId, 
  title, 
  autoPlay = false 
}) => {
  const [hasStarted, setHasStarted] = useState(autoPlay);
  const cleanId = extractYouTubeId(youtubeId);

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

  // Embed URL with required parameters: rel=0, modestbranding=1, iv_load_policy=3
  const embedUrl = `https://www.youtube-nocookie.com/embed/${cleanId}?rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1${
    hasStarted ? '&autoplay=1' : ''
  }`;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group">
      {/* 16:9 aspect ratio container */}
      <div className="relative w-full aspect-video">
        {!hasStarted ? (
          // Custom Sleek Thumbnail Cover
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-900">
            <img 
              src={`https://img.youtube.com/vi/${cleanId}/maxresdefault.jpg`} 
              alt={title || "Video preview"}
              className="absolute inset-0 w-full h-full object-cover opacity-40 blur-xs transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                // Fallback to hqdefault if maxresdefault doesn't exist
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
