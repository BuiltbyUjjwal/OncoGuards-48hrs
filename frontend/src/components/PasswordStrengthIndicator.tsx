import React from 'react';
import './PasswordStrengthIndicator.css';

interface PasswordStrengthProps {
  password: string;
}

export interface StrengthAssessment {
  score: number; // 0 to 4
  label: string;
  colorClass: string;
  feedback: string;
}

export const calculatePasswordStrength = (pwd: string): StrengthAssessment => {
  if (!pwd) {
    return { score: 0, label: '', colorClass: '', feedback: '' };
  }

  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  switch (score) {
    case 1:
      return {
        score: 1,
        label: 'Weak',
        colorClass: 'strength-weak',
        feedback: 'Add uppercase letters, numbers or symbols for higher security.',
      };
    case 2:
      return {
        score: 2,
        label: 'Fair',
        colorClass: 'strength-fair',
        feedback: 'Consider adding special characters or numbers.',
      };
    case 3:
      return {
        score: 3,
        label: 'Good',
        colorClass: 'strength-good',
        feedback: 'Strong password. Meets clinical security standards.',
      };
    case 4:
      return {
        score: 4,
        label: 'Strong',
        colorClass: 'strength-strong',
        feedback: 'Excellent security! Protects clinical data privacy.',
      };
    default:
      return {
        score: 1,
        label: 'Too short',
        colorClass: 'strength-weak',
        feedback: 'Password must be at least 8 characters.',
      };
  }
};

export const PasswordStrengthIndicator: React.FC<PasswordStrengthProps> = ({ password }) => {
  if (!password) return null;

  const { score, label, colorClass, feedback } = calculatePasswordStrength(password);

  return (
    <div className="password-strength-container" aria-live="polite">
      <div className="strength-header">
        <span className="strength-title">Password Security:</span>
        <span className={`strength-label ${colorClass}`}>{label}</span>
      </div>

      <div className="strength-bars" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={4}>
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`strength-bar-segment ${index <= score ? `active ${colorClass}` : ''}`}
          />
        ))}
      </div>

      {feedback && <p className="strength-feedback-text">{feedback}</p>}
    </div>
  );
};
