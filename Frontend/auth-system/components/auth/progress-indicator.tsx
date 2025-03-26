"use client"

interface ProgressIndicatorProps {
  progress: number
  fullScreen?: boolean
}

export default function ProgressIndicator({ progress, fullScreen = false }: ProgressIndicatorProps) {
  // Calculate the circumference of the circle
  const radius = 40
  const circumference = 2 * Math.PI * radius

  // Calculate the dash offset based on progress
  const dashOffset = circumference - (progress / 100) * circumference

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#333"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset="0"
            />

            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 50 50)"
              className="transition-all duration-300 ease-in-out"
            />

            {/* Dashed overlay for the segmented look */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="white"
              strokeWidth="4"
              strokeDasharray="2 4"
              strokeOpacity="0.5"
            />
          </svg>

          {/* Percentage text - positioned absolutely in the center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">{`${Math.round(progress)}%`}</span>
          </div>
        </div>
        <p className="text-white mt-4 text-xl">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="#333"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset="0"
          />

          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 50 50)"
            className="transition-all duration-300 ease-in-out"
          />

          {/* Dashed overlay for the segmented look */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="white"
            strokeWidth="4"
            strokeDasharray="2 4"
            strokeOpacity="0.5"
          />
        </svg>

        {/* Percentage text - positioned absolutely in the center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white text-xl font-bold">{`${Math.round(progress)}%`}</span>
        </div>
      </div>
      <p className="text-muted-foreground mt-2">Loading...</p>
    </div>
  )
}

