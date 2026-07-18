import { useEffect, useRef, useState } from 'react';
import { Loader2, ExternalLink, RefreshCw } from 'lucide-react';

export default function JitsiVideoCall({ roomName, displayName, onClose }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const apiRef = useRef(null);
  const [retryCount, setRetryCount] = useState(0);

  // Store onClose callback in a ref to avoid triggering useEffect when it changes reference
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    let script = document.querySelector('script[src="https://meet.jit.si/external_api.js"]');
    
    // Set a timeout to show fallback if loading takes too long
    const timeoutId = setTimeout(() => {
      if (loading && !apiRef.current) {
        setError(true);
        setLoading(false);
      }
    }, 6000);

    const initJitsi = () => {
      if (!containerRef.current) return;
      
      clearTimeout(timeoutId);
      setLoading(false);
      setError(false);
      const domain = 'meet.jit.si';
      const options = {
        roomName: roomName || 'vetcloud-consultation-room',
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,
        userInfo: {
          displayName: displayName || 'User'
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true, // Prevent redirecting mobile web users to Jitsi app store
          toolbarButtons: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'chat', 'raisehand',
            'videoquality', 'filmstrip', 'tileview', 'videobackgroundblur',
            'shortcuts', 'mute-everyone'
          ]
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUEST: false,
          MOBILE_APP_PROMO: false,
          DEFAULT_BACKGROUND: '#0f172a'
        }
      };

      try {
        if (apiRef.current) {
          apiRef.current.dispose();
        }
        const api = new window.JitsiMeetExternalAPI(domain, options);
        apiRef.current = api;

        // Set listeners
        api.addEventListener('videoConferenceLeft', () => {
          if (onCloseRef.current) onCloseRef.current();
        });

        api.addEventListener('readyToClose', () => {
          if (onCloseRef.current) onCloseRef.current();
        });
      } catch (err) {
        console.error('Failed to initialize Jitsi:', err);
        setError(true);
      }
    };

    if (window.JitsiMeetExternalAPI) {
      initJitsi();
    } else if (script) {
      script.addEventListener('load', initJitsi);
    } else {
      script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = initJitsi;
      document.body.appendChild(script);
    }

    return () => {
      clearTimeout(timeoutId);
      if (script) {
        script.removeEventListener('load', initJitsi);
      }
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [retryCount]);

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    setRetryCount(prev => prev + 1);
  };

  const directLink = `https://meet.jit.si/${roomName || 'vetcloud-consultation-room'}`;

  return (
    <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-2xl min-h-[500px]">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4 bg-slate-950/85 z-10 backdrop-blur-sm">
          <Loader2 className="animate-spin text-green-500" size={48} />
          <p className="text-slate-400 font-semibold text-lg animate-pulse">Establishing Live Connection...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 bg-slate-950/90 z-20 space-y-6 text-center animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center">
            <ExternalLink size={32} />
          </div>
          <div className="max-w-md space-y-2">
            <h4 className="text-xl font-bold">Connection Issue</h4>
            <p className="text-sm text-slate-400">
              The embedded video conferencing window could not load. This can happen if browser extensions (like ad blockers) or network settings block Jitsi.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={directLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-green-950/30"
            >
              <ExternalLink size={18} />
              Open Call in New Tab
            </a>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw size={18} />
              Retry Connection
            </button>
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full flex-1" style={{ display: error ? 'none' : 'block' }} />
    </div>
  );
}
