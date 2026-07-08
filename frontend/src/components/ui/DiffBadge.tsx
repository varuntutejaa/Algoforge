const map: Record<string, string> = {
  easy:   'text-green-300 bg-green-400/10',
  medium: 'text-yellow-300 bg-yellow-400/10',
  hard:   'text-red-400 bg-red-400/10',
};

export default function DiffBadge({ difficulty }: { difficulty: string }) {
  const cls = map[difficulty?.toLowerCase()] ?? 'text-slate-400 bg-slate-400/10';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${cls}`}>
      {difficulty}
    </span>
  );
}
