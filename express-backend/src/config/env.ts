import 'dotenv/config';

// Reads a required variable, failing fast at startup with a clear message.
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  directUrl: required('DIRECT_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  // Short-lived token sent with every API request.
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  // Long-lived token used only to get a new access token from /api/auth/refresh.
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  // Optional separate secret for refresh tokens; falls back to JWT_SECRET.
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? required('JWT_SECRET'),
} as const;
