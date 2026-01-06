
import React, { useState } from 'react';

interface Props {
  onSetClassroom: (id: string) => void;
}

export const ClassroomPicker: React.FC<Props> = ({ onSetClassroom }) => {
  const [code, setCode] = useState('');
  const recentClassrooms = JSON.parse(localStorage.getItem('recent_classrooms') || '[]');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onSetClassroom(code.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-indigo-600">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 animate-fadeIn text-center relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-blue-400 to-emerald-400"></div>
        
        <div className="w-24 h-24 bg-blue-500 rounded-3xl flex items-center justify-center text-white text-5xl mx-auto mb-8 shadow-xl shadow-blue-100 rotate-3">
          <i className="fas fa-mountain"></i>
        </div>

        <h1 className="text-3xl font-black text-slate-800 mb-2">Reflectie-Ranger</h1>
        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
          Klaar voor je reflectie-avontuur? <br/>Voer je groepscode in om te beginnen.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Bijv: GROEP7B"
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-400 focus:bg-white text-center text-xl font-black tracking-widest uppercase transition-all placeholder:text-slate-300 placeholder:font-bold placeholder:tracking-normal"
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            disabled={!code.trim()}
            className="w-full bg-blue-500 text-white font-black py-5 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-600 disabled:opacity-50 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3"
          >
            <span>Start Avontuur</span>
            <i className="fas fa-arrow-right"></i>
          </button>
        </form>

        {recentClassrooms.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Onlangs bezocht</p>
            <div className="flex flex-wrap justify-center gap-2">
              {recentClassrooms.map((c: string) => (
                <button
                  key={c}
                  onClick={() => onSetClassroom(c)}
                  className="px-4 py-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-full text-xs font-bold transition-all border border-transparent hover:border-blue-100"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-6 text-slate-300">
           <i className="fas fa-shield-halved text-xl"></i>
           <i className="fas fa-wifi text-xl"></i>
           <i className="fas fa-cloud-sun text-xl"></i>
        </div>
      </div>
    </div>
  );
};
