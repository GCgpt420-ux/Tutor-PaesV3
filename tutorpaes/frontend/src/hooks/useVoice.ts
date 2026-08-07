'use client';

import { useState, useCallback, useRef } from 'react';

function extractApiErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;

  if (typeof p.detail === 'string' && p.detail.trim().length > 0) {
    return p.detail;
  }

  if (p.detail && typeof p.detail === 'object') {
    const detailObj = p.detail as Record<string, unknown>;
    if (typeof detailObj.detail === 'string' && detailObj.detail.trim().length > 0) {
      return detailObj.detail;
    }
    if (typeof detailObj.error === 'string' && detailObj.error.trim().length > 0) {
      return detailObj.error;
    }
  }

  if (typeof p.error === 'string' && p.error.trim().length > 0) {
    return p.error;
  }

  return null;
}

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speakWithBrowserFallback = useCallback(async (text: string): Promise<boolean> => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }

    return await new Promise<boolean>((resolve) => {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.95;
        utterance.pitch = 1;

        const voices = window.speechSynthesis.getVoices();
        const spanishVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('es'));
        const preferredVoice =
          spanishVoices.find((voice) => /google|microsoft|paulina|helena/i.test(voice.name)) ||
          spanishVoices[0];
        if (preferredVoice) {
          utterance.voice = preferredVoice;
          utterance.lang = preferredVoice.lang;
        }

        utterance.onend = () => {
          setIsPlaying(false);
          resolve(true);
        };
        utterance.onerror = () => {
          setIsPlaying(false);
          resolve(false);
        };
        setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsPlaying(false);
        resolve(false);
      }
    });
  }, []);

  // START RECORDING
  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determinar el mejor mimeType soportado por el navegador
      let options = {};
      if (typeof MediaRecorder !== 'undefined') {
        const mimeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/aac'];
        for (const type of mimeTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            options = { mimeType: type };
            break;
          }
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error al acceder al micrófono:', err);
      setError('No se pudo acceder al micrófono. Por favor revisa los permisos.');
    }
  }, []);

  // STOP RECORDING & TRANSCRIBE (STT)
  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return null;
    }

    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setIsRecording(false);
        setIsProcessing(true);

        try {
          // Mapear el mimeType a la extensión correspondiente para el backend
          let extension = 'webm';
          if (mimeType.includes('mp4')) extension = 'mp4';
          else if (mimeType.includes('ogg')) extension = 'ogg';
          else if (mimeType.includes('wav')) extension = 'wav';
          else if (mimeType.includes('aac')) extension = 'aac';
          else if (mimeType.includes('mpeg')) extension = 'mp3';

          const formData = new FormData();
          formData.append('file', audioBlob, `recording.${extension}`);

          const response = await fetch('/api/backend/voice/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errPayload = await response.json().catch(() => null);
            const message =
              extractApiErrorMessage(errPayload) ||
              `Error en transcripción (HTTP ${response.status})`;
            console.warn('STT unavailable:', message, errPayload ?? {});
            setError(`No se pudo procesar tu voz: ${message}`);
            resolve(null);
            return;
          }

          const data = await response.json();
          resolve(data.text || '');
        } catch (err) {
          console.error('STT Error:', err);
          setError('Hubo un problema de conexión al procesar el audio de tu micrófono.');
          resolve(null);
        } finally {
          setIsProcessing(false);
          // Detener todos los tracks del stream para apagar el micrófono
          mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  // Helper: limpia markdown para que la voz suene natural
  const cleanTextForSpeech = useCallback((raw: string): string => {
    return raw
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/\$/g, '')
      .replace(/#{1,6}\s*/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim();
  }, []);

  // TEXT TO SPEECH — Web Speech API primero (0ms latencia), backend como fallback de calidad
  const speak = useCallback(async (text: string, forceBackend: boolean = false) => {
    if (typeof text !== 'string' || !text.trim()) return;

    setError(null);
    const cleanText = cleanTextForSpeech(text);

    // ── Intento 1: Web Speech API nativa (instantánea) ──────────────
    if (!forceBackend && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const nativeOk = await speakWithBrowserFallback(cleanText);
      if (nativeOk) return;
    }

    // ── Intento 2: Backend TTS (ElevenLabs / OpenAI) ────────────────
    try {
      setIsPlaying(true);
      const response = await fetch('/api/backend/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText }),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => null);
        throw new Error(
          extractApiErrorMessage(errPayload) ||
          `Error en TTS (HTTP ${response.status})`
        );
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.toLowerCase().includes('audio/')) {
        throw new Error(`TTS devolvio formato no reproducible (${contentType})`);
      }

      const audioBlob = await response.blob();
      if (audioBlob.size === 0) throw new Error('TTS devolvio audio vacio.');

      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) audioRef.current.pause();

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      await new Promise<void>((resolve, reject) => {
        audio.oncanplaythrough = () => resolve();
        audio.onerror = () => reject(new Error('Error decodificando audio TTS.'));
      });

      audio.onended = () => { setIsPlaying(false); URL.revokeObjectURL(audioUrl); };
      await audio.play();
    } catch (err) {
      console.warn('Backend TTS también falló:', err);
      setError('No se pudo reproducir el audio del tutor.');
      setIsPlaying(false);
    }
  }, [speakWithBrowserFallback, cleanTextForSpeech]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  return {
    isRecording,
    isProcessing,
    isPlaying,
    error,
    startRecording,
    stopRecording,
    speak,
    stopSpeaking,
  };
}
