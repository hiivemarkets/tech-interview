export function StatusBadge({
  active,
  secondsLeft,
}: {
  active: boolean;
  secondsLeft: number | null;
}) {
  const color = active ? "fill-green-500" : "fill-red-500";
  const label = active
    ? `0:${String(secondsLeft ?? 0).padStart(2, "0")}`
    : "Ended";

  return (
    <span className="inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium text-gray-900 ring-1 ring-inset ring-gray-200">
      <svg className={`h-1.5 w-1.5 ${color}`} viewBox="0 0 6 6" aria-hidden="true">
        <circle cx={3} cy={3} r={3} />
      </svg>
      {label}
    </span>
  );
}
