import React, { useState } from 'react';
import {
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  SpinnerIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from '../assets/MedicalIcons';
import { executeEmailSignIn, executeGoogleOAuth, isClerkConfigured } from './ClerkAuthAdapter';
import './LoginForm.css';

interface LoginFormProps {
  onSuccess?: (userEmail: string) => void;
  onNavigateToSignUp?: () => void;
  onForgotPassword?: () => void;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onNavigateToSignUp,
  onForgotPassword,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Email format validation
  const validateEmail = (val: string): string | undefined => {
    if (!val.trim()) {
      return 'Email address is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) {
      return 'Please enter a valid email address (e.g. name@hospital.com).';
    }
    return undefined;
  };

  // Password validation
  const validatePassword = (val: string): string | undefined => {
    if (!val) {
      return 'Password is required.';
    }
    if (val.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    return undefined;
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') {
      const err = validateEmail(email);
      setErrors((prev) => ({ ...prev, email: err }));
    } else if (field === 'password') {
      const err = validatePassword(password);
      setErrors((prev) => ({ ...prev, password: err }));
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
      setErrors((prev) => ({ ...prev, password: validatePassword(val), general: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessBanner(null);

    // Validate all fields
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);

    setTouched({ email: true, password: true });

    if (emailErr || passErr) {
      setErrors({
        email: emailErr,
        password: passErr,
      });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const result = await executeEmailSignIn({ email: email.trim(), password });

      if (!result.success) {
        setErrors({ general: result.error || 'Authentication failed. Please check your credentials.' });
      } else {
        setSuccessBanner(`Authenticated successfully as ${result.user?.email}`);
        if (onSuccess && result.user) {
          onSuccess(result.user.email);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setErrors({ general: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrors({});
    setSuccessBanner(null);
    setIsGoogleLoading(true);

    try {
      const result = await executeGoogleOAuth();
      if (!result.success) {
        setErrors({ general: result.error || 'Google authentication failed.' });
      } else {
        setSuccessBanner(`Signed in with Google as ${result.user?.email}`);
        if (onSuccess && result.user) {
          onSuccess(result.user.email);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign in encountered an error.';
      setErrors({ general: msg });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="login-card" role="region" aria-label="Sign In Card">
      {/* Card Header */}
      <div className="login-card-header">
        <h1 className="login-heading">Welcome Back</h1>
        <p className="login-subtext">Sign in to continue to your health dashboard</p>
      </div>

      {/* Clerk Status Indicator if configured */}
      {isClerkConfigured() && (
        <div className="clerk-live-badge" aria-label="Clerk Auth Ready">
          <span className="clerk-live-dot" />
          <span>Clerk Authentication Connected</span>
        </div>
      )}

      {/* General Error Banner */}
      {errors.general && (
        <div className="login-alert login-alert-error" role="alert">
          <AlertCircleIcon size={18} className="alert-icon" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="login-alert login-alert-success" role="status" aria-live="polite">
          <CheckCircleIcon size={18} className="alert-icon" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Login Form */}
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <div className="form-group">
          <label htmlFor="email-input" className="form-label">
            Email Address
          </label>
          <div className={`input-wrapper ${errors.email ? 'input-wrapper-error' : ''}`}>
            <span className="input-icon" aria-hidden="true">
              <MailIcon size={18} />
            </span>
            <input
              id="email-input"
              type="email"
              name="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => handleBlur('email')}
              placeholder="name@example.com"
              autoComplete="email"
              required
              aria-required="true"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error-msg' : undefined}
              className="form-input"
              disabled={isLoading || isGoogleLoading}
            />
          </div>
          {errors.email && (
            <div id="email-error-msg" className="field-error-message" role="alert">
              <AlertCircleIcon size={14} className="field-error-icon" />
              <span>{errors.email}</span>
            </div>
          )}
        </div>

        {/* Password Field */}
        <div className="form-group">
          <div className="password-label-row">
            <label htmlFor="password-input" className="form-label">
              Password
            </label>
            <button
              type="button"
              className="forgot-password-link"
              onClick={onForgotPassword}
              tabIndex={0}
            >
              Forgot Password?
            </button>
          </div>
          <div className={`input-wrapper ${errors.password ? 'input-wrapper-error' : ''}`}>
            <span className="input-icon" aria-hidden="true">
              <LockIcon size={18} />
            </span>
            <input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => handleBlur('password')}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              aria-required="true"
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error-msg' : undefined}
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
          {errors.password && (
            <div id="password-error-msg" className="field-error-message" role="alert">
              <AlertCircleIcon size={14} className="field-error-icon" />
              <span>{errors.password}</span>
            </div>
          )}
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || isGoogleLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <span className="btn-loading-content">
              <SpinnerIcon size={18} />
              <span>Logging in...</span>
            </span>
          ) : (
            <span>Login</span>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="login-divider">
        <span className="divider-line" />
        <span className="divider-text">OR</span>
        <span className="divider-line" />
      </div>

      {/* Google OAuth Button */}
      <button
        type="button"
        className="btn btn-google"
        onClick={handleGoogleSignIn}
        disabled={isLoading || isGoogleLoading}
        aria-label="Continue with Google"
      >
        {isGoogleLoading ? (
          <span className="btn-loading-content">
            <SpinnerIcon size={18} />
            <span>Connecting to Google...</span>
          </span>
        ) : (
          <span className="btn-google-content">
            <GoogleIcon size={18} />
            <span>Continue with Google</span>
          </span>
        )}
      </button>

      {/* Bottom Sign-Up Link */}
      <div className="login-footer">
        <p className="signup-prompt">
          Don't have an account?{' '}
          <button
            type="button"
            className="signup-link"
            onClick={onNavigateToSignUp}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};
