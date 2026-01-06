
import React from 'react';
import { Subject } from './types';

export const SUBJECT_COLORS: Record<Subject, string> = {
  [Subject.Geography]: 'bg-blue-500',
  [Subject.History]: 'bg-amber-600',
  [Subject.Science]: 'bg-emerald-500',
  [Subject.Citizenship]: 'bg-indigo-500',
  [Subject.Traffic]: 'bg-orange-500',
  [Subject.Arts]: 'bg-pink-500',
  [Subject.Language]: 'bg-cyan-600',
  [Subject.Math]: 'bg-violet-600',
  [Subject.SocialEmotional]: 'bg-rose-400',
  [Subject.Other]: 'bg-slate-500'
};

export const SUBJECT_ICONS: Record<Subject, React.ReactNode> = {
  [Subject.Geography]: <i className="fas fa-globe-europe"></i>,
  [Subject.History]: <i className="fas fa-monument"></i>,
  [Subject.Science]: <i className="fas fa-flask"></i>,
  [Subject.Citizenship]: <i className="fas fa-users"></i>,
  [Subject.Traffic]: <i className="fas fa-car"></i>,
  [Subject.Arts]: <i className="fas fa-palette"></i>,
  [Subject.Language]: <i className="fas fa-book"></i>,
  [Subject.Math]: <i className="fas fa-calculator"></i>,
  [Subject.SocialEmotional]: <i className="fas fa-heart"></i>,
  [Subject.Other]: <i className="fas fa-layer-group"></i>
};

export const INITIAL_GOALS = [
  {
    id: '1',
    subject: Subject.Geography,
    title: 'De loop van een rivier',
    description: 'Ik kan uitleggen hoe een rivier van de bergen naar de zee stroomt.',
    reflections: []
  },
  {
    id: '2',
    subject: Subject.History,
    title: 'De Romeinen in Nederland',
    description: 'Ik weet waarom de Romeinen naar Nederland kwamen en wat de Limes zijn.',
    reflections: []
  }
];
