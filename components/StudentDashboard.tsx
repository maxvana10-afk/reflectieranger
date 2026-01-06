
import React, { useState, useRef, useEffect } from 'react';
import { LearningGoal, Subject, User } from '../types';
import { SUBJECT_COLORS, SUBJECT_ICONS } from '../constants';
import { ReflectionEntryList, MASTERY_INFO } from './ReflectionEntryList';
import { getAIFeedback, getMasteryGuidance, MasteryGuidanceResponse } from '../services/geminiService';

interface Props {
  currentUser: User;
  goals: LearningGoal[];
  onAddReflection: (goalId: string, content: string, masteryLevel: number, photoBase64?: string) => void;
  onLogout: () => void;
}

export const StudentDashboard: React.FC<Props> = ({ currentUser, goals, onAddReflection, onLogout }) => {
  const [selectedGoal, setSelectedGoal] = useState<LearningGoal | null>(null);
  const [draft, setDraft] = useState('');
  const [masteryLevel, setMasteryLevel] = useState<number>(3);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isOffline: boolean } | null>(null);
  const [masteryData, setMasteryData] = useState<MasteryGuidanceResponse | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedGoal) {
      setMasteryData(null);
      setFeedback(null);
      getMasteryGuidance(selectedGoal.title, selectedGoal.description).then(setMasteryData);
    }
  }, [selectedGoal]);

  const handleGetHelp = async () => {
    if (!selectedGoal || !draft.trim()) return;
    setIsAiLoading(true);
    const result = await getAIFeedback(
      selectedGoal.subject,
      selectedGoal.title,
      selectedGoal.description,
      draft
    );
    setFeedback(result);
    setIsAiLoading(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedGoal || !draft.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddReflection(selectedGoal.id, draft, masteryLevel, photo || undefined);
      setDraft('');
      setFeedback(null);
      setPhoto(null);
      setMasteryLevel(3);
      setSelectedGoal(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQualityScore = () => {
    if (!draft.trim()) return 0;
    const text = draft.toLowerCase();
    let score = Math.min(50, draft.length / 4); 
    if (text.includes('omdat') || text.includes('want')) score += 15;
    if (text.includes('bijvoorbeeld') || text.includes('zoals')) score += 15;
    if (text.includes('eerst') || text.includes('toen')) score += 10;
    if (photo) score += 10;
    return Math.min(100, Math.floor(score));
  };

  if (selectedGoal) {
    const userReflections = selectedGoal.reflections.filter(r => r.userId === currentUser.id);
    const qualityScore = getQualityScore();
    const currentGuidance = masteryData?.levels.find(m => m.level === masteryLevel);

    return (
      <div className="max-w-2xl mx-auto p-4 animate-fadeIn pb-20">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => setSelectedGoal(null)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-bold"
          >
            <i className="fas fa-arrow-left"></i> Terug naar doelen
          </button>
          <div className="text-slate-400 text-sm font-medium">
            <i className="fas fa-user-circle mr-1"></i> {currentUser.name}
          </div>
        </div>

        <div className={`p-6 rounded-3xl shadow-lg mb-8 text-white relative overflow-hidden ${SUBJECT_COLORS[selectedGoal.subject]}`}>
          <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl">
            {SUBJECT_ICONS[selectedGoal.subject]}
          </div>
          <div className="flex items-center gap-3 mb-2 relative z-10">
             <span className="uppercase tracking-widest text-[10px] font-black bg-white/20 px-2 py-1 rounded">
               {selectedGoal.subject}
             </span>
          </div>
          <h2 className="text-2xl font-bold mb-2 relative z-10">{selectedGoal.title}</h2>
          <p className="text-white/90 text-sm leading-snug relative z-10">{selectedGoal.description}</p>
        </div>

        <ReflectionEntryList entries={userReflections} />

        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mb-8 relative">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center rounded-3xl">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-black text-blue-600 uppercase tracking-widest text-xs">Direct opslaan...</p>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-800 font-bold text-lg">Hoe goed ging het?</h3>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Kwaliteit van de Ranger</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                  <div 
                    className={`h-full transition-all duration-700 ease-out ${
                      qualityScore > 80 ? 'bg-emerald-500' : qualityScore > 40 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${qualityScore}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-slate-500">{qualityScore}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {MASTERY_INFO.map((m) => (
              <button
                key={m.level}
                onClick={() => setMasteryLevel(m.level)}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 text-center ${
                  masteryLevel === m.level 
                    ? `${m.bg} ${m.color.replace('text-', 'border-')} scale-105 shadow-md` 
                    : 'border-slate-50 text-slate-300 hover:border-slate-100'
                }`}
              >
                <i className={`${m.icon} text-xl`}></i>
                <span className="text-[9px] font-black uppercase tracking-tighter">{m.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* AI Mastery Guidance Section */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 animate-fadeIn min-h-[100px] flex flex-col justify-center">
            {currentGuidance ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${MASTERY_INFO[masteryLevel-1].color.replace('text-', 'bg-')}`}></div>
                   <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                     Niveau {masteryLevel}: {currentGuidance.guidance}
                   </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative group">
                  <span className="absolute -top-2 left-3 bg-blue-100 text-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Voorbeeld</span>
                  <p className="text-xs text-slate-600 italic leading-relaxed">
                    "Stel het doel was <strong>'{masteryData.referenceGoal}'</strong>, dan zou je kunnen schrijven: <br/>
                    <span className="text-slate-800 font-medium">{currentGuidance.example}</span>"
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-2 py-4">
                <i className="fas fa-sparkles animate-pulse"></i>
                <span className="text-[10px] font-bold uppercase tracking-widest">Hulp wordt geladen...</span>
              </div>
            )}
          </div>

          <div className="relative mb-4">
            <textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (feedback) setFeedback(null);
              }}
              className="w-full h-44 p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-400 focus:ring-0 outline-none transition-all resize-none text-slate-700 font-medium placeholder:text-slate-300 shadow-inner"
              placeholder="Schrijf hier jouw reflectie... Tip: gebruik het voorbeeld hierboven als inspiratie!"
            />
            {isAiLoading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-xs font-black text-blue-600 uppercase tracking-widest">De Ranger leest mee...</span>
                </div>
              </div>
            )}
          </div>

          {feedback && (
            <div className={`mb-6 p-5 rounded-2xl border-l-4 animate-slideDown flex gap-4 ${
              feedback.isOffline ? 'bg-amber-50 border-amber-400' : 'bg-blue-50 border-blue-400'
            }`}>
              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-2xl border border-slate-50">
                {feedback.isOffline ? '🛩️' : '🤠'}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                    feedback.isOffline ? 'text-amber-600' : 'text-blue-600'
                  }`}>
                    {feedback.isOffline ? 'Offline Ranger Tip' : 'AI Reflectie-Ranger'}
                  </span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed italic">"{feedback.text}"</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 p-3 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 ${
                  photo ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500'
                }`}
              >
                <i className={`fas ${photo ? 'fa-check-circle' : 'fa-camera'}`}></i>
                <span className="text-xs font-bold">{photo ? 'Foto staat klaar!' : 'Voeg een foto toe'}</span>
              </button>
            </div>
            
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" capture="environment" className="hidden" />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleGetHelp}
                disabled={!draft.trim() || isAiLoading || isSubmitting}
                className="bg-slate-800 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-slate-900 disabled:opacity-30 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
              >
                <i className="fas fa-magic"></i>
                Hulp
              </button>
              <button
                onClick={handleSubmit}
                disabled={!draft.trim() || isAiLoading || isSubmitting}
                className="bg-blue-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-600 disabled:opacity-30 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
              >
                <i className="fas fa-save"></i>
                Klaar!
              </button>
            </div>
          </div>
        </div>

        {photo && (
          <div className="mb-8 animate-scaleIn text-center">
            <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-white inline-block max-w-xs relative group">
              <img src={photo} alt="Bewijs" className="w-full h-auto" />
              <button onClick={() => setPhoto(null)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 animate-fadeIn">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Hoi {currentUser.name}! 👋</h1>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">Waar heb je vandaag over geleerd?</p>
        </div>
        <button onClick={onLogout} className="w-12 h-12 bg-white rounded-2xl shadow-sm text-slate-300 hover:text-red-500 transition-all flex items-center justify-center border border-slate-50 group">
          <i className="fas fa-power-off group-hover:scale-110 transition-transform"></i>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const myReflections = goal.reflections.filter(r => r.userId === currentUser.id);
          const hasReflections = myReflections.length > 0;
          return (
            <button
              key={goal.id}
              onClick={() => setSelectedGoal(goal)}
              className={`group relative bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50 hover:shadow-2xl hover:-translate-y-1.5 transition-all text-left overflow-hidden`}
            >
              <div className={`absolute top-0 right-0 w-36 h-36 -mr-8 -mt-8 opacity-5 transition-transform group-hover:scale-110 group-hover:rotate-12 ${SUBJECT_COLORS[goal.subject]}`}>
                <div className="flex items-center justify-center h-full text-8xl text-black">
                  {SUBJECT_ICONS[goal.subject]}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl ${SUBJECT_COLORS[goal.subject]}`}>
                  {SUBJECT_ICONS[goal.subject]}
                </div>
                {hasReflections && (
                  <div className="bg-emerald-50 text-emerald-600 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-emerald-100">
                    <i className="fas fa-check-circle mr-1"></i> Afgerond
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-blue-600 transition-colors leading-tight">
                {goal.title}
              </h3>
              <p className="text-slate-400 text-sm italic line-clamp-2 leading-relaxed font-medium">{goal.description}</p>
              
              <div className="mt-8 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  {myReflections.length} reflecties
                </span>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
