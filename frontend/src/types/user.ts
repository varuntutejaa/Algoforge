export interface AlgoforgeUser {
  id: string;
  uid: string;
  firebaseUid: string;
  name: string;
  email: string;
  photoURL: string;
}

export interface ProfileStats {
  name: string;
  email: string;
  problemsSolved: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  currentStreak: number;
  longestStreak: number;
}

export interface SolvedItem {
  id: string;
  title: string;
  difficulty: string;
  tags: string[];
  solvedAt: string;
}

export interface ActivityEntry {
  date: string;
  count: number;
}
