
import { LearningGoal, User } from "../types";

const API_BASE = "https://kvdb.io/S3V5W8h2Y8zY8zY8zY8zY8"; // Publieke demo bucket prefix

export interface AppState {
  goals: LearningGoal[];
  users: User[];
  lastUpdated: number;
}

/**
 * Synchroniseert de lokale staat met de cloud.
 * Maakt gebruik van een unieke classroomId om data te scheiden.
 */
export const syncService = {
  /**
   * Haalt de huidige staat op uit de cloud voor een specifieke klas.
   */
  fetchState: async (classroomId: string): Promise<AppState | null> => {
    try {
      const response = await fetch(`${API_BASE}/${classroomId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.warn("Sync fetch failed, using local data", error);
      return null;
    }
  },

  /**
   * Pusht de huidige staat naar de cloud.
   */
  pushState: async (classroomId: string, state: AppState): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/${classroomId}`, {
        method: 'POST',
        body: JSON.stringify({ ...state, lastUpdated: Date.now() }),
      });
      return response.ok;
    } catch (error) {
      console.warn("Sync push failed", error);
      return false;
    }
  },

  /**
   * Voegt twee staten samen zonder data te verliezen.
   * Prioriteit op basis van ID en nieuwheid.
   */
  mergeStates: (local: AppState, remote: AppState): AppState => {
    // Merge Users
    const userMap = new Map<string, User>();
    [...local.users, ...remote.users].forEach(u => userMap.set(u.id, u));

    // Merge Goals and their Reflections
    const goalMap = new Map<string, LearningGoal>();
    
    // Voeg eerst alle lokale doelen toe
    local.goals.forEach(g => goalMap.set(g.id, { ...g }));
    
    // Voeg remote doelen toe of merge reflecties
    remote.goals.forEach(remoteGoal => {
      const localGoal = goalMap.get(remoteGoal.id);
      if (!localGoal) {
        goalMap.set(remoteGoal.id, remoteGoal);
      } else {
        // Merge reflecties binnen het doel
        const reflectionMap = new Map();
        [...localGoal.reflections, ...remoteGoal.reflections].forEach(r => {
          const existing = reflectionMap.get(r.id);
          if (!existing || r.timestamp > existing.timestamp) {
            reflectionMap.set(r.id, r);
          }
        });
        localGoal.reflections = Array.from(reflectionMap.values());
      }
    });

    return {
      goals: Array.from(goalMap.values()),
      users: Array.from(userMap.values()),
      lastUpdated: Math.max(local.lastUpdated, remote.lastUpdated)
    };
  }
};
