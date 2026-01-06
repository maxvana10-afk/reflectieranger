
import React, { useState } from 'react';
import { Subject, LearningGoal, User, ReflectionEntry } from '../types';
import { SUBJECT_COLORS, SUBJECT_ICONS } from '../constants';
import { MASTERY_INFO } from './ReflectionEntryList';

interface Props {
  goals: LearningGoal[];
  users: User[];
  onAddGoal: (subject: Subject, title: string, description: string) => Promise<void>;
  onUpdateGoal: (id: string, subject: Subject, title: string, description: string) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  onAddUser: (name: string) => Promise<void>;
  onUpdateUser: (id: string, newName: string) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onResetClassroom: () => void;
}

interface SelectedHistory {
  goal: LearningGoal;
  user: User;
  reflections: ReflectionEntry[];
}

export const TeacherDashboard: React.FC<Props> = ({ 
  goals, 
  users, 
  onAddGoal, 
  onUpdateGoal,
  onDeleteGoal, 
  onAddUser, 
  onUpdateUser,
  onDeleteUser,
  onResetClassroom 
}) => {
  const [activeTab, setActiveTab] = useState<'GOALS' | 'STUDENTS' | 'REFLECTIONS'>('GOALS');
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<LearningGoal | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [editUserName, setEditUserName] = useState('');
  const [selectedHistory, setSelectedHistory] = useState<SelectedHistory | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const [subject, setSubject] = useState<Subject>(Subject.Geography);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [editSubject, setEditSubject] = useState<Subject>(Subject.Geography);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && description) {
      onAddGoal(subject, title, description);
      setTitle('');
      setDescription('');
      setIsAddingGoal(false);
    }
  };

  const handleGoalEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGoal && editTitle && editDescription) {
      onUpdateGoal(editingGoal.id, editSubject, editTitle, editDescription);
      setEditingGoal(null);
    }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      onAddUser(newUserName.trim());
      setNewUserName('');
    }
  };

  const handleUserEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser && editUserName.trim()) {
      onUpdateUser(editingUser.id, editUserName.trim());
      setEditingUser(null);
    }
  };

  const getUser = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const getLatestReflectionsPerStudent = (reflections: ReflectionEntry[]) => {
    const studentMap: Record<string, ReflectionEntry[]> = {};
    reflections.forEach(r => {
      if (!studentMap[r.userId]) studentMap[r.userId] = [];
      studentMap[r.userId].push(r);
    });
    return Object.entries(studentMap).map(([userId, userRefs]) => {
      const sorted = [...userRefs].sort((a, b) => b.timestamp - a.timestamp);
      return {
        userId,
        latest: sorted[0],
        count: sorted.length,
        all: sorted
      };
    }).sort((a, b) => b.latest.timestamp - a.latest.timestamp);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Leerkracht Dashboard</h1>
        
        <div className="flex bg-slate-200 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          <button 
            onClick={() => setActiveTab('GOALS')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'GOALS' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
          >
            Lesdoelen
          </button>
          <button 
            onClick={() => setActiveTab('REFLECTIONS')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'REFLECTIONS' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
          >
            Reflecties
          </button>
          <button 
            onClick={() => setActiveTab('STUDENTS')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'STUDENTS' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
          >
            Leerlingen
          </button>
        </div>
      </div>

      {activeTab === 'GOALS' && (
        <div className="animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-700">Beheer Lesdoelen</h2>
            <button
              onClick={() => setIsAddingGoal(true)}
              className="bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <i className="fas fa-plus"></i> Nieuw Lesdoel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {goals.map((goal) => (
              <div key={goal.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-12 rounded-full ${SUBJECT_COLORS[goal.subject]}`}></div>
                  <div>
                    <h4 className="font-bold text-slate-800">{goal.title}</h4>
                    <p className="text-slate-500 text-xs font-medium">{goal.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs font-bold bg-slate-50 px-3 py-1 rounded-full mr-2">
                    {goal.reflections.length} reflecties
                  </span>
                  <button 
                    onClick={() => {
                      setEditingGoal(goal);
                      setEditSubject(goal.subject);
                      setEditTitle(goal.title);
                      setEditDescription(goal.description);
                    }}
                    className="text-slate-400 hover:text-blue-500 p-3 hover:bg-blue-50 rounded-xl transition-all"
                    title="Bewerk doel"
                  >
                    <i className="fas fa-edit text-lg"></i>
                  </button>
                  <button 
                    onClick={() => onDeleteGoal(goal.id)}
                    className="text-red-400 hover:text-red-600 p-3 hover:bg-red-50 rounded-xl transition-all"
                    title="Verwijder doel"
                  >
                    <i className="fas fa-trash-alt text-lg"></i>
                  </button>
                </div>
              </div>
            ))}
            {goals.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-100 text-slate-400">
                <i className="fas fa-mountain text-4xl mb-4 opacity-20"></i>
                <p>Nog geen lesdoelen aangemaakt voor deze groep.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'REFLECTIONS' && (
        <div className="animate-fadeIn space-y-12">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-slate-700">Nieuwste Reflecties</h2>
            <p className="text-slate-500 text-sm italic">Bekijk de laatste antwoorden. Klik op een kaart voor de tijdlijn.</p>
          </div>

          {goals.filter(g => g.reflections.length > 0).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
              <i className="fas fa-comment-slash text-4xl mb-3"></i>
              <p>Er zijn nog geen reflecties ingevuld door leerlingen.</p>
            </div>
          ) : (
            goals.filter(g => g.reflections.length > 0).map(goal => {
              const latestRefs = getLatestReflectionsPerStudent(goal.reflections);
              return (
                <div key={goal.id} className="space-y-4">
                  <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-2">
                    <div className={`p-2 rounded-lg text-white text-xs ${SUBJECT_COLORS[goal.subject]}`}>
                      {SUBJECT_ICONS[goal.subject]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 leading-tight">{goal.title}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{goal.subject}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {latestRefs.map(({ userId, latest, count, all }) => {
                      const mastery = MASTERY_INFO.find(m => m.level === latest.masteryLevel) || MASTERY_INFO[0];
                      const user = getUser(userId);
                      if (!user) return null;

                      return (
                        <div 
                          key={userId} 
                          onClick={() => setSelectedHistory({ goal, user, reflections: all })}
                          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full text-left transition-all hover:shadow-md hover:border-blue-200 group cursor-pointer relative overflow-hidden"
                        >
                          <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] transition-opacity group-hover:opacity-[0.08]`}>
                             <i className={`${mastery.icon} text-8xl`}></i>
                          </div>

                          <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">
                                {user.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">
                                  {new Date(latest.timestamp).toLocaleDateString('nl-NL')}
                                </span>
                                {count > 1 && (
                                  <span className="bg-blue-50 text-blue-600 text-[9px] px-2 py-0.5 rounded-full font-black">
                                    {count}e keer
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className={`p-2 rounded-xl ${mastery.bg} ${mastery.color} shadow-sm border border-white`}>
                              <i className={mastery.icon}></i>
                            </div>
                          </div>
                          
                          <div className="flex gap-4 relative z-10 flex-1">
                            <p className="text-slate-600 text-sm italic leading-relaxed flex-1 line-clamp-4">
                              "{latest.content}"
                            </p>
                            
                            {latest.photoBase64 && (
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPhoto(latest.photoBase64!);
                                }}
                                className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-50 flex-shrink-0 shadow-sm hover:scale-105 transition-transform cursor-zoom-in"
                                title="Klik om te vergroten"
                              >
                                <img 
                                  src={latest.photoBase64} 
                                  alt="Bewijs thumbnail" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-center text-[10px] font-bold text-blue-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            <i className="fas fa-history mr-2"></i> Bekijk tijdlijn
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'STUDENTS' && (
        <div className="animate-fadeIn">
          <h2 className="text-xl font-bold text-slate-700 mb-6">Beheer Leerlingen</h2>
          
          <form onSubmit={handleUserSubmit} className="flex gap-3 mb-8">
            <input
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Naam van de nieuwe leerling..."
              className="flex-1 p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-400 bg-white shadow-inner transition-all"
            />
            <button
              type="submit"
              disabled={!newUserName.trim()}
              className="bg-emerald-500 text-white font-black py-2 px-8 rounded-2xl shadow-lg hover:bg-emerald-600 disabled:opacity-50 transition-all uppercase text-xs tracking-widest"
            >
              Voeg toe
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <div key={user.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-100">
                    <i className="fas fa-user"></i>
                  </div>
                  <span className="font-black text-slate-700">{user.name}</span>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => {
                      setEditingUser(user);
                      setEditUserName(user.name);
                    }}
                    className="text-slate-400 hover:text-blue-500 p-3 hover:bg-blue-50 rounded-xl transition-all"
                    title="Bewerk leerling"
                  >
                    <i className="fas fa-edit text-lg"></i>
                  </button>
                  <button 
                    onClick={() => onDeleteUser(user.id)}
                    className="text-red-400 hover:text-red-600 p-3 hover:bg-red-50 rounded-xl transition-all"
                    title="Verwijder leerling"
                  >
                    <i className="fas fa-user-minus text-lg"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
          {users.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-100 text-slate-400">
              <i className="fas fa-users text-4xl mb-4 opacity-20"></i>
              <p>Nog geen leerlingen toegevoegd aan deze groep.</p>
            </div>
          )}
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form 
            onSubmit={handleUserEditSubmit}
            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-scaleIn"
          >
            <h2 className="text-2xl font-black mb-6 text-slate-800">Leerling bewerken</h2>
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Naam</label>
              <input
                type="text"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                autoFocus
                className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-400 bg-slate-50 font-bold"
              />
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl text-xs uppercase tracking-widest">Annuleren</button>
              <button type="submit" disabled={!editUserName.trim()} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg text-xs uppercase tracking-widest disabled:opacity-50">Opslaan</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form 
            onSubmit={handleGoalEditSubmit}
            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-scaleIn"
          >
            <h2 className="text-2xl font-black mb-6 text-slate-800">Lesdoel bewerken</h2>
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Vak</label>
              <select
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value as Subject)}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-400 bg-slate-50 font-bold"
              >
                {Object.values(Subject).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Titel</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-400 bg-slate-50 font-bold"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Beschrijving</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full h-32 p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-400 resize-none bg-slate-50 font-medium"
              />
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setEditingGoal(null)} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl text-xs uppercase tracking-widest">Annuleren</button>
              <button type="submit" disabled={!editTitle.trim() || !editDescription.trim()} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg text-xs uppercase tracking-widest">Opslaan</button>
            </div>
          </form>
        </div>
      )}

      {/* History Modal */}
      {selectedHistory && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[60] backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scaleIn">
            <div className={`p-6 text-white rounded-t-3xl flex justify-between items-center ${SUBJECT_COLORS[selectedHistory.goal.subject]}`}>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                   <i className="fas fa-history"></i>
                   Reflectie-tijdlijn van {selectedHistory.user.name}
                </h3>
                <p className="text-white/80 text-sm font-medium">{selectedHistory.goal.title}</p>
              </div>
              <button 
                onClick={() => setSelectedHistory(null)}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="relative border-l-2 border-slate-100 ml-3 space-y-10">
                {selectedHistory.reflections.map((ref, idx) => {
                  const mastery = MASTERY_INFO.find(m => m.level === ref.masteryLevel) || MASTERY_INFO[0];
                  const isLatest = idx === 0;
                  return (
                    <div key={ref.id} className="relative pl-8">
                      <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm ${isLatest ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                      
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {new Date(ref.timestamp).toLocaleString('nl-NL')}
                          </span>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase ${mastery.bg} ${mastery.color}`}>
                             <i className={mastery.icon}></i>
                             {mastery.label}
                          </div>
                        </div>

                        {ref.photoBase64 && (
                          <div 
                            onClick={() => setSelectedPhoto(ref.photoBase64!)}
                            className="mb-4 rounded-xl overflow-hidden border border-slate-200 max-w-sm cursor-zoom-in group relative"
                          >
                            <img src={ref.photoBase64} alt="Bewijs" className="w-full h-auto" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                              <i className="fas fa-search-plus text-white opacity-0 group-hover:opacity-100"></i>
                            </div>
                          </div>
                        )}

                        <p className="text-slate-700 italic leading-relaxed whitespace-pre-wrap">
                          "{ref.content}"
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex justify-end">
              <button 
                onClick={() => setSelectedHistory(null)}
                className="px-8 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo View Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[70] backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="relative max-w-4xl w-full flex flex-col items-center animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 text-white text-3xl hover:text-slate-300 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
            <div className="bg-white p-2 rounded-3xl shadow-2xl overflow-hidden">
              <img 
                src={selectedPhoto} 
                alt="Vergroot bewijs" 
                className="max-h-[80vh] w-auto rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {isAddingGoal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form 
            onSubmit={handleGoalSubmit}
            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-scaleIn"
          >
            <h2 className="text-2xl font-black mb-6 text-slate-800">Voeg lesdoel toe</h2>
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Vak</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-400 bg-slate-50 font-bold"
              >
                {Object.values(Subject).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Titel</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bijv. De Tweede Wereldoorlog"
                className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-400 bg-slate-50 font-bold"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Beschrijving</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ik kan vertellen hoe..."
                className="w-full h-32 p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-400 resize-none bg-slate-50 font-medium"
              />
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setIsAddingGoal(false)} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl text-xs uppercase tracking-widest">Annuleren</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg text-xs uppercase tracking-widest">Opslaan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
