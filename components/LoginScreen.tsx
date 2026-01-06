
import React from 'react';
import { User } from '../types';

interface Props {
  users: User[];
  onSelectUser: (user: User) => void;
}

export const LoginScreen: React.FC<Props> = ({ users, onSelectUser }) => {
  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-3xl shadow-xl mt-12 animate-fadeIn text-center">
      <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-6">
        <i className="fas fa-user-graduate"></i>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Welkom bij Reflectie-Ranger!</h2>
      <p className="text-slate-500 mb-8">Wie gaat er vandaag aan de slag?</p>
      
      {users.length === 0 ? (
        <div className="p-4 bg-amber-50 text-amber-700 rounded-xl text-sm border border-amber-100">
          <i className="fas fa-info-circle mr-2"></i>
          Er zijn nog geen leerlingen toegevoegd door de leerkracht.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user)}
              className="w-full p-4 text-left bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border-2 border-transparent hover:border-blue-200 rounded-2xl font-bold text-slate-700 transition-all flex items-center justify-between group"
            >
              <span>{user.name}</span>
              <i className="fas fa-chevron-right opacity-0 group-hover:opacity-100 transition-opacity"></i>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
