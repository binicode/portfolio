import { apiClient } from './api-client';

interface AdminLoginResult {
  success: true;
}

export function adminLogin(email: string, password: string): Promise<AdminLoginResult> {
  return apiClient.post<AdminLoginResult>('/admin/auth/login', { email, password });
}

export function adminLogout(): Promise<{ success: true }> {
  return apiClient.post('/admin/auth/logout');
}