'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Landing page: Labeler authentication/selection
 *
 * Features:
 * - 4 labeler IDs: labeler_1, labeler_2, labeler_3, labeler_4
 * - Auto-detection from URL query parameter
 * - Simple selection interface with buttons
 * - Stores labeler ID in localStorage
 * - Redirects to /label page
 */
function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedLabeler, setSelectedLabeler] = useState<string>('');

  // Auto-detect labeler from URL query parameter
  useEffect(() => {
    const labelerParam = searchParams.get('labeler');
    if (labelerParam && ['labeler_1', 'labeler_2', 'labeler_3', 'labeler_4'].includes(labelerParam)) {
      setSelectedLabeler(labelerParam);
      // Auto-navigate if valid labeler in URL
      localStorage.setItem('labeler_id', labelerParam);
      router.push('/label');
    }
  }, [searchParams, router]);

  const handleStart = () => {
    if (!selectedLabeler) {
      alert('Please select a labeler ID');
      return;
    }

    // Store labeler_id in localStorage
    localStorage.setItem('labeler_id', selectedLabeler);

    // Navigate to /label
    router.push('/label');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">
          Mathebattle Labeling
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Common Core Standards Annotation Interface
        </p>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Select your labeler ID:
          </label>

          <div className="grid grid-cols-2 gap-3">
            {['labeler_1', 'labeler_2', 'labeler_3', 'labeler_4'].map((id) => (
              <button
                key={id}
                onClick={() => setSelectedLabeler(id)}
                className={`
                  px-4 py-3 rounded-md font-medium transition-all
                  ${selectedLabeler === id
                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow'}
                `}
              >
                {id.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={handleStart}
            disabled={!selectedLabeler}
            className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            Start Labeling
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>To auto-login, use URL with ?labeler=labeler_1</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
