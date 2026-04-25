"use client";

interface Props {
  text: string;
  isStreaming: boolean;
  responseCount: number;
}

export default function SynthesisPanel({ text, isStreaming, responseCount }: Props) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-green-900">Neighbourhood insight</h3>
        <span className="text-sm text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
          {responseCount} responses · illustrative
        </span>
      </div>
      <div className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">
        {text}
        {isStreaming && (
          <span className="inline-block w-1 h-4 bg-green-600 animate-pulse ml-0.5 align-middle" />
        )}
      </div>
      <p className="mt-3 text-xs text-stone-400">
        Based on {responseCount} illustrative responses. Simulated for demo purposes.
      </p>
    </div>
  );
}
