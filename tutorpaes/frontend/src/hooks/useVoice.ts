'use client';

import { useState, useCallback, useRef } from 'react';

export function useVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

          if (!response.ok) throw new Error('Error en transcripción');

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
    if (!text.trim()) return;

    try {
      setIsPlaying(true);
      const response = await fetch('/api/backend/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('Error en TTS');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error('TTS Error:', err);
      setIsPlaying(false);
    }
  }, []);

  return {
    isRecording,
    isProcessing,
    isPlaying,
    startRecording,
    stopRecording,
    speak,
  };
}
