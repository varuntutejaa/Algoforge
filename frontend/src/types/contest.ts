export interface Contest {
  code: string;
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  problems: ContestProblem[];
  problemCount: number;
  participantCount: number;
  participants?: any[];
  createdByName: string;
  status?: 'upcoming' | 'active' | 'ended';
  source?: 'algoforge' | 'codeforces' | 'leetcode' | 'codechef' | 'atcoder' | 'hackerrank';
  cfId?: number;
  lcSlug?: string;
  ccCode?: string;
  atId?: string;
  hrSlug?: string;
}

export interface ContestProblem {
  problemId: string;
  title: string;
  difficulty?: string;
  points?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId?: string;
  firebaseUid?: string;
  name: string;
  email?: string;
  score: number;
  penalty: number;
  wrongAttempts: number;
  solvedProblems: string[];
  timeTakenSeconds: number | null;
  perProblemTimes?: Record<string, number>;
}
