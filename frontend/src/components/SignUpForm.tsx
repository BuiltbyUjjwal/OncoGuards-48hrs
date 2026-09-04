import React, { useState } from 'react';
import {
  UserIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  SpinnerIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  CheckIcon,
} from '../assets/MedicalIcons';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import './SignUpForm.css';

interface SignUpFormProps {
  onSuccess?: (userEmail: string) => void;
  onNavigateToSignIn?: () => void;
  onViewTerms?: () => void;
  onViewPrivacy?: () => void;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreedToTerms?: string;
  general?: string;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSuccess,
  onNavigateToSignIn,
  onViewTerms,
  onViewPrivacy,
}) => {
  const { t } = useTranslation();
  const { signupWithEmail, loginWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Field validation helpers
  const validateFullName = (val: string): string | undefined => {
    if (!val.trim()) {
      return 'Full name is required.';
    }
    if (val.trim().length < 2) {
      return 'Please enter your full legal or preferred name.';
    }
    return undefined;
  };

  const validateEmail = (val: string): string | undefined => {
    if (!val.trim()) {
      return 'Email address is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      return 'Please enter a valid email address (e.g. name@example.com).';
    }
    return undefined;
  };

  const validatePassword = (val: string): string | undefined => {
    if (!val) {
      return 'Password is required.';
    }
    if (val.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    return undefined;
  };

  const validateConfirmPassword = (val: string, pwdVal: string): string | undefined => {
    if (!val) {
      return 'Please confirm your password.';
    }
    if (val !== pwdVal) {
      return 'Passwords do not match.';
    }
    return undefined;
  };

  const validateTerms = (agreed: boolean): string | undefined => {
    if (!agreed) {
      return 'You must agree to the Terms of Service and Privacy Policy.';
    }
    return undefined;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (field === 'fullName') {
      setErrors((prev) => ({ ...prev, fullName: validateFullName(fullName) }));
    } else if (field === 'email') {
      setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
    } else if (field === 'password') {
      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
      if (confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword, password) }));
      }
    } else if (field === 'confirmPassword') {
      setErrors((prev) => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword, password) }));
    }
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFullName(val);
    if (touched.fullName || errors.fullName) {
      setErrors((prev) => ({ ...prev, fullName: validateFullName(val), general: undefined }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (touched.email || errors.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(val), general: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (touched.password || errors.password) {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(val),
        confirmPassword: confirmPassword ? validateConfirmPassword(confirmPassword, val) : undefined,
        general: undefined,
      }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setConfirmPassword(val);
    if (touched.confirmPassword || errors.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(val, password),
        general: undefined,
      }));
    }
  };

  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAgreedToTerms(checked);
    if (touched.agreedToTerms || errors.agreedToTerms) {
      setErrors((prev) => ({ ...prev, agreedToTerms: validateTerms(checked) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessBanner(null);

    const nameErr = validateFullName(fullName);
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    const confirmErr = validateConfirmPassword(confirmPassword, password);
    const termsErr = validateTerms(agreedToTerms);

    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      agreedToTerms: true,
    });

    if (nameErr || emailErr || passErr || confirmErr || termsErr) {
      setErrors({
        fullName: nameErr,
        email: emailErr,
        password: passErr,
        confirmPassword: confirmErr,
        agreedToTerms: termsErr,
      });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const result = await signupWithEmail(
        email.trim(),
        password,
        fullName.trim()
      );

      if (!result.success) {
        setErrors({ general: result.error || 'Failed to create account. Please try again.' });
      } else {
        const userEmail = result.user?.email || email.trim();
        setSuccessBanner(`Account created successfully for ${userEmail}`);
        if (onSuccess) {
          onSuccess(userEmail);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setErrors({ general: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrors({});
    setSuccessBanner(null);
    setIsGoogleLoading(true);

    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setErrors({ general: result.error || 'Google registration failed.' });
      } else {
        const userEmail = result.user?.email || 'Google User';
        setSuccessBanner(`Registered with Google as ${userEmail}`);
        if (onSuccess) {
          onSuccess(userEmail);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign up encountered an error.';
      setErrors({ general: msg });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="signup-card" role="region" aria-label={t('auth.createAccountHeading', 'Create Account')}>
      {/* Card Header */}
      <div className="signup-card-header">
        <h1 className="signup-heading">{t('auth.createAccountHeading', 'Create Account')}</h1>
        <p className="signup-subtext">
          {t('auth.createAccountSub', 'Join OncoGuards AI for cancer risk awareness & early screening guidance')}
        </p>
      </div>

      {/* General Error Banner */}
      {errors.general && (
        <div className="signup-alert signup-alert-error" role="alert">
          <AlertCircleIcon size={18} className="alert-icon" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="signup-alert signup-alert-success" role="status" aria-live="polite">
          <CheckCircleIcon size={18} className="alert-icon" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Sign Up Form */}
      <form className="signup-form" onSubmit={handleSubmit} noValidate>
        {/* Full Name Field */}
        <div className="form-group">
          <label htmlFor="signup-name-input" className="form-label">
            {t('auth.fullNameLabel', 'Full Name')}
          </label>
          <div className={`input-wrapper ${errors.fullName ? 'input-wrapper-error' : ''}`}>
            <span className="input-icon" aria-hidden="true">
              <UserIcon size={18} />
            </span>
            <input
              id="signup-name-input"
              type="text"
              name="fullName"
              value={fullName}
              onChange={handleFullNameChange}
              onBlur={() => handleBlur('fullName')}
              placeholder={t('auth.fullNamePlaceholder', 'e.g. Dr. Alex Morgan')}
              autoComplete="name"
              required
              aria-required="true"
              aria-invalid={errors.fullName ? 'true' : 'false'}
              aria-describedby={errors.fullName ? 'signup-name-error' : undefined}
              className="form-input"
              disabled={isLoading || isGoogleLoading}
            />
          </div>
          {errors.fullName && (
            <div id="signup-name-error" className="field-error-message" role="alert">
              <AlertCircleIcon size={14} className="field-error-icon" />
              <span>{errors.fullName}</span>
            </div>
          )}
        </div>

        {/* Email Field */}
        <div className="form-group">
          <label htmlFor="signup-email-input" className="form-label">
            {t('auth.emailLabel', 'Email Address')}
          </label>
          <div className={`input-wrapper ${errors.email ? 'input-wrapper-error' : ''}`}>
            <span className="input-icon" aria-hidden="true">
              <MailIcon size={18} />
            </span>
            <input
              id="signup-email-input"
              type="email"
              name="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => handleBlur('email')}
              placeholder={t('auth.emailPlaceholder', 'name@example.com')}
              autoComplete="email"
              required
              aria-required="true"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'signup-email-error' : undefined}
              className="form-input"
              disabled={isLoading || isGoogleLoading}
            />
          </div>
          {errors.email && (
            <div id="signup-email-error" className="field-error-message" role="alert">
              <AlertCircleIcon size={14} className="field-error-icon" />
              <span>{errors.email}</span>
            </div>
          )}
        </div>

        {/* Password Field */}
        <div className="form-group">
          <label htmlFor="signup-password-input" className="form-label">
            {t('auth.passwordLabel', 'Password')}
          </label>
          <div className={`input-wrapper ${errors.password ? 'input-wrapper-error' : ''}`}>
            <span className="input-icon" aria-hidden="true">
              <LockIcon size={18} />
            </span>
            <input
              id="signup-password-input"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => handleBlur('password')}
              placeholder={t('auth.passwordPlaceholder', 'Create a strong password')}
              autoComplete="new-password"
              required
              aria-required="true"
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'signup-password-error' : undefined}
              className="form-input"
              disabled={isLoading || isGoogleLoading}
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={0}
            >
              {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          <PasswordStrengthIndicator password={password} />

          {errors.password && (
            <div id="signup-password-error" className="field-error-message" role="alert">
              <AlertCircleIcon size={14} className="field-error-icon" />
              <span>{errors.password}</span>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="form-group">
          <label htmlFor="signup-confirm-password-input" className="form-label">
            {t('auth.confirmPasswordLabel', 'Confirm Password')}
          </label>
          <div className={`input-wrapper ${errors.confirmPassword ? 'input-wrapper-error' : ''}`}>
            <span className="input-icon" aria-hidden="true">
              <LockIcon size={18} />
            </span>
            <input
              id="signup-confirm-password-input"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder={t('auth.confirmPasswordPlaceholder', 'Re-enter your password')}
              autoComplete="new-password"
              required
              aria-required="true"
              aria-invalid={errors.confirmPassword ? 'true' : 'false'}
              aria-describedby={errors.confirmPassword ? 'signup-confirm-error' : undefined}
              className="form-input"
              disabled={isLoading || isGoogleLoading}
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              tabIndex={0}
            >
              {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <div id="signup-confirm-error" className="field-error-message" role="alert">
              <AlertCircleIcon size={14} className="field-error-icon" />
              <span>{errors.confirmPassword}</span>
            </div>
          )}
        </div>

        {/* Terms and Privacy Checkbox */}
        <div className="terms-group">
          <label className="checkbox-custom-label">
            <div className="checkbox-wrapper">
              <input
                id="terms-checkbox"
                type="checkbox"
                checked={agreedToTerms}
                onChange={handleTermsChange}
                className="checkbox-native-input"
                aria-invalid={errors.agreedToTerms ? 'true' : 'false'}
                aria-describedby={errors.agreedToTerms ? 'terms-error-msg' : undefined}
                disabled={isLoading || isGoogleLoading}
              />
              <div className={`checkbox-custom-box ${agreedToTerms ? 'checked' : ''} ${errors.agreedToTerms ? 'error' : ''}`}>
                {agreedToTerms && <CheckIcon size={12} className="check-svg" />}
              </div>
            </div>
            <span className="terms-text">
              {t('auth.iAgreeToThe', 'I agree to the')}{' '}
              <button
                type="button"
                className="terms-link"
                onClick={onViewTerms}
              >
                {t('auth.terms', 'Terms of Service')}
              </button>{' '}
              {t('auth.and', 'and')}{' '}
              <button
                type="button"
                className="terms-link"
                onClick={onViewPrivacy}
              >
                {t('auth.privacy', 'Privacy Policy')}
              </button>
            </span>
          </label>
          {errors.agreedToTerms && (
            <div id="terms-error-msg" className="field-error-message" role="alert">
              <AlertCircleIcon size={14} className="field-error-icon" />
              <span>{errors.agreedToTerms}</span>
            </div>
          )}
        </div>

        {/* Create Account Primary Button */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || isGoogleLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <span className="btn-loading-content">
              <SpinnerIcon size={18} />
              <span>{t('auth.creatingAccount', 'Creating Account...')}</span>
            </span>
          ) : (
            <span>{t('auth.createAccountBtn', 'Create Account')}</span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="signup-divider">
        <span className="divider-line" />
        <span className="divider-text">{t('auth.orDivider', 'OR')}</span>
        <span className="divider-line" />
      </div>

      {/* Google OAuth Button */}
      <button
        type="button"
        className="btn btn-google"
        onClick={handleGoogleSignUp}
        disabled={isLoading || isGoogleLoading}
        aria-label={t('auth.continueWithGoogle', 'Continue with Google')}
      >
        {isGoogleLoading ? (
          <span className="btn-loading-content">
            <SpinnerIcon size={18} />
            <span>{t('auth.connectingGoogle', 'Connecting to Google...')}</span>
          </span>
        ) : (
          <span className="btn-google-content">
            <GoogleIcon size={18} />
            <span>{t('auth.continueWithGoogle', 'Continue with Google')}</span>
          </span>
        )}
      </button>

      {/* Bottom Sign-In Link */}
      <div className="signup-footer">
        <p className="signin-prompt">
          {t('auth.alreadyHaveAccount', 'Already have an account?')}{' '}
          <button
            type="button"
            className="signin-link"
            onClick={onNavigateToSignIn}
          >
            {t('auth.signInTitle', 'Sign In')}
          </button>
        </p>
      </div>
    </div>
  );
};
