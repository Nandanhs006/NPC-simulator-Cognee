"use client";

export default function ErrorBoundary({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#0B0F19] text-gray-200 p-8 gap-4 min-h-[400px]">
      <h1 className="font-serif font-bold text-amber-500 text-xl">Something went wrong</h1>
      <p className="text-xs text-gray-400 italic">An unexpected error occurred. Please try again.</p>
      <button
        onClick={reset}
        className="bg-amber-600 hover:bg-amber-700 text-white font-serif px-4 py-2 rounded-md text-xs cursor-pointer transition-colors mt-2"
      >
        Try again
      </button>
    </div>
  );
}
