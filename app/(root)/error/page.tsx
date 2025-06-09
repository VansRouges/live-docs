'use client';

import { useSearchParams } from 'next/navigation';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const message = searchParams.get('message');

  const friendlyMessages: Record<string, string> = {
    'no-read-access': 'You do not have permission to view this document.',
    'room-not-found': 'The document you’re looking for does not exist.',
    'load-failed': 'Failed to load the document.',
    'exception': message || 'Something went wrong.',
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
      <p className="text-lg text-gray-700">
        {friendlyMessages[reason || 'exception'] || 'An unknown error occurred.'}
      </p>
      <button onClick={() => window.history.back()} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded">
        Go Back
      </button>
    </main>
  );
}
