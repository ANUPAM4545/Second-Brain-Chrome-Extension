import React from 'react';

interface ConfidenceBadgeProps {
  score: number;
  level: 'High' | 'Medium' | 'Low';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score, level }) => {
  const getColors = () => {
    switch (level) {
      case 'High':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColors()} cursor-help`}
      title={`Confidence Score: ${(score * 100).toFixed(1)}%`}
    >
      {level} Confidence
    </span>
  );
};
