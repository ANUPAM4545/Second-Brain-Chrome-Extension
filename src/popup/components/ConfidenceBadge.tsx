import React from 'react';

interface ConfidenceBadgeProps {
  score: number;
  level: 'High' | 'Medium' | 'Low';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score, level }) => {
  const getColors = () => {
    switch (level) {
      case 'High':
        return 'bg-success/10 text-success border-success/20';
      case 'Medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Low':
        return 'bg-danger/10 text-danger border-danger/20';
      default:
        return 'bg-gray-800 text-gray-700 border-gray-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-widest border ${getColors()} cursor-help transition-colors`}
      title={`Confidence Score: ${(score * 100).toFixed(1)}%`}
    >
      {level}
    </span>
  );
};
