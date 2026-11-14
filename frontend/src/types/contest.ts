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
  /** User id of the creator; only they can end the contest early. */
  createdBy?: string;
  createdByName: string;
  /** Private contests aren't listed anywhere; people join with the code. */
  isPrivate?: boolean;
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
  name: string;
  /** Avatar URL; empty for accounts without one (email sign-ups). */
  profilePicture?: string;
  email?: string;
  score: number;
  penalty: number;
  wrongAttempts: number;
  solvedProblems: string[];
  timeTakenSeconds: number | null;
  perProblemTimes?: Record<string, number>;
}
