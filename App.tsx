
import React, { useState, useEffect, useCallback } from 'react';
import { Subject, LearningGoal, ViewMode, ReflectionEntry, User } from './types';
import { INITIAL_GOALS } from './constants';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { LoginScreen } from './components/LoginScreen';
import { syncService, AppState } from './services/syncService';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('STUDENT');
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [classroomId, setClassroomId] = useState<string>(() => {
    return localStorage.getItem('reflectie_ranger_classroom_id') || 'KLAS-' + Math.floor(1000 + Math.random() * 9000);
  });
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'ERROR'>('IDLE');
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());

  // Initial Load
  useEffect(() => {
    const savedGoals = localStorage.getItem('reflectie_ranger_goals');
    const savedUsers = localStorage.getItem('reflectie_ranger_users');
    
    if (savedGoals) setGoals(JSON.parse(savedGoals));
    else setGoals(INITIAL_GOALS);
    
    if (savedUsers) setUsers(JSON.parse(savedUsers));
    
    localStorage.setItem('reflectie_ranger_classroom_id', classroomId);
  }, [classroomId]);

  // Sync Logica
  const performSync = useCallback(async (manualState?: { goals: LearningGoal[], users: User[] }) => {
    setSyncStatus('SYNCING');
    const currentLocalState: AppState = {
      goals: manualState?.goals || goals,
      users: manualState?.users || users,
      lastUpdated: Date.now()
    };

    // 1. Haal remote op
    const remoteState = await syncService.fetchState(classroomId);
    
    let stateToPush = currentLocalState;
    if (remoteState) {
      // 2. Merge als er remote data is
      stateToPush = syncService.mergeStates(currentLocalState, remoteState);
      
      // Update lokale state als remote nieuwer of anders was
      setGoals(stateToPush.goals);
      setUsers(stateToPush.users);
      localStorage.setItem('reflectie_ranger_goals', JSON.stringify(stateToPush.goals));
      localStorage.setItem('reflectie_ranger_users', JSON.stringify(stateToPush.users));
    }

    // 3. Push de (gemergde) staat terug
    const success = await syncService.pushState(classroomId, stateToPush);
    setSyncStatus(success ? 'IDLE' : 'ERROR');
    setLastSyncTime(Date.now());
  }, [classroomId, goals, users]);

  // Polling voor real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      performSync();
    }, 5000); // Elke 5 seconden syncen
    return () => clearInterval(interval);
  }, [performSync]);

  const addGoal = (subject: Subject, title: string, description: string) => {
    const newGoal: LearningGoal = {
      id: Date.now().toString(),
      subject,
      title,
      description,
      reflections: []
    };
    const newGoals = [...goals, newGoal];
    setGoals(newGoals);
    performSync({ goals: newGoals, users });
  };

  const deleteGoal = (id: string) => {
    const newGoals = goals.filter(g => g.id !== id);
    setGoals(newGoals);
    performSync({ goals: newGoals, users });
  };

  const addUser = (name: string) => {
    const newUser: User = {
      id: Date.now().toString(),
      name
    };
    const newUsers = [...users, newUser];
    setUsers(newUsers);
    performSync({ goals, users: newUsers });
  };

  const deleteUser = (id: string) => {
    const newUsers = users.filter(u => u.id !== id);
    setUsers(newUsers);
    if (currentUser?.id === id) setCurrentUser(null);
    performSync({ goals, users: newUsers });
  };

  const addReflection = (goalId: string, content: string, masteryLevel: number, photoBase64?: string) => {
    if (!currentUser) return;
    const newGoals = goals.map(goal => {
      if (goal.id === goalId) {
        const newEntry: ReflectionEntry = {
          id: Date.now().toString() + '-' + currentUser.id,
          userId: currentUser.id,
          timestamp: Date.now(),
          content,
          masteryLevel,
          photoBase64
        };
        return {
          ...goal,
          reflections: [...goal.reflections, newEntry]
        };
      }
      return goal;
    });
    setGoals(newGoals);
    performSync({ goals: newGoals, users });
  };

  const changeClassroom = () => {
    const newId = prompt("Voer de nieuwe Klas-Code in:", classroomId);
    if (newId && newId.trim()) {
      setClassroomId(newId.trim().toUpperCase());
      localStorage.setItem('reflectie_ranger_classroom_id', newId.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white text-xl">
               <i className="fas fa-mountain-sun"></i>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Reflectie-Ranger
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Sync Status Indicator */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
               <div className={`w-2 h-2 rounded-full ${syncStatus === 'SYNCING' ? 'bg-blue-400 animate-pulse' : syncStatus === 'ERROR' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
               <button onClick={changeClassroom} className="text-[10px] font-black text-slate-400 uppercase tracking-tighter hover:text-blue-500 transition-colors">
                 Klas: {classroomId}
               </button>
            </div>

            <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
              <button
                onClick={() => setViewMode('STUDENT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'STUDENT' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'
                }`}
              >
                Leerling
              </button>
              <button
                onClick={() => setViewMode('TEACHER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'TEACHER' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'
                }`}
              >
                Leerkracht
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        {viewMode === 'STUDENT' ? (
          currentUser ? (
            <StudentDashboard 
              currentUser={currentUser}
              goals={goals} 
              onAddReflection={addReflection}
              onLogout={() => setCurrentUser(null)}
            />
          ) : (
            <LoginScreen 
              users={users}
              onSelectUser={(u) => setCurrentUser(u)}
            />
          )
        ) : (
          <TeacherDashboard 
            goals={goals} 
            users={users}
            onAddGoal={addGoal}
            onDeleteGoal={deleteGoal}
            onAddUser={addUser}
            onDeleteUser={deleteUser}
          />
        )}
      </main>

      <footer className="py-8 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Reflectie-Ranger — Klas-Code: <span className="font-bold text-slate-500">{classroomId}</span></p>
        <p className="text-[10px] mt-1 opacity-50">Laatste synchronisatie: {new Date(lastSyncTime).toLocaleTimeString()}</p>
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
