
import React, { useState, useEffect, useCallback } from 'react';
import { Subject, LearningGoal, ViewMode, ReflectionEntry, User } from './types';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { LoginScreen } from './components/LoginScreen';
import { ClassroomPicker } from './components/ClassroomPicker';
import { TeacherAuth } from './components/TeacherAuth';
import { databaseService } from './services/databaseService';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('STUDENT');
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(false);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [classroomId, setClassroomId] = useState<string>(() => {
    return localStorage.getItem('reflectie_ranger_classroom_id') || '';
  });
  const [syncStatus, setSyncStatus] = useState<'CONNECTED' | 'SYNCING' | 'OFFLINE'>('CONNECTED');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());

  const refreshFromDatabase = useCallback(async () => {
    if (!classroomId) return;

    const queue = databaseService.getQueue();
    setPendingCount(queue.length);
    
    setSyncStatus('SYNCING');
    try {
      if (queue.length > 0) {
        await databaseService.processQueue();
        setPendingCount(databaseService.getQueue().length);
      }

      const state = await databaseService.getFullState(classroomId);
      
      setGoals(state.goals);
      setUsers(state.users);
      setSyncStatus('CONNECTED');
      setLastSyncTime(Date.now());
    } catch (error) {
      setSyncStatus('OFFLINE');
    }
  }, [classroomId]);

  useEffect(() => {
    if (classroomId) {
      refreshFromDatabase();
      const interval = setInterval(refreshFromDatabase, 5000);
      return () => clearInterval(interval);
    }
  }, [refreshFromDatabase, classroomId]);

  const handleSetClassroom = (id: string) => {
    const code = id.trim().toUpperCase();
    setClassroomId(code);
    localStorage.setItem('reflectie_ranger_classroom_id', code);
    
    const recent = JSON.parse(localStorage.getItem('recent_classrooms') || '[]');
    if (!recent.includes(code)) {
      const updatedRecent = [code, ...recent].slice(0, 5);
      localStorage.setItem('recent_classrooms', JSON.stringify(updatedRecent));
    }
  };

  const handleAddGoal = async (subject: Subject, title: string, description: string) => {
    await databaseService.createGoal(classroomId, { subject, title, description });
    await refreshFromDatabase();
  };

  const handleUpdateGoal = async (id: string, subject: Subject, title: string, description: string) => {
    // Optimistische update
    setGoals(prev => prev.map(g => g.id === id ? { ...g, subject, title, description } : g));
    await databaseService.updateGoal(classroomId, id, { subject, title, description });
    await refreshFromDatabase();
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm("Weet je zeker dat je dit lesdoel wilt verwijderen?")) {
      // 1. Directe UI update (React State)
      setGoals(prev => prev.filter(g => g.id !== id));
      
      // 2. Database update (die ook de lokale cache direct synchroon bijwerkt)
      await databaseService.deleteGoal(classroomId, id);
      
      // Geen directe refresh nodig omdat de cache al goed staat en de UI al gefilterd is
    }
  };

  const handleAddUser = async (name: string) => {
    await databaseService.createUser(classroomId, name);
    await refreshFromDatabase();
  };

  const handleUpdateUser = async (id: string, newName: string) => {
    // Optimistische update
    setUsers(prev => prev.map(u => u.id === id ? { ...u, name: newName } : u));
    await databaseService.updateUser(classroomId, id, newName);
    await refreshFromDatabase();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Weet je zeker dat je deze leerling wilt verwijderen?")) {
      // 1. Directe UI update (React State)
      setUsers(prev => prev.filter(u => u.id !== id));
      
      // 2. Database update (die ook de lokale cache direct synchroon bijwerkt)
      await databaseService.deleteUser(classroomId, id);
      
      // Geen directe refresh nodig
    }
  };

  const handleAddReflection = async (goalId: string, content: string, masteryLevel: number, photoBase64?: string) => {
    if (!currentUser) return;
    
    const newEntry: ReflectionEntry = {
      id: `${Date.now()}-${currentUser.id}`,
      userId: currentUser.id,
      timestamp: Date.now(),
      content,
      masteryLevel,
      photoBase64
    };

    setGoals(prevGoals => prevGoals.map(g => {
      if (g.id === goalId) {
        return { ...g, reflections: [...g.reflections, newEntry] };
      }
      return g;
    }));

    await databaseService.addReflection(classroomId, goalId, newEntry);
    await refreshFromDatabase();
  };

  const resetClassroom = () => {
    if(confirm("Wil je naar een andere groep wisselen? Je keert terug naar het beginscherm.")) {
      localStorage.removeItem('reflectie_ranger_classroom_id');
      setClassroomId('');
      setCurrentUser(null);
      setGoals([]);
      setUsers([]);
      setIsTeacherAuthenticated(false);
    }
  };

  const toggleViewMode = (mode: ViewMode) => {
    if (mode === 'TEACHER' && !isTeacherAuthenticated) {
      setViewMode('TEACHER');
    } else {
      if (mode === 'STUDENT') {
        setIsTeacherAuthenticated(false);
      }
      setViewMode(mode);
    }
  };

  if (!classroomId) {
    return <ClassroomPicker onSetClassroom={handleSetClassroom} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-blue-200">
               <i className="fas fa-mountain"></i>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Reflectie-Ranger
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {pendingCount > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black animate-pulse shadow-sm">
                   <i className="fas fa-clock"></i>
                   <span>{pendingCount}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 group relative">
                 <div className={`w-2 h-2 rounded-full ${
                   syncStatus === 'SYNCING' ? 'bg-amber-400 animate-pulse' : 
                   syncStatus === 'OFFLINE' ? 'bg-red-500' : 'bg-emerald-500'
                 }`}></div>
                 <button 
                   onClick={resetClassroom} 
                   className="text-[10px] font-black text-slate-500 uppercase tracking-tighter hover:text-blue-500 transition-colors flex items-center gap-2"
                   title="Wissel van groep"
                 >
                   <span>{classroomId}</span>
                   <i className="fas fa-exchange-alt opacity-30 text-[8px]"></i>
                 </button>
              </div>
            </div>

            <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
              <button
                onClick={() => toggleViewMode('STUDENT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'STUDENT' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'
                }`}
              >
                Leerling
              </button>
              <button
                onClick={() => toggleViewMode('TEACHER')}
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
              onAddReflection={handleAddReflection}
              onLogout={() => setCurrentUser(null)}
              onResetClassroom={resetClassroom}
            />
          ) : (
            <LoginScreen 
              users={users}
              onSelectUser={(u) => setCurrentUser(u)}
            />
          )
        ) : (
          !isTeacherAuthenticated ? (
            <TeacherAuth 
              onSuccess={() => setIsTeacherAuthenticated(true)} 
              onCancel={() => setViewMode('STUDENT')}
            />
          ) : (
            <TeacherDashboard 
              goals={goals} 
              users={users}
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onResetClassroom={resetClassroom}
            />
          )
        )}
      </main>

      <footer className="py-8 text-center text-slate-400 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <i className={`fas ${syncStatus === 'OFFLINE' ? 'fa-plane' : 'fa-wifi'} text-[10px]`}></i>
          <p className="text-[10px] font-bold uppercase tracking-widest">
            {syncStatus === 'OFFLINE' ? 'Offline Mode' : 'Online Sync'}
          </p>
        </div>
        <p className="opacity-50 text-[10px]">Groep: {classroomId} • Laatste update: {new Date(lastSyncTime).toLocaleTimeString()}</p>
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
