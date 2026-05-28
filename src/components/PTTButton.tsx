/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Radio, Volume2, Square } from 'lucide-react';

interface Props {
  onVoiceRecorded: (base64Audio: string, durationSec: number) => void;
  emergencyMode: boolean;
}

export default function PTTButton({ onVoiceRecorded, emergencyMode }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micLevel, setMicLevel] = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopAllClips();
    };
  }, []);

  const stopAllClips = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const playChirp = (type: 'start' | 'stop') => {
    // Generate a beautiful, immersive mechanical military transceiver frequency sound offline using Web Audio API
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'start') {
        // High frequency double pip chirp
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
        
        osc.start();
        setTimeout(() => {
          osc.stop();
          ctx.close();
        }, 150);
      } else {
        // Falling low frequency static burst
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        
        osc.start();
        setTimeout(() => {
          osc.stop();
          ctx.close();
        }, 300);
      }
    } catch (e) {
      console.warn("Audio Context chirp failure:", e);
    }
  };

  const startPTT = async () => {
    playChirp('start');
    setIsRecording(true);
    setRecordingSeconds(0);
    setMicLevel([]);
    audioChunksRef.current = [];

    // Simulate sound wave elements
    timerRef.current = setInterval(() => {
      setRecordingSeconds(prev => {
        if (prev >= 15) { // Cap at 15 seconds
          stopPTT();
          return 15;
        }
        return prev + 1;
      });

      // Simple voice animation mock
      const bars = Array.from({ length: 12 }, () => Math.floor(Math.random() * 80) + 20);
      setMicLevel(bars);
    }, 1000);

    // Attempt real Web Audio API query if permissions are active
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Return simulated or actual base64 audio
          onVoiceRecorded(base64data, recordingSeconds || 4);
        };
        // Close tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
    } catch (err) {
      console.warn("Microphone not available or allowed. Reverting to high-fidelity simulated backup voice notes overlay.");
    }
  };

  const stopPTT = () => {
    if (!isRecording) return;
    playChirp('stop');
    setIsRecording(false);
    stopAllClips();

    // If real recorder is active, it handles callback, else we simulate
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Offline fallback: generate fake walkie talkie recording
      const finalSec = recordingSeconds || 3;
      onVoiceRecorded(`MOCK_VOICE_BASE64_SEC_${finalSec}`, finalSec);
    }
  };

  return (
    <div 
      id="ptt-walkie-talkie-block"
      className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 ${
        emergencyMode 
          ? 'bg-black border-red-950 text-zinc-300' 
          : 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800 text-slate-100 shadow-xl'
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">
        <Radio className={`w-4 h-4 ${isRecording ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`} />
        <span>Decentralized Transceiver [CH-12]</span>
      </div>

      {isRecording ? (
        <div className="w-full flex flex-col items-center gap-3">
          {/* Animated Waveform */}
          <div className="flex items-end justify-center gap-1 h-12 w-full max-w-sm px-4">
            {micLevel.length > 0 ? (
              micLevel.map((level, i) => (
                <div
                  key={i}
                  className="bg-emerald-500 rounded-full w-2"
                  style={{ height: `${level}%`, transition: 'height 0.2s ease-in-out' }}
                />
              ))
            ) : (
              // Seed placeholder bars
              Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-emerald-500 rounded-full w-2 animate-bounce"
                  style={{ height: '30%', animationDelay: `${i * 0.08}s` }}
                />
              ))
            )}
          </div>
          
          <div className="text-sm font-semibold text-red-500 animate-pulse flex items-center gap-1.5 font-mono">
            <span>● TRANSMITTING PTT...</span>
            <span>{String(recordingSeconds).padStart(2, '0')}s</span>
          </div>

          <button
            id="stop-ptt-recording-btn"
            onClick={stopPTT}
            className="bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center gap-2 px-6 py-2 rounded-full font-bold shadow-md text-sm transition-transform cursor-pointer"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>RELEASE TO BROADCAST</span>
          </button>
        </div>
      ) : (
        <div className="text-center flex flex-col items-center gap-3">
          <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
            Press and hold to broadcast high-fidelity walkie-talkie packets over Bluetooth/Wi-Fi mesh nodes.
          </p>

          <button
            id="start-ptt-recording-btn"
            onMouseDown={startPTT}
            onMouseUp={stopPTT}
            onMouseLeave={stopPTT}
            onTouchStart={(e) => { e.preventDefault(); startPTT(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopPTT(); }}
            className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 select-none cursor-pointer transition-all active:scale-90 ${
              emergencyMode 
                ? 'bg-zinc-900 border-red-950 text-red-500 hover:bg-zinc-800' 
                : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-900 text-white shadow-lg shadow-emerald-500/10'
            }`}
          >
            <Mic className="w-8 h-8 animate-pulse" />
            <span className="text-[10px] font-bold mt-1 tracking-widest">PTT</span>
          </button>
          
          <div className="text-[10px] text-zinc-500 font-mono">
            Simulates dynamic multi-hop routing packets
          </div>
        </div>
      )}
    </div>
  );
}
