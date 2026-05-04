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
        window.speechSynthesis.speak(utterance);
      } catch {
        setIsPlaying(false);
        resolve(false);
      }
    });
  }, []);

  // START RECORDING
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
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
      console.error('Error starting recording:', err);
      alert('No se pudo acceder al micrófono. Por favor revisa los permisos de tu navegador.');
    }
  }, []);

  // STOP RECORDING & TRANSCRIBE
  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsRecording(false);
        setIsProcessing(true);

        try {
          // Nota: El backend espera un archivo multipart/form-data.
          // Como apiFetch está optimizado para JSON, usamos fetch directo para multipart
          // o creamos un helper si es necesario.
          const formData = new FormData();
          formData.append('file', audioBlob, 'recording.webm');

          const response = await fetch('/api/backend/voice/transcribe', {
            method: 'POST',
            body: formData,
            // Las cookies de sesión se envían automáticamente por el navegador
          });

          if (!response.ok) {
            const errPayload = await response.json().catch(() => null);
            const message =
              extractApiErrorMessage(errPayload) ||
              `Error en transcripción (HTTP ${response.status})`;
            console.warn('STT unavailable:', message, errPayload ?? {});
            resolve(null);
            return;
          }

          const data = await response.json();
          resolve(data.text || '');
        } catch (err) {
          console.error('STT Error:', err);
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

  // TEXT TO SPEECH
  const speak = useCallback(async (text: string) => {
    if (typeof text !== 'string' || !text.trim()) return;

    try {
      setIsPlaying(true);
      const response = await fetch('/api/backend/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => null);
        const message =
          extractApiErrorMessage(errPayload) ||
          `Error en TTS (HTTP ${response.status})`;
        throw new Error(message);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.toLowerCase().includes('audio/')) {
        const fallbackBody = await response.text().catch(() => '');
        throw new Error(
          `TTS devolvio un formato no reproducible (${contentType || 'sin content-type'}). ${fallbackBody.slice(0, 120)}`
        );
      }

      const audioBlob = await response.blob();
      if (audioBlob.size === 0) {
        throw new Error('TTS devolvio audio vacio.');
      }

      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.preload = 'auto';

      await new Promise<void>((resolve, reject) => {
        audio.oncanplaythrough = () => resolve();
        audio.onerror = () => reject(new Error('No se pudo decodificar el audio TTS en el navegador.'));
      });
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.warn('TTS provider unavailable, using browser fallback:', err);
      const fallbackOk = await speakWithBrowserFallback(text);
      if (!fallbackOk) {
        console.warn('Browser TTS fallback also failed.');
        setIsPlaying(false);
      }
    }
  }, [speakWithBrowserFallback]);

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
    startRecording,
    stopRecording,
    speak,
    stopSpeaking,
  };
}
