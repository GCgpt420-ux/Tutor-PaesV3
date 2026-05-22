# Instrucciones para Integrar Voz en el Frontend (Next.js)

Ya he completado la parte del backend: 
1. **Base de Datos y Autenticación:** Arreglados (login devuelve 200).
2. **Carga masiva:** Inyectadas 504 preguntas exitosamente.
3. **Endpoints de Voz:** Creados `POST /api/v1/voice/transcribe` (Whisper/Groq) y `POST /api/v1/voice/tts` (ElevenLabs) listos para usar en `tutorpaes/backend/app/api/v1/endpoints/voice.py`.

Para que puedas tener el flujo end-to-end en tu demo, sigue estos pasos en el Frontend:

## 1. Crear el Componente de Grabación (MicrophoneButton)

Necesitas un componente que use `MediaRecorder` para capturar el audio del usuario. 

```tsx
import { useState, useRef } from 'react';

export default function VoiceRecorder({ onTranscription }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg' });
        await sendAudioToBackend(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks to release microphone
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "voice.ogg");

    try {
      // Recuerda usar tu token de autenticación (JWT) real
      const token = localStorage.getItem("token"); // Ajusta según tu app
      const response = await fetch("http://localhost:8000/api/v1/voice/transcribe", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Error en la transcripción");

      const data = await response.json();
      onTranscription(data.text); // Llama al callback con el texto transcrito
    } catch (error) {
      console.error("Transcription failed:", error);
    }
  };

  return (
    <button 
      onMouseDown={startRecording} 
      onMouseUp={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
      className={`p-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}
    >
      🎤 {isRecording ? "Grabando..." : "Mantén presionado para hablar"}
    </button>
  );
}
```

## 2. Integrar en tu Chat

En el componente donde tienes el chat (donde el usuario escribe texto), agrega el `VoiceRecorder`. Cuando este retorne el texto transcrito, envíalo a tu agente como si el usuario lo hubiese escrito.

```tsx
// Ejemplo dentro de tu ChatComponent
const handleTranscription = (transcribedText) => {
   // 1. Mostrar el texto en el chat
   appendMessage({ role: 'user', content: transcribedText });
   
   // 2. Enviar mensaje al agente / backend
   sendMessageToAgent(transcribedText);
};

// En tu JSX:
<div className="chat-input-area">
  <input type="text" placeholder="Escribe tu mensaje..." />
  <VoiceRecorder onTranscription={handleTranscription} />
</div>
```

## 3. Reproducir el Audio de Respuesta (TTS)

Cuando el agente (backend) te devuelva una respuesta de texto, puedes llamar al endpoint de TTS de ElevenLabs que acabamos de crear para que se reproduzca en el navegador.

```tsx
const playAgentVoice = async (text) => {
  try {
    const token = localStorage.getItem("token"); // Ajusta según tu auth
    const response = await fetch("http://localhost:8000/api/v1/voice/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ text: text })
    });

    if (!response.ok) throw new Error("Error obteniendo el audio TTS");

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Reproducir el audio
    audio.play();
  } catch (error) {
    console.error("TTS failed:", error);
  }
};
```

Simplemente llama a `playAgentVoice(respuestaDelAgente)` justo después de recibir el mensaje del bot.

---
**Nota:** El backend ya está funcionando localmente en tu máquina, con los endpoints conectados a las APIs de Groq y ElevenLabs correspondientes que saqué de tu otra carpeta `BOT`. 
