'use client'

import { useState, useEffect } from 'react'

interface TutorialProps {
  onComplete: () => void
}

export default function Tutorial({ onComplete }: TutorialProps) {
  const [step, setStep] = useState(1)

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  useEffect(() => {
    // Disable scrolling when tutorial is active
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40" />

      {/* Tutorial Card - positioned based on step */}
      <div
        className={`absolute left-1/2 transform -translate-x-1/2 pointer-events-auto ${
          step === 1 ? 'top-8' :
          step === 2 ? 'top-1/2 -translate-y-1/2' :
          'bottom-8'
        }`}
      >
        <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4">
          <div className="text-center">
            {step === 1 && (
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Step 1: Select a Day
                </h3>
                <p className="text-gray-700 mb-6 text-lg">
                  These are the days that contain the matches. Click on a day to view its matches.
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Step 2: Make Your Picks
                </h3>
                <p className="text-gray-700 mb-6 text-lg">
                  These are the matches in the pick'em. Click on a team to select them as the winner, predict scores, and save your pick!
                </p>
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Step 3: Check the Leaderboard
                </h3>
                <p className="text-gray-700 mb-6 text-lg">
                  This is how ranks are determined. Earn points by correctly predicting match winners and scores. Compete with other players!
                </p>
              </>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleSkip}
                className="px-5 py-2.5 text-gray-600 hover:text-gray-800 font-medium border-2 border-gray-300 rounded hover:border-gray-400 transition-colors"
              >
                Skip Tutorial
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded hover:bg-orange-600 transition-colors"
              >
                {step === 3 ? 'Got it!' : 'Next'}
              </button>
            </div>

            <div className="mt-4 flex gap-2 justify-center">
              {[1, 2, 3].map((dot) => (
                <div
                  key={dot}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    step === dot ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
