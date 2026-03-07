export const MAIL_TEMPLATES = {
  OTP: 'otp',
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password-reset',
  APPOINTMENT_CONFIRMATION: 'appointment-confirmation',
} as const;

export type MailTemplate = (typeof MAIL_TEMPLATES)[keyof typeof MAIL_TEMPLATES];

export const MAIL_SUBJECTS = {
  OTP: 'Your OTP Code - Painless Touch Care',
  WELCOME: 'Welcome to the Painless Touch Care Family!',
};
