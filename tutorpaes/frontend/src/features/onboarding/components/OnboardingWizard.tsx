'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target, BookOpen, Brain, Sparkles, ChevronRight } from 'lucide-react';

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // State for user answers
  const [scoreGoal, setScoreGoal] = useState<string | null>(null);
  const [career, setCareer] = useState('');
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Options
  const scoreOptions = ['600+', '700+', '800+', '850+', 'Puntaje Nacional'];
  const weaknessOptions = [
    'Álgebra y Funciones', 'Geometría', 'Probabilidad y Estadística', 'Números', 
    'Comprensión Lectora', 'Vocabulario', 'Ciencias Naturales', 'Historia y Cs. Sociales'
  ];

  const handleNext = () => {
    if (step === 3) {
      setIsSubmitting(true);
      setTimeout(() => {
        router.push('/protected');
      }, 1000);
    } else {
      setStep(prev => prev + 1);
    }
  };

  const toggleWeakness = (subject: string) => {
    setWeaknesses(prev => 
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  // Allow advancing from Step 1 if an option is clicked to feel reactive
  const handleScoreClick = (option: string) => {
    setScoreGoal(option);
    setTimeout(() => {
      setStep(2);
    }, 400); // slight delay for visual feedback
  };

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-500 w-full max-w-md mx-auto">
            <div className="p-4 bg-brand-primary/10 rounded-full mb-6">
              <Target className="h-10 w-10 text-brand-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-text-primary mb-2 text-center">
              ¿Cuál es tu objetivo?
            </h1>
            <p className="text-text-secondary text-center mb-10 font-medium">
              Apunta alto. Personalizaremos tu plan para llegar a este puntaje en la PAES.
            </p>
            
            <div className="w-full space-y-3">
              {scoreOptions.map(option => (
                <button
                  key={option}
                  onClick={() => handleScoreClick(option)}
                  className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all duration-300 font-bold text-lg
                    ${scoreGoal === option 
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
                      : 'border-white/10 bg-surface-raised hover:border-brand-primary/50 hover:bg-surface-raised/80 text-text-secondary hover:text-text-primary'
                    }`}
                >
                  {option}
                  {scoreGoal === option && <Sparkles className="h-5 w-5" />}
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-500 w-full max-w-md mx-auto">
            <div className="p-4 bg-brand-accent/10 rounded-full mb-6">
              <BookOpen className="h-10 w-10 text-brand-accent" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-text-primary mb-2 text-center">
              ¿Qué carrera sueñas?
            </h1>
            <p className="text-text-secondary text-center mb-10 font-medium">
              Mantén tu meta visible. Cada ensayo es un paso más cerca de la universidad.
            </p>

            <div className="w-full">
              <input
                type="text"
                placeholder="Ej. Medicina en la U. de Chile..."
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                className="w-full bg-surface-raised border border-white/10 rounded-xl px-6 py-5 text-text-primary text-xl font-medium focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all placeholder:text-text-tertiary shadow-glass-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && career.trim()) {
                    handleNext();
                  }
                }}
              />
            </div>
            
            <div className="w-full mt-10">
              <button
                onClick={handleNext}
                disabled={!career.trim()}
                className="w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,0,0,0)] flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  bg-brand-primary hover:bg-brand-primary/90 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] text-white"
              >
                Continuar
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-500 w-full max-w-2xl mx-auto">
            <div className="p-4 bg-purple-500/10 rounded-full mb-6">
              <Brain className="h-10 w-10 text-purple-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-text-primary mb-2 text-center">
              Diagnóstico inicial
            </h1>
            <p className="text-text-secondary text-center mb-10 font-medium max-w-md">
              Selecciona las áreas donde sientes que necesitas más refuerzo. Entrenaremos a la IA para enfocarse ahí.
            </p>

            <div className="flex flex-wrap gap-3 justify-center mb-10">
              {weaknessOptions.map(option => {
                const isSelected = weaknesses.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => toggleWeakness(option)}
                    className={`px-5 py-3 rounded-full border transition-all duration-300 font-bold text-sm
                      ${isSelected 
                        ? 'border-brand-accent bg-brand-accent/10 text-brand-accent shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                        : 'border-white/10 bg-surface-raised text-text-secondary hover:border-brand-accent/50 hover:text-text-primary'
                      }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            <div className="w-full max-w-md mt-auto">
              <button
                onClick={handleNext}
                disabled={isSubmitting || weaknesses.length === 0}
                className="w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,0,0,0)] flex items-center justify-center gap-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  bg-text-primary hover:bg-text-secondary text-surface-base hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-surface-base border-t-transparent animate-spin" />
                    Preparando tu entorno...
                  </div>
                ) : (
                  <>
                    Comenzar mi Entrenamiento
                    <Sparkles className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-surface-base overflow-hidden flex flex-col">
      {/* Barra de Progreso */}
      <div className="absolute top-0 left-0 w-full h-1 bg-surface-container z-50">
        <div 
          className="h-full bg-brand-primary transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {/* Navegación Superior */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-40">
        {step > 1 ? (
          <button 
            onClick={() => setStep(prev => prev - 1)}
            className="p-2 rounded-full hover:bg-surface-raised text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2 text-sm font-bold"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Atrás</span>
          </button>
        ) : (
          <div></div> // Spacer
        )}
        <div className="text-text-tertiary font-bold tracking-widest text-xs uppercase">
          Paso {step} de 3
        </div>
      </div>

      {/* Contenido Principal (Centrado) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full h-full relative z-10">
        {renderStepContent()}
      </div>

      {/* Decoración de Fondo (Minimalista, usando tokens) */}
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] bg-brand-accent/5 blur-[120px] rounded-full pointer-events-none" />
    </div>
  );
}
