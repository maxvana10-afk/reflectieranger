
import { LearningGoal, User, ReflectionEntry, Subject } from "../types";
import { INITIAL_GOALS } from "../constants";

// We gebruiken een publieke KV store voor deze demo om echt te kunnen synchroniseren tussen apparaten
const KV_BASE = "https://kvdb.io/S3V5W8h2Y8zY8zY8zY8zY8"; 

export interface SyncItem {
  type: 'REFLECTION' | 'GOAL' | 'USER';
  classroomId: string;
  payload: any;
  timestamp: number;
}

export interface AppState {
  goals: LearningGoal[];
  users: User[];
  lastUpdated: number;
}

export const databaseService = {
  /**
   * Beheer van de offline wachtrij
   */
  getQueue: (): SyncItem[] => JSON.parse(localStorage.getItem('sync_queue') || '[]'),
  
  addToQueue: (item: Omit<SyncItem, 'timestamp'>) => {
    const queue = databaseService.getQueue();
    const newItem = { ...item, timestamp: Date.now() };
    localStorage.setItem('sync_queue', JSON.stringify([...queue, newItem]));
    // Probeer direct te verwerken
    databaseService.processQueue();
  },

  clearQueue: (processedTimestamp: number) => {
    const queue = databaseService.getQueue();
    const remaining = queue.filter(item => item.timestamp !== processedTimestamp);
    localStorage.setItem('sync_queue', JSON.stringify(remaining));
  },

  /**
   * Probeert de wachtrij leeg te maken door de volledige staat te mergen
   */
  processQueue: async () => {
    const queue = databaseService.getQueue();
    if (queue.length === 0) return;

    // Voor deze demo verwerken we de wachtrij door de staat te verversen
    // In een echte app zouden we granulaire API calls doen
    const classroomId = queue[0].classroomId;
    const currentState = await databaseService.getFullState(classroomId);
    
    let updated = false;
    for (const item of queue) {
      if (item.type === 'REFLECTION') {
        const goal = currentState.goals.find(g => g.id === item.payload.goalId);
        if (goal) {
          // Voorkom dubbele reflecties
          if (!goal.reflections.some(r => r.id === item.payload.reflection.id)) {
            goal.reflections.push(item.payload.reflection);
            updated = true;
          }
        }
      } else if (item.type === 'GOAL') {
        if (!currentState.goals.some(g => g.id === item.payload.id)) {
          currentState.goals.push(item.payload);
          updated = true;
        }
      } else if (item.type === 'USER') {
        if (!currentState.users.some(u => u.id === item.payload.id)) {
          currentState.users.push(item.payload);
          updated = true;
        }
      }
      databaseService.clearQueue(item.timestamp);
    }

    if (updated) {
      await databaseService.saveFullState(classroomId, currentState);
    }
  },

  /**
   * Haalt de volledige staat op
   */
  getFullState: async (classroomId: string): Promise<AppState> => {
    try {
      const response = await fetch(`${KV_BASE}/${classroomId}`);
      if (response.ok) {
        const remoteState = await response.json();
        localStorage.setItem(`cache_${classroomId}`, JSON.stringify(remoteState));
        return remoteState;
      }
    } catch (e) {
      console.warn("Sync failed, using cache");
    }
    
    const cache = localStorage.getItem(`cache_${classroomId}`);
    if (cache) return JSON.parse(cache);

    return {
      goals: INITIAL_GOALS,
      users: [],
      lastUpdated: Date.now()
    };
  },

  saveFullState: async (classroomId: string, state: AppState) => {
    try {
      state.lastUpdated = Date.now();
      await fetch(`${KV_BASE}/${classroomId}`, {
        method: 'POST',
        body: JSON.stringify(state)
      });
      localStorage.setItem(`cache_${classroomId}`, JSON.stringify(state));
    } catch (e) {
      console.error("Save failed", e);
    }
  },

  fetchUsers: async (classroomId: string): Promise<User[]> => {
    const state = await databaseService.getFullState(classroomId);
    return state.users;
  },

  createUser: async (classroomId: string, name: string): Promise<User> => {
    const newUser = { id: Date.now().toString(), name };
    const state = await databaseService.getFullState(classroomId);
    state.users.push(newUser);
    await databaseService.saveFullState(classroomId, state);
    return newUser;
  },

  createGoal: async (classroomId: string, goal: { subject: Subject; title: string; description: string }): Promise<LearningGoal> => {
    const newGoal: LearningGoal = {
      id: Date.now().toString(),
      subject: goal.subject,
      title: goal.title,
      description: goal.description,
      reflections: []
    };
    const state = await databaseService.getFullState(classroomId);
    state.goals.push(newGoal);
    await databaseService.saveFullState(classroomId, state);
    return newGoal;
  },

  fetchGoals: async (classroomId: string): Promise<LearningGoal[]> => {
    const state = await databaseService.getFullState(classroomId);
    return state.goals;
  },

  addReflection: async (classroomId: string, goalId: string, reflection: ReflectionEntry): Promise<boolean> => {
    try {
      const state = await databaseService.getFullState(classroomId);
      const goal = state.goals.find(g => g.id === goalId);
      if (goal) {
        goal.reflections.push(reflection);
        await databaseService.saveFullState(classroomId, state);
        return true;
      }
    } catch (e) {
      databaseService.addToQueue({ 
        type: 'REFLECTION', 
        classroomId, 
        payload: { goalId, reflection } 
      });
    }
    return false;
  }
};
