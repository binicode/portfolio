import { apiClient } from './api-client';
import type {
  AuthResult,
  CheckoutSessionResponse,
  UpdateSettingsInput,
  UpdateSettingsResponse,
} from '@/types/saas';

/** Sign-up answers the same whether or not the address has an account: the next step is in the inbox. */
export function registerSaasUser(email: string, password: string): Promise<{ ok: true }> {
  return apiClient.post('/saas/auth/register', { email, password });
}

export function loginSaasUser(email: string, password: string): Promise<AuthResult> {
  return apiClient.post<AuthResult>('/saas/auth/login', { email, password });
}

export function logoutSaasUser(): Promise<{ success: true }> {
  return apiClient.post('/saas/auth/logout');
}

/** Uses an emailed confirmation link's token with the account's password; signs in. */
export function verifySaasEmail(token: string, password: string): Promise<AuthResult> {
  return apiClient.post<AuthResult>('/saas/auth/verify-email', { token, password });
}

export function requestPasswordReset(email: string): Promise<{ ok: true }> {
  return apiClient.post('/saas/auth/password/forgot', { email });
}

/** Uses an emailed reset link's token; signs in with the new password. */
export function resetSaasPassword(token: string, password: string): Promise<AuthResult> {
  return apiClient.post<AuthResult>('/saas/auth/password/reset', { token, password });
}

export function createCheckoutSession(): Promise<CheckoutSessionResponse> {
  return apiClient.post<CheckoutSessionResponse>('/saas/billing/checkout');
}

export function createPortalSession(): Promise<{ url: string }> {
  return apiClient.post('/saas/billing/portal');
}

export function deleteSaasAccount(password: string): Promise<{ success: true }> {
  return apiClient.delete('/saas/account', { password });
}

export function updateSaasSettings(input: UpdateSettingsInput): Promise<UpdateSettingsResponse> {
  return apiClient.patch<UpdateSettingsResponse>('/saas/settings', input);
}
