
import React from 'react';
import { ReflectionEntry } from '../types';

interface Props {
  entries: ReflectionEntry[];
}

export const MASTERY_INFO = [
  { level: 1, icon: 'fas fa-sad-tear', color: 'text-red-500', bg: 'bg-red-50', label: 'Nog erg lastig' },
  { level: 2, icon: 'fas fa-meh', color: 'text-amber-500', bg: 'bg-amber-50', label: 'Een beetje moeilijk' },
  { level: 3, icon: 'fas fa-smile', color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Lukt al goed' },
  { level: 4, icon: 'fas fa-star', color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Ik kan dit uitleggen!' },
];

export const ReflectionEntryList: React.FC<Props> = ({ entries }) => {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <h3 className="text-lg font-bold text-slate-700">Jouw eerdere antwoorden:</h3>
      <div className="border-l-4 border-blue-200 pl-4 space-y-6">
        {entries.map((entry) => {
          const mastery = MASTERY_INFO.find(m => m.level === entry.masteryLevel) || MASTERY_INFO[0];
          return (
            <div key={entry.id} className="relative bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <div className="absolute -left-[26px] top-4 w-4 h-4 rounded-full bg-blue-400 border-2 border-white shadow-sm"></div>
              
              <div className="flex justify-between items-start mb-2">
                <div className="text-xs text-slate-400">
                  {new Date(entry.timestamp).toLocaleString('nl-NL')}
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${mastery.bg} ${mastery.color}`}>
                  <i className={mastery.icon}></i>
                  {mastery.label}
                </div>
              </div>
              
              {entry.photoBase64 && (
                <div className="mb-3 rounded-lg overflow-hidden border border-slate-200 max-w-xs">
                  <img 
                    src={entry.photoBase64} 
                    alt="Bewijsmateriaal" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed italic">
                "{entry.content}"
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
