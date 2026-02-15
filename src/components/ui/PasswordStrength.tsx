/**
 * Password Strength Indicator Component
 * Shows real-time password strength feedback to users
 */

import { useState, useEffect } from 'react';
import { validatePassword, getStrengthColor, getStrengthLabel, type PasswordValidationResult } from '@/lib/security/passwordValidator';
import { Info, Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  userInfo?: {
    email?: string;
    name?: string;
    company?: string;
  };
  showRequirements?: boolean;
}

export function PasswordStrength({ password, userInfo, showRequirements = true }: PasswordStrengthProps) {
  const [validation, setValidation] = useState<PasswordValidationResult | null>(null);

  useEffect(() => {
    if (password.length > 0) {
      const result = validatePassword(password, userInfo);
      setValidation(result);
    } else {
      setValidation(null);
    }
  }, [password, userInfo]);

  if (!password) return null;

  const strengthColors = {
    'weak': 'bg-red-500',
    'fair': 'bg-orange-500',
    'good': 'bg-yellow-500',
    'strong': 'bg-green-500',
    'very-strong': 'bg-emerald-600',
  };

  const strengthWidth = validation ? `${validation.score}%` : '0%';

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Password Strength</span>
          {validation && (
            <span className={`font-medium capitalize ${getStrengthColor(validation.strength)}`}>
              {getStrengthLabel(validation.strength)}
            </span>
          )}
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              validation ? strengthColors[validation.strength] : 'bg-gray-300'
            }`}
            style={{ width: strengthWidth }}
          />
        </div>
      </div>

      {/* Errors */}
      {validation && validation.errors.length > 0 && (
        <div className="space-y-1">
          {validation.errors.map((error, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-red-600">
              <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {validation && validation.suggestions.length > 0 && validation.errors.length === 0 && (
        <div className="space-y-1">
          {validation.suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-blue-600">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      )}

      {/* Valid Password */}
      {validation && validation.isValid && validation.score >= 70 && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check className="w-4 h-4" />
          <span>Your password is strong and secure!</span>
        </div>
      )}

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="pt-2 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</div>
          <div className="space-y-1">
            <Requirement met={password.length >= 12} text="At least 12 characters" />
            <Requirement met={/[A-Z]/.test(password)} text="One uppercase letter" />
            <Requirement met={/[a-z]/.test(password)} text="One lowercase letter" />
            <Requirement met={/\d/.test(password)} text="One number" />
            <Requirement met={/[^A-Za-z0-9]/.test(password)} text="One special character (!@#$%^&*)" />
          </div>
        </div>
      )}
    </div>
  );
}

interface RequirementProps {
  met: boolean;
  text: string;
}

function Requirement({ met, text }: RequirementProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
      )}
      <span className={met ? 'text-green-600' : 'text-gray-500'}>{text}</span>
    </div>
  );
}
