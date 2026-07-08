export interface Problem {
  id: string;
  title: string;
  difficulty: string;
  tags: string[];
  summary?: string;
  testCaseCount?: number;
  testCases?: TestCase[];
}

export interface ProblemDetail extends Problem {
  description: string[];
  constraints: string[];
  example: string;
  boilerplate: Record<Language, string>;
  testCases: TestCase[];
  runner: string | null;
}

export interface TestCase {
  name: string;
  input: string;
  expected: string;
}

export type Language = 'c' | 'cpp' | 'java' | 'js' | 'python';

export interface SubmitResult {
  passed: boolean;
  verdict: string;
  results: Array<{
    name: string;
    passed: boolean;
    output: string;
    expected: string;
    time?: number;
  }>;
}
