
import React, { useState } from 'react';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export const TeacherAuth: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Het wachtwoord is hier "RangerGeheim". In een productie-app zou dit veiliger moeten.
    if (password === 'Ranger') {
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
      setPassword('');
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-[3rem] shadow-xl mt-12 animate-fadeIn text-center border border-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-8xl text-slate-900 pointer-events-none">
        <i className="fas fa-lock"></i>
      </div>

      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-6 shadow-lg shadow-slate-200">
        <i className="fas fa-user-shield"></i>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800 mb-1">Leerkracht Toegang</h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Voer het wachtwoord in</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Wachtwoord..."
          autoFocus
          className={`w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none text-center text-lg font-bold transition-all ${
            error ? 'border-red-400 bg-red-50 animate-shake' : 'border-slate-100 focus:border-slate-400 focus:bg-white'
          }`}
        />
        
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-slate-100 text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={!password}
            className="bg-slate-800 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-slate-900 disabled:opacity-50 transition-all text-xs uppercase tracking-widest"
          >
            Inloggen
          </button>
        </div>
      </form>

      <p className="mt-8 text-slate-300 text-[10px] font-bold italic leading-tight">
        Alleen de leerkracht kan doelen aanmaken <br/>en de voortgang van de hele klas bekijken.
      </p>
    </div>
  );
};
