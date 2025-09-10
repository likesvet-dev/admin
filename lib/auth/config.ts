export const authConfig = {
  accessTokenCookieName: 'admin_access_token',
  refreshTokenCookieName: 'admin_refresh_token',
  accessTokenExpiry: 60 * 60 * 1000,
  refreshTokenExpiry: 30 * 24 * 60 * 60 * 1000,
  
  jwtSecret: (() => {
    // Usa JWT_SECRET_PROD in produzione, altrimenti JWT_SECRET
    const secret = process.env.NODE_ENV === 'production' 
      ? process.env.JWT_SECRET_PROD 
      : process.env.JWT_SECRET;
    
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('❌ JWT_SECRET_PROD environment variable is required in production');
      }
      console.warn('⚠️  JWT_SECRET not set. Using development secret.');
      return 'dev-secret-only-for-development-change-in-production';
    }
    return secret;
  })(),
};