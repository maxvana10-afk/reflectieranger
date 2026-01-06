
import React, { useState, useRef, useEffect } from 'react';
import { LearningGoal, Subject, User } from '../types';
import { SUBJECT_COLORS, SUBJECT_ICONS } from '../constants';
import { ReflectionEntryList, MASTERY_INFO } from './ReflectionEntryList';
import { getAIFeedback, getMasteryGuidance, MasteryLevelGuidance, MasteryGuidanceResponse } from '../services/geminiService';

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
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [masteryData, setMasteryData] = useState<MasteryGuidanceResponse | null>(null);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedGoal) {
      setMasteryData(null);
      setAiSuggestion(null);
      getMasteryGuidance(selectedGoal.title, selectedGoal.description).then(setMasteryData);
    }
  }, [selectedGoal]);

  const handleGetHelp = async () => {
    if (!selectedGoal || !draft.trim()) return;
    setIsAiLoading(true);
    const feedback = await getAIFeedback(
      selectedGoal.subject,
      selectedGoal.title,
      selectedGoal.description,
      draft
    );
    setAiSuggestion(feedback);
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

  const handleSubmit = () => {
    if (!selectedGoal || !draft.trim()) return;
    onAddReflection(selectedGoal.id, draft, masteryLevel, photo || undefined);
    setDraft('');
    setAiSuggestion(null);
    setPhoto(null);
    setMasteryLevel(3);
    setShowCheatSheet(false);
  };

  if (selectedGoal) {
    const userReflections = selectedGoal.reflections.filter(r => r.userId === currentUser.id);
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

        <div className={`p-6 rounded-2xl shadow-lg mb-8 text-white ${SUBJECT_COLORS[selectedGoal.subject]}`}>
          <div className="flex items-center gap-3 mb-2">
             <span className="text-2xl">{SUBJECT_ICONS[selectedGoal.subject]}</span>
             <span className="uppercase tracking-widest text-xs font-bold opacity-80">{selectedGoal.subject}</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">{selectedGoal.title}</h2>
          <p className="text-white/90 text-lg leading-snug">{selectedGoal.description}</p>
        </div>

        <ReflectionEntryList entries={userReflections} />

        <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-blue-50 relative">
          <div className="flex justify-between items-center mb-4">
            <label className="text-slate-700 font-bold text-lg">
              Hoe gaat het nu?
            </label>
            <button 
              onClick={() => setShowCheatSheet(!showCheatSheet)}
              className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-2"
            >
              <i className="fas fa-lightbulb"></i>
              {showCheatSheet ? "Sluit hulp" : "Hoe schrijf ik dit?"}
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {MASTERY_INFO.map((m) => (
              <button
                key={m.level}
                onClick={() => setMasteryLevel(m.level)}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center relative ${
                  masteryLevel === m.level 
                    ? `${m.bg} ${m.color.replace('text-', 'border-')} ring-4 ring-offset-2 ${m.color.replace('text-', 'ring-').replace('500', '100')}` 
                    : 'border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                <i className={`${m.icon} text-2xl`}></i>
                <span className="text-[11px] font-bold leading-tight">{m.label}</span>
              </button>
            ))}
          </div>

          {showCheatSheet && masteryData && (
            <div className="mb-8 bg-blue-50/50 rounded-2xl border-2 border-blue-100 p-5 animate-slideDown">
              <div className="flex flex-col gap-1 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">
                    <i className="fas fa-info"></i>
                  </div>
                  <h4 className="text-blue-800 font-bold text-sm">Hulp bij je antwoord</h4>
                </div>
                <p className="text-[10px] text-blue-600 font-bold bg-blue-100 px-2 py-1 rounded inline-block mt-2">
                  LET OP: De voorbeelden gaan over "{masteryData.referenceGoal}"
                </p>
              </div>
              
              <div className="space-y-4">
                {masteryData.levels.map((m) => {
                  const info = MASTERY_INFO.find(info => info.level === m.level)!;
                  const isActive = m.level === masteryLevel;
                  return (
                    <div key={m.level} className={`p-4 rounded-xl border-2 transition-all ${isActive ? 'bg-white border-blue-300 shadow-md scale-[1.02]' : 'bg-white/40 border-slate-100 opacity-50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <i className={`${info.icon} ${info.color} text-sm`}></i>
                        <span className={`text-[10px] font-bold uppercase ${info.color}`}>{info.label}</span>
                      </div>
                      
                      {/* Uitleg voor het ECHTE doel */}
                      <p className="text-slate-800 text-xs font-bold mb-3">"{m.guidance}"</p>
                      
                      {/* Voorbeeld van het ANDERE doel */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                          Voorbeeld van "{masteryData.referenceGoal}":
                        </p>
                        <p className="text-slate-600 text-xs italic leading-relaxed">
                          "{m.example}"
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 mt-4 text-center italic">
                Bekijk hoe uitgebreid het voorbeeld is en doe dat ook bij jouw eigen antwoord!
              </p>
            </div>
          )}

          {!showCheatSheet && currentGuidance && (
            <div className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-fadeIn">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Jouw keuze betekent:</p>
              <p className="text-slate-700 font-bold text-sm">"{currentGuidance.guidance}"</p>
            </div>
          )}

          <div className="relative">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full h-44 p-4 rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-0 outline-none transition-all resize-none text-slate-700 mb-4"
              placeholder="Vertel hier wat je hebt geleerd over dit doel..."
            />
          </div>

          <div className="mb-6">
            <p className="text-slate-600 font-semibold mb-2 text-sm flex items-center gap-2">
              <i className="fas fa-camera"></i> Foto van je werk (bewijs)
            </p>
            {!photo ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-300 hover:text-blue-400 transition-all flex flex-col items-center justify-center gap-1"
              >
                <i className="fas fa-cloud-upload-alt text-2xl"></i>
                <span className="text-sm font-medium">Klik om een foto te maken</span>
              </button>
            ) : (
              <div className="relative group inline-block">
                <img src={photo} alt="Preview" className="w-48 h-48 object-cover rounded-xl border-2 border-blue-100 shadow-sm" />
                <button onClick={() => setPhoto(null)} className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" capture="environment" className="hidden" />
          </div>

          {aiSuggestion && (
            <div className="mt-4 p-4 bg-amber-50 rounded-xl border-l-4 border-amber-400 flex gap-3 animate-slideDown">
              <span className="text-2xl mt-1">💡</span>
              <div>
                <p className="font-bold text-amber-800 text-sm mb-1">Tip van de Ranger:</p>
                <p className="text-amber-900 text-sm leading-relaxed">{aiSuggestion}</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGetHelp}
              disabled={!draft.trim() || isAiLoading}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isAiLoading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-magic"></i>}
              Help mij verbeteren
            </button>
            <button
              onClick={handleSubmit}
              disabled={!draft.trim()}
              className="flex-1 bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-paper-plane"></i> Opslaan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Hallo {currentUser.name}!</h1>
          <p className="text-slate-500">Wat heb je vandaag geleerd?</p>
        </div>
        <button onClick={onLogout} className="text-slate-400 hover:text-blue-600 font-bold flex items-center gap-2 transition-colors">
          <i className="fas fa-sign-out-alt"></i> Wissel van leerling
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const myReflections = goal.reflections.filter(r => r.userId === currentUser.id);
          return (
            <button
              key={goal.id}
              onClick={() => setSelectedGoal(goal)}
              className="group bg-white p-6 rounded-2xl shadow-md border-2 border-transparent hover:border-blue-400 transition-all text-left"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl text-white ${SUBJECT_COLORS[goal.subject]}`}>
                  {SUBJECT_ICONS[goal.subject]}
                </div>
                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full font-bold">
                  {myReflections.length} reflecties
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                {goal.title}
              </h3>
              <p className="text-slate-500 line-clamp-2 text-sm italic">{goal.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
