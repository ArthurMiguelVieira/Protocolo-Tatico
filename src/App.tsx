import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Dumbbell, 
  BookOpen, 
  BarChart3, 
  CheckCircle2, 
  ChevronRight, 
  Flame, 
  Play, 
  Pause, 
  RotateCcw, 
  ArrowLeft, 
  Target,
  Calendar,
  Settings,
  AlertTriangle,
  Clock 
} from 'lucide-react';

// --- TYPES & CONSTANTS ---

type ViewState = 'DASHBOARD' | 'WORKOUT' | 'STUDY' | 'QUESTIONS' | 'STATS' | 'CONFIG';

interface WorkoutLog {
  id: string;
  date: string;
  type: string;
  notes: string;
  exercises: { name: string; weight: string; reps: string; sets: string }[];
}

interface StudySession {
  id: string;
  date: string;
  subject: string;
  durationMinutes: number;
}

interface QuestionLog {
  id: string;
  date: string;
  subject: string;
  total: number;
  correct: number;
}

interface DailyVerse {
  text: string;
  reference: string;
}

const FALLBACK_VERSES: DailyVerse[] = [
  { text: "Tudo posso naquele que me fortalece.", reference: "Filipenses 4:13" },
  { text: "O Senhor é o meu pastor; de nada terei falta.", reference: "Salmos 23:1" },
  { text: "Sejam fortes e corajosos. Não tenham medo.", reference: "Josué 1:9" },
  { text: "Mil cairão ao teu lado, e dez mil à tua direita, mas tu não serás atingido.", reference: "Salmos 91:7" },
  { text: "Combati o bom combate, acabei a carreira, guardei a fé.", reference: "2 Timóteo 4:7" }
];

const INITIAL_SUBJECTS = [
  "Português",
  "Direito Penal",
  "Literatura",
  "Direito Constitucional",
  "Raciocínio Lógico",
  "Legislação Específica"
];

// Lógica de exercícios pré-definidos por dia
const WORKOUT_SCHEDULE = [
  { 
    day: 0, 
    title: "Rest Day", 
    focus: "Recuperação Ativa / Mobilidade", 
    type: "REST",
    defaultExercises: [
      { name: "Alongamento / Mobilidade", sets: "1", reps: "20min", weight: "0" },
      { name: "Caminhada Leve", sets: "1", reps: "30min", weight: "0" }
    ]
  },
  { 
    day: 1, 
    title: "Treino A (Tração)", 
    focus: "Barra Fixa / Costas", 
    type: "STRENGTH",
    defaultExercises: [
      { name: "Barra Fixa (Pronada)", sets: "4", reps: "Falha", weight: "Corpo" },
      { name: "Levantamento Terra", sets: "3", reps: "8-10", weight: "" },
      { name: "Remada Curvada", sets: "3", reps: "10-12", weight: "" },
      { name: "Rosca Direta", sets: "3", reps: "12", weight: "" }
    ]
  },
  { 
    day: 2, 
    title: "Cardio HIIT", 
    focus: "VO2 Max (Esteira)", 
    type: "CARDIO",
    defaultExercises: [
      { name: "Tiro de 1 min (Alta Intensidade)", sets: "10", reps: "1min", weight: "Vel 14" },
      { name: "Trote Recuperativo", sets: "10", reps: "1min", weight: "Vel 8" }
    ]
  },
  { 
    day: 3, 
    title: "Treino B (Empurrar)", 
    focus: "Agachamento / Flexão", 
    type: "STRENGTH",
    defaultExercises: [
      { name: "Agachamento Livre", sets: "4", reps: "8-10", weight: "" },
      { name: "Flexão de Braço", sets: "4", reps: "Falha", weight: "Corpo" },
      { name: "Supino Reto/Halteres", sets: "3", reps: "10-12", weight: "" },
      { name: "Desenvolvimento Ombros", sets: "3", reps: "12", weight: "" },
      { name: "Abdominal Remador", sets: "3", reps: "20", weight: "Corpo" }
    ]
  },
  { 
    day: 4, 
    title: "Corrida Ritmo", 
    focus: "Tempo Run (Resistência)", 
    type: "RUN",
    defaultExercises: [
      { name: "Corrida 5km (Ritmo Constante)", sets: "1", reps: "1x", weight: "" },
      { name: "Educativos de Corrida", sets: "1", reps: "10min", weight: "" }
    ]
  },
  { 
    day: 5, 
    title: "Full Body", 
    focus: "Halteres / Funcional", 
    type: "STRENGTH",
    defaultExercises: [
      { name: "Burpees", sets: "3", reps: "15", weight: "Corpo" },
      { name: "Kettlebell Swing", sets: "3", reps: "15", weight: "" },
      { name: "Afundo (Lunges)", sets: "3", reps: "12", weight: "" },
      { name: "Prancha Abdominal", sets: "3", reps: "1min", weight: "Corpo" }
    ]
  },
  { 
    day: 6, 
    title: "Long Run / Simulado", 
    focus: "Resistência Aeróbica", 
    type: "RUN",
    defaultExercises: [
      { name: "Corrida Longa (8-10km)", sets: "1", reps: "1x", weight: "" }
    ]
  },
];

const EXAM_DATE_DEFAULT = "2026-06-15"; 
const WEEKLY_GOAL_DEFAULT = 15; // Horas
const POMODORO_DEFAULT = 50; // Minutos

// --- CUSTOM HOOKS ---

function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

function useDailyVerse() {
  const [verse, setVerse] = useStickyState<DailyVerse | null>(null, 'tactical_daily_verse_data');
  const [verseDate, setVerseDate] = useStickyState<string>('', 'tactical_daily_verse_date');

  useEffect(() => {
    const today = new Date().toDateString();
    
    if (verseDate !== today || !verse) {
      // Need new verse
      fetch('https://bible-api.com/?random=verse&translation=almeida')
        .then(res => res.json())
        .then(data => {
          if (data.text && data.reference) {
            setVerse({ text: data.text.trim(), reference: data.reference });
            setVerseDate(today);
          } else {
            throw new Error("Invalid format");
          }
        })
        .catch(() => {
          // Fallback
          const random = FALLBACK_VERSES[Math.floor(Math.random() * FALLBACK_VERSES.length)];
          setVerse(random);
          setVerseDate(today);
        });
    }
  }, [verseDate]);

  return verse;
}

// --- COMPONENTS ---

const Header = ({ title, showBack, onBack, rightAction }: { title: string, showBack?: boolean, onBack?: () => void, rightAction?: React.ReactNode }) => (
  <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-zinc-950 sticky top-0 z-10">
    <div className="flex items-center">
        {showBack && (
        <button onClick={onBack} className="mr-3 text-slate-400 hover:text-white">
            <ArrowLeft size={24} />
        </button>
        )}
        <h1 className="text-xl font-bold tracking-tight text-slate-100 uppercase">{title}</h1>
    </div>
    {rightAction}
  </div>
);

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-slate-900/60 border border-slate-800 rounded-lg p-5 ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = 'primary', className = "", disabled = false, fullWidth = true }: any) => {
  const base = `${fullWidth ? 'w-full' : ''} font-bold uppercase tracking-wider rounded-md transition-all active:scale-[0.98] flex items-center justify-center gap-2`;
  const variants = {
    primary: "bg-slate-100 text-zinc-950 hover:bg-white h-14",
    secondary: "bg-slate-800 text-slate-200 hover:bg-slate-700 h-12 border border-slate-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-500 h-14",
    danger: "bg-red-600/20 text-red-500 border border-red-900 hover:bg-red-900/30 h-12",
    outline: "border border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200 h-12"
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${base} ${variants[variant as keyof typeof variants]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  // Global State
  const [view, setView] = useState<ViewState>('DASHBOARD');
  
  // Configs
  const [examDate, setExamDate] = useStickyState(EXAM_DATE_DEFAULT, 'tactical_exam_date');
  const [weeklyGoalHours, setWeeklyGoalHours] = useStickyState(WEEKLY_GOAL_DEFAULT, 'tactical_weekly_goal');
  const [pomodoroDuration, setPomodoroDuration] = useStickyState(POMODORO_DEFAULT, 'tactical_pomodoro_duration');

  // Logs
  const [subjectIndex, setSubjectIndex] = useStickyState(0, 'tactical_subject_index');
  const [studyHistory, setStudyHistory] = useStickyState<StudySession[]>([], 'tactical_study_history');
  const [questionHistory, setQuestionHistory] = useStickyState<QuestionLog[]>([], 'tactical_question_history');
  const [workoutHistory, setWorkoutHistory] = useStickyState<WorkoutLog[]>([], 'tactical_workout_history');
  const [lastOpenDate, setLastOpenDate] = useStickyState<string>(new Date().toISOString(), 'tactical_last_open');
  const [streak, setStreak] = useStickyState(0, 'tactical_streak');

  // Computed Values
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0-6
  const todaysWorkout = WORKOUT_SCHEDULE.find(w => w.day === dayOfWeek) || WORKOUT_SCHEDULE[0];
  const currentSubject = INITIAL_SUBJECTS[subjectIndex % INITIAL_SUBJECTS.length];
  
  const daysUntilExam = Math.ceil((new Date(examDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Streak Logic
  useEffect(() => {
    const lastDate = new Date(lastOpenDate).toDateString();
    const currDate = new Date().toDateString();
    
    if (lastDate !== currDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastDate === yesterday.toDateString()) {
        setStreak(s => s + 1);
      } else {
        const gap = (today.getTime() - new Date(lastOpenDate).getTime()) / (1000 * 3600 * 24);
        if (gap > 2) setStreak(1);
        else setStreak(s => s + 1);
      }
      setLastOpenDate(new Date().toISOString());
    }
  }, []);

  // --- SUB-VIEWS ---

  const Dashboard = () => {
    const dailyVerse = useDailyVerse();

    return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* DAILY VERSE */}
      {dailyVerse && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/50 p-4 rounded-lg relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-2 opacity-5">
            <BookOpen size={80} />
          </div>
          <p className="text-slate-300 italic font-serif text-sm mb-2 leading-relaxed">
            "{dailyVerse.text}"
          </p>
          <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest text-right">
            {dailyVerse.reference}
          </p>
        </div>
      )}

      {/* HEADER STATS */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col items-center justify-center py-6 border-t-4 border-t-emerald-500">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Dia D</span>
          <span className="text-4xl font-black text-slate-100">{Math.max(0, daysUntilExam)}</span>
          <span className="text-xs text-slate-500 mt-1">Dias Restantes</span>
        </Card>
        <Card className="flex flex-col items-center justify-center py-6 border-t-4 border-t-amber-500">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Streak</span>
          <div className="flex items-center gap-2">
            <Flame className="text-amber-500 fill-amber-500" size={24} />
            <span className="text-4xl font-black text-slate-100">{streak}</span>
          </div>
          <span className="text-xs text-slate-500 mt-1">Dias Seguidos</span>
        </Card>
      </div>

      {/* PHYSICAL MISSION */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Missão Física (Hoje)</h2>
          <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 capitalize">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}
          </span>
        </div>
        <div 
          onClick={() => setView('WORKOUT')}
          className="bg-slate-900 border border-slate-700 hover:border-emerald-500/50 transition-colors p-5 rounded-lg cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600"></div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-slate-100 mb-1">{todaysWorkout.title}</h3>
              <p className="text-slate-400 text-sm">{todaysWorkout.focus}</p>
            </div>
            <div className="bg-slate-800 p-2 rounded-full group-hover:bg-slate-700 transition-colors">
              <ChevronRight className="text-slate-400" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-emerald-400 font-mono border border-slate-700 uppercase">
              {todaysWorkout.type}
            </span>
          </div>
        </div>
      </div>

      {/* INTEL MISSION */}
      <div>
        <h2 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 px-1">Missão Intelectual (Ciclo)</h2>
        <div className="bg-zinc-900 border border-slate-800 p-6 rounded-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BookOpen size={100} />
          </div>
          
          <span className="inline-block px-2 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded mb-3 border border-indigo-500/20">
            Prioridade Atual
          </span>
          
          <h3 className="text-2xl font-black text-white mb-6 leading-tight">
            {currentSubject}
          </h3>

          <Button variant="primary" onClick={() => setView('STUDY')}>
            <Play size={18} fill="black" />
            Iniciar Sessão
          </Button>
        </div>
      </div>
      
      {/* Quick Stats Preview */}
      <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800/50" onClick={() => setView('STATS')}>
        <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 uppercase font-bold">Progresso Semanal</span>
            <BarChart3 size={16} className="text-slate-500"/>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
                className="h-full bg-indigo-500" 
                style={{ width: `${Math.min((studyHistory.filter(s => {
                    const d = new Date(s.date);
                    const now = new Date();
                    return d.getTime() > now.getTime() - (7 * 24 * 60 * 60 * 1000);
                }).reduce((acc, curr) => acc + curr.durationMinutes, 0) / (weeklyGoalHours * 60)) * 100, 100)}%` }}
            ></div>
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-500">
            <span>Volume Atual</span>
            <span>Meta: {weeklyGoalHours}h</span>
        </div>
      </div>

    </div>
  );
  };

  const WorkoutLogger = () => {
    // Carrega exercícios padrão do dia
    const [exercises, setExercises] = useState(
        todaysWorkout.defaultExercises.map(ex => ({ ...ex, sets: (ex as any).sets || "" }))
    );

    const addExercise = () => setExercises([...exercises, { name: "", sets: "", weight: "", reps: "" }]);
    
    const updateExercise = (index: number, field: string, value: string) => {
        const newEx = [...exercises];
        // @ts-ignore
        newEx[index][field] = value;
        setExercises(newEx);
    }

    const saveWorkout = () => {
        if (exercises.every(e => e.name === "")) return;
        
        const log: WorkoutLog = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            type: todaysWorkout.type,
            notes: todaysWorkout.title,
            exercises: exercises.filter(e => e.name !== "")
        };
        
        setWorkoutHistory([log, ...workoutHistory]);
        setView('DASHBOARD');
    };

    return (
        <div className="animate-in slide-in-from-right duration-200">
            <Header title="Log de Treino" showBack onBack={() => setView('DASHBOARD')} />
            
            <div className="p-4 space-y-6 pb-24">
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <h3 className="text-emerald-400 font-bold uppercase mb-1">{todaysWorkout.title}</h3>
                    <p className="text-slate-400 text-sm">{todaysWorkout.focus}</p>
                </div>

                <div className="space-y-3">
                    {exercises.map((ex, idx) => (
                        <div key={idx} className="bg-black/20 p-3 rounded border border-slate-800 flex flex-col gap-2">
                            <input 
                                placeholder="Exercício"
                                className="bg-transparent text-slate-200 placeholder-slate-600 w-full outline-none text-sm font-medium border-b border-transparent focus:border-slate-700"
                                value={ex.name}
                                onChange={(e) => updateExercise(idx, 'name', e.target.value)}
                            />
                            <div className="grid grid-cols-3 gap-2">
                                 <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Séries</label>
                                    <input 
                                        placeholder="Sets"
                                        className="bg-slate-800 text-center text-slate-200 rounded w-full outline-none border border-slate-700 focus:border-emerald-500 text-xs py-2"
                                        value={ex.sets}
                                        onChange={(e) => updateExercise(idx, 'sets', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Reps</label>
                                    <input 
                                        placeholder="Reps"
                                        className="bg-slate-800 text-center text-slate-200 rounded w-full outline-none border border-slate-700 focus:border-emerald-500 text-xs py-2"
                                        value={ex.reps}
                                        onChange={(e) => updateExercise(idx, 'reps', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Carga</label>
                                    <input 
                                        placeholder="Kg"
                                        className="bg-slate-800 text-center text-slate-200 rounded w-full outline-none border border-slate-700 focus:border-emerald-500 text-xs py-2"
                                        value={ex.weight}
                                        onChange={(e) => updateExercise(idx, 'weight', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    <Button variant="secondary" onClick={addExercise} className="text-sm border-dashed">
                        + Adicionar Exercício
                    </Button>
                </div>

                <div className="fixed bottom-0 left-0 w-full p-4 bg-zinc-950 border-t border-slate-900">
                    <Button variant="success" onClick={saveWorkout}>
                        <CheckCircle2 size={20} />
                        Registrar Missão
                    </Button>
                </div>
            </div>
        </div>
    );
  };

  const StudyTimer = () => {
    const [timeLeft, setTimeLeft] = useState(pomodoroDuration * 60); 
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    // Wake Lock to prevent screen sleep
    useEffect(() => {
        let wakeLock: any = null;
        const requestWakeLock = async () => {
            // @ts-ignore
            if ('wakeLock' in navigator && isActive && !isPaused) {
                try {
                    // @ts-ignore
                    wakeLock = await navigator.wakeLock.request('screen');
                } catch (err) {
                    console.error("Wake Lock error:", err);
                }
            }
        };
        requestWakeLock();
        return () => {
            if (wakeLock) wakeLock.release();
        };
    }, [isActive, isPaused]);

    useEffect(() => {
        let interval: any = null;
        if (isActive && !isPaused && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            finishSession();
        }
        return () => clearInterval(interval);
    }, [isActive, isPaused, timeLeft]);

    const toggleTimer = () => {
        if (!isActive) setIsActive(true);
        else setIsPaused(!isPaused);
    };

    const resetTimer = () => {
        setIsActive(false);
        setIsPaused(false);
        setTimeLeft(pomodoroDuration * 60);
    };

    const finishSession = () => {
        const duration = Math.round((pomodoroDuration * 60 - timeLeft) / 60);
        if (duration < 1 && timeLeft > 0) {
            // If cancelled early without significant time
            setView('DASHBOARD');
            return;
        }

        const log: StudySession = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            subject: currentSubject,
            durationMinutes: duration || 1, // Minimum 1 min log
        };

        setStudyHistory([log, ...studyHistory]);
        // Only advance subject if session was substantial (> 10 mins or finished)
        if (timeLeft === 0 || duration > 10) {
             setSubjectIndex(prev => prev + 1);
        }
        setView('DASHBOARD');
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // SVG Circle Calculations
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const totalTime = pomodoroDuration * 60;
    const progress = ((totalTime - timeLeft) / totalTime);
    const strokeDashoffset = circumference - (progress * circumference);

    return (
        <div className="h-screen flex flex-col bg-zinc-950 animate-in zoom-in-95 duration-200 relative overflow-hidden">
             {/* Background Pulse Effect when active */}
             {isActive && !isPaused && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse -z-10"></div>
             )}

             <div className="absolute top-6 left-4 z-20">
                <button onClick={() => setView('DASHBOARD')} className="p-2 text-slate-500 hover:text-white transition-colors">
                    <ArrowLeft size={28} />
                </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto">
                <div className="mb-10 text-center z-10">
                    <span className="text-emerald-500 text-xs font-bold uppercase tracking-[0.2em] mb-2 block">Foco Total</span>
                    <h2 className="text-3xl font-black text-white px-2 leading-tight">{currentSubject}</h2>
                </div>

                {/* Progress Ring */}
                <div className="relative mb-12 flex items-center justify-center">
                    {/* Background Circle */}
                    <svg className="transform -rotate-90 w-72 h-72">
                        <circle
                            cx="144"
                            cy="144"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-slate-900"
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="144"
                            cy="144"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className={`transition-all duration-1000 ease-linear ${isActive && !isPaused ? 'text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-slate-700'}`}
                        />
                    </svg>
                    
                    {/* Time Text */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <span className={`text-6xl font-mono font-bold tracking-tighter block ${isActive && !isPaused ? 'text-white' : 'text-slate-500'}`}>
                            {formatTime(timeLeft)}
                        </span>
                        <span className="text-xs text-slate-600 font-bold uppercase tracking-widest mt-1 block">
                            {isActive ? (isPaused ? "Pausado" : "Focando") : "Pronto"}
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 w-full px-4">
                    <Button 
                        variant="outline" 
                        onClick={resetTimer} 
                        fullWidth={false}
                        className="w-14 h-14 shrink-0 rounded-full border-slate-700 hover:border-slate-500 hover:bg-slate-800"
                    >
                        <RotateCcw size={20} />
                    </Button>
                    <Button 
                        variant={isActive && !isPaused ? "secondary" : "primary"} 
                        onClick={toggleTimer}
                        fullWidth={false}
                        className="flex-1 h-14 text-base font-bold tracking-wider rounded-full shadow-[0_0_20px_rgba(16,185,129,0.15)] max-w-[240px]"
                    >
                        {isActive && !isPaused ? <Pause className="mr-2" size={20}/> : <Play className="mr-2 fill-current" size={20}/>}
                        {isActive && !isPaused ? "PAUSAR" : isPaused ? "RETOMAR" : "INICIAR"}
                    </Button>
                </div>
            </div>

            <div className="p-6 border-t border-slate-900 bg-zinc-950 z-20">
                <Button variant="success" onClick={finishSession} className="h-14 shadow-lg shadow-emerald-900/20">
                    <CheckCircle2 size={22} />
                    Finalizar Sessão
                </Button>
            </div>
        </div>
    );
  };

  const QuestionsLogView = () => {
    const [selectedSubject, setSelectedSubject] = useState(INITIAL_SUBJECTS[0]);
    const [totalQuestions, setTotalQuestions] = useState('');
    const [correctCount, setCorrectCount] = useState('');

    const saveQuestions = () => {
        const total = parseInt(totalQuestions);
        const correct = parseInt(correctCount);

        if (!total || isNaN(total) || isNaN(correct)) {
            alert("Preencha os dados corretamente.");
            return;
        }

        if (correct > total) {
            alert("Acertos não podem ser maiores que o total.");
            return;
        }

        const log: QuestionLog = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            subject: selectedSubject,
            total,
            correct
        };

        setQuestionHistory([log, ...questionHistory]);
        setView('DASHBOARD');
    };

    const accuracy = totalQuestions && correctCount ? Math.round((parseInt(correctCount) / parseInt(totalQuestions)) * 100) : 0;

    return (
        <div className="animate-in slide-in-from-right duration-200">
            <Header title="Registro de Questões" showBack onBack={() => setView('DASHBOARD')} />
            
            <div className="p-4 space-y-6 pb-24">
                <Card>
                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Matéria</label>
                    <select 
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-4 text-white outline-none focus:border-emerald-500 appearance-none"
                    >
                        {INITIAL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Total</label>
                        <input 
                            type="number"
                            inputMode="numeric"
                            className="w-full bg-transparent text-3xl font-bold text-white outline-none placeholder-slate-700"
                            placeholder="0"
                            value={totalQuestions}
                            onChange={(e) => setTotalQuestions(e.target.value)}
                        />
                    </Card>
                    <Card>
                        <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Acertos</label>
                        <input 
                            type="number"
                            inputMode="numeric"
                            className="w-full bg-transparent text-3xl font-bold text-emerald-400 outline-none placeholder-emerald-900/50"
                            placeholder="0"
                            value={correctCount}
                            onChange={(e) => setCorrectCount(e.target.value)}
                        />
                    </Card>
                </div>

                {/* Live Accuracy Preview */}
                <div className="flex items-center justify-center p-6 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-center">
                        <span className="block text-slate-500 text-xs uppercase font-bold">Aproveitamento</span>
                        <span className={`text-5xl font-black ${accuracy >= 80 ? 'text-emerald-500' : accuracy >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                            {accuracy}%
                        </span>
                    </div>
                </div>

                <div className="fixed bottom-16 left-0 w-full p-4 bg-zinc-950 border-t border-slate-900">
                    <Button variant="success" onClick={saveQuestions}>
                        <CheckCircle2 size={20} />
                        Salvar Bateria
                    </Button>
                </div>
            </div>
        </div>
    );
  };

  const ConfigView = () => {
    const [localGoal, setLocalGoal] = useState(weeklyGoalHours.toString());
    const [localPomodoro, setLocalPomodoro] = useState(pomodoroDuration.toString());
    const [localDate, setLocalDate] = useState(examDate);

    const handleSave = () => {
        setWeeklyGoalHours(parseInt(localGoal) || 15);
        setPomodoroDuration(parseInt(localPomodoro) || 50);
        setExamDate(localDate);
        setView('DASHBOARD');
    };

    const handleClearData = () => {
        if (confirm("TEM CERTEZA? Isso apagará TODO o seu histórico permanentemente.")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="animate-in slide-in-from-right duration-200">
            <Header title="Configurações" showBack onBack={() => setView('DASHBOARD')} />
            
            <div className="p-4 space-y-6 pb-24">
                <Card>
                    <h3 className="text-slate-200 font-bold mb-4 flex items-center gap-2">
                        <Target size={18} className="text-emerald-500" />
                        Meta de Estudo
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Horas Semanais (Líquidas)</label>
                            <input 
                                type="number" 
                                value={localGoal}
                                onChange={(e) => setLocalGoal(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white outline-none focus:border-emerald-500"
                            />
                            <p className="text-[10px] text-slate-500 mt-2">
                                *Recomendado: Mínimo 15h para aprovação real.
                            </p>
                        </div>
                    </div>
                </Card>

                 <Card>
                    <h3 className="text-slate-200 font-bold mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-amber-500" />
                        Configuração do Timer
                    </h3>
                    <div>
                        <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Duração do Pomodoro (min)</label>
                        <input 
                            type="number" 
                            value={localPomodoro}
                            onChange={(e) => setLocalPomodoro(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white outline-none focus:border-amber-500"
                        />
                    </div>
                </Card>

                <Card>
                    <h3 className="text-slate-200 font-bold mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-indigo-500" />
                        Data da Prova
                    </h3>
                    <input 
                        type="date" 
                        value={localDate}
                        onChange={(e) => setLocalDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white outline-none focus:border-indigo-500"
                    />
                </Card>

                <div className="pt-4">
                    <Button onClick={handleSave} variant="success">Salvar Alterações</Button>
                </div>

                <div className="pt-12 border-t border-slate-800 mt-8">
                    <h3 className="text-red-500 font-bold mb-2 text-sm uppercase">Zona de Perigo</h3>
                    <Button onClick={handleClearData} variant="danger" className="text-sm">
                        <AlertTriangle size={16} />
                        Resetar Todo o App
                    </Button>
                </div>
            </div>
        </div>
    );
  };

  const StatsView = () => {
    // Process Data
    const subjectStats: {[key: string]: {minutes: number, qTotal: number, qCorrect: number}} = {};
    
    // Init map
    INITIAL_SUBJECTS.forEach(s => {
        subjectStats[s] = {minutes: 0, qTotal: 0, qCorrect: 0};
    });

    studyHistory.forEach(s => {
        if (subjectStats[s.subject]) subjectStats[s.subject].minutes += s.durationMinutes;
    });

    questionHistory.forEach(q => {
         if (subjectStats[q.subject]) {
             subjectStats[q.subject].qTotal += q.total;
             subjectStats[q.subject].qCorrect += q.correct;
         }
    });

    // Heatmap Data (Same logic as before but using only study for intensity mostly)
    const generateHeatmapData = () => {
        const days = [];
        const today = new Date();
        const totalWeeks = 16;
        const totalDays = totalWeeks * 7;
        
        const endDate = new Date(today);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - totalDays);
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);

        for (let i = 0; i < (totalWeeks * 7); i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            
            const studyMins = studyHistory
                .filter(s => s.date.startsWith(dateStr))
                .reduce((acc, curr) => acc + curr.durationMinutes, 0);
            
            const workoutDone = workoutHistory.some(w => w.date.startsWith(dateStr));
            const qDone = questionHistory.some(q => q.date.startsWith(dateStr));

            let intensity = 0;
            if (workoutDone || studyMins > 0 || qDone) intensity = 1;
            if ((workoutDone && studyMins > 30) || studyMins > 60) intensity = 2;
            if ((workoutDone && studyMins > 60) || studyMins > 120) intensity = 3;
            if ((workoutDone && studyMins > 90) || studyMins > 180) intensity = 4;
            
            const isFuture = d > new Date();
            days.push({ date: dateStr, intensity: isFuture ? 0 : intensity });
        }
        return days;
    };
    
    const heatmapData = useMemo(() => generateHeatmapData(), [studyHistory, workoutHistory, questionHistory]);

    return (
        <div className="animate-in slide-in-from-right duration-200">
            <Header title="Relatório de Combate" showBack onBack={() => setView('DASHBOARD')} />
            
            <div className="p-4 space-y-8 pb-24">
                
                {/* GITHUB STYLE HEATMAP */}
                <Card className="overflow-x-auto">
                    <h3 className="text-slate-200 font-bold mb-4 flex items-center gap-2">
                        <Calendar size={16} className="text-slate-500" />
                        Consistência
                    </h3>
                    <div className="grid grid-rows-7 grid-flow-col gap-[3px] w-max mx-auto">
                        {heatmapData.map((day, i) => (
                            <div 
                                key={i}
                                title={`${day.date}`}
                                className={`w-3 h-3 rounded-[2px] ${
                                    day.intensity === 0 ? 'bg-zinc-800' :
                                    day.intensity === 1 ? 'bg-emerald-950' :
                                    day.intensity === 2 ? 'bg-emerald-700' :
                                    day.intensity === 3 ? 'bg-emerald-500' :
                                    'bg-emerald-300'
                                }`}
                            ></div>
                        ))}
                    </div>
                </Card>

                {/* STUDY & QUESTIONS CHART */}
                <Card>
                    <h3 className="text-slate-200 font-bold mb-4 flex items-center gap-2">
                        <Target size={16} className="text-indigo-500" />
                        Desempenho por Matéria
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(subjectStats).sort((a,b) => b[1].minutes - a[1].minutes).map(([subj, data]) => {
                            const acc = data.qTotal > 0 ? Math.round((data.qCorrect / data.qTotal) * 100) : 0;
                            return (
                                <div key={subj} className="border-b border-slate-800 pb-2 last:border-0">
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span className="font-bold text-slate-300 w-1/3 truncate">{subj}</span>
                                        <div className="flex gap-4 w-2/3 justify-end">
                                            <span>{data.minutes} min</span>
                                            <span className={`${acc >= 80 ? 'text-emerald-400' : acc >= 60 ? 'text-amber-400' : 'text-slate-500'}`}>
                                                {acc}% ({data.qCorrect}/{data.qTotal})
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1">
                                        <div 
                                            className="bg-indigo-500 h-1 rounded-full" 
                                            style={{ width: `${Math.min((data.minutes / 600) * 100, 100)}%` }} // Escala arbitrária para visual
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </div>
    );
  };

  // --- NAVIGATION BAR (Mobile) ---
  const NavBar = () => (
    <div className="fixed bottom-0 left-0 w-full bg-zinc-950 border-t border-slate-800 grid grid-cols-5 h-16 z-20">
      <button 
        onClick={() => setView('DASHBOARD')}
        className={`flex flex-col items-center justify-center gap-1 ${view === 'DASHBOARD' ? 'text-emerald-500' : 'text-slate-500'}`}
      >
        <Shield size={20} />
        <span className="text-[10px] font-bold uppercase">Home</span>
      </button>
      <button 
        onClick={() => setView('WORKOUT')}
        className={`flex flex-col items-center justify-center gap-1 ${view === 'WORKOUT' ? 'text-emerald-500' : 'text-slate-500'}`}
      >
        <Dumbbell size={20} />
        <span className="text-[10px] font-bold uppercase">Treino</span>
      </button>
      <button 
        onClick={() => setView('STUDY')}
        className={`flex flex-col items-center justify-center gap-1 ${view === 'STUDY' ? 'text-emerald-500' : 'text-slate-500'}`}
      >
        <BookOpen size={20} />
        <span className="text-[10px] font-bold uppercase">Estudo</span>
      </button>
      <button 
        onClick={() => setView('QUESTIONS')}
        className={`flex flex-col items-center justify-center gap-1 ${view === 'QUESTIONS' ? 'text-emerald-500' : 'text-slate-500'}`}
      >
        <Target size={20} />
        <span className="text-[10px] font-bold uppercase">Questões</span>
      </button>
      <button 
        onClick={() => setView('STATS')}
        className={`flex flex-col items-center justify-center gap-1 ${view === 'STATS' ? 'text-emerald-500' : 'text-slate-500'}`}
      >
        <BarChart3 size={20} />
        <span className="text-[10px] font-bold uppercase">Stats</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-200 font-sans selection:bg-emerald-500/30">
        {view === 'DASHBOARD' && (
            <Header 
                title="Protocolo Tático" 
                rightAction={
                    <button onClick={() => setView('CONFIG')} className="text-slate-400 hover:text-white">
                        <Settings size={22} />
                    </button>
                }
            />
        )}
        
        <main className={`${view === 'STUDY' ? '' : 'container max-w-md mx-auto min-h-screen'}`}>
            {view === 'DASHBOARD' && <Dashboard />}
            {view === 'WORKOUT' && <WorkoutLogger />}
            {view === 'STUDY' && <StudyTimer />}
            {view === 'QUESTIONS' && <QuestionsLogView />}
            {view === 'STATS' && <StatsView />}
            {view === 'CONFIG' && <ConfigView />}
        </main>

        {view !== 'STUDY' && <NavBar />}
    </div>
  );
}