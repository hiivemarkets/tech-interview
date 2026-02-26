export function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl mb-4 rounded-md bg-red-50 p-3">
      <p className="text-sm text-red-800">{message}</p>
      <button
        className="mt-1 text-xs text-red-600 underline"
        onClick={onDismiss}
      >
        Dismiss
      </button>
    </div>
  );
}
