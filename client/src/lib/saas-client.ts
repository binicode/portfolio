import { apiClient } from './api-client';
import type { AuthResult, CheckoutSessionResponse } from '@/types/saas';

export function registerSaasUser(email: string, password: string): Promise<AuthResult> {
  return apiClient.post<AuthResult>('/saas/auth/register', { email, password });
}

export function loginSaasUser(email: string, password: string): Promise<AuthResult> {
  return apiClient.post<AuthResult>('/saas/auth/login', { email, password });
}

export function logoutSaasUser(): Promise<{ success: true }> {
  return apiClient.post('/saas/auth/logout');
}

export function createCheckoutSession(): Promise<CheckoutSessionResponse> {
  return apiClient.post<CheckoutSessionResponse>('/saas/billing/checkout');
}
