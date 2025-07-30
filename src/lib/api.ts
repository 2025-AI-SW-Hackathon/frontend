import { LoginResponse, BaseResponse } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // 인증 토큰 가져오기
    const { auth } = await import('./auth');
    const accessToken = auth.getAccessToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // options?.headers가 있으면 추가
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    // 인증 토큰이 있으면 헤더에 추가
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(url, {
      headers,
      ...options,
    });

    // 302 리다이렉트 처리
    if (response.status === 302) {
      throw new ApiError(302, '인증이 필요합니다. 백엔드 설정을 확인해주세요.', 302);
    }

    // 응답이 JSON이 아닌 경우 처리
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new ApiError(response.status, '서버에서 JSON 응답을 받지 못했습니다.', response.status);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(response.status, data.message || 'API 요청 실패', data.code);
    }

    return data;
  },

  // 구글 소셜 로그인
  async googleLogin(code: string): Promise<LoginResponse> {
    return this.request<LoginResponse>(`/app/users/auth/google/login?code=${code}`, {
      method: 'GET'
    });
  },

  // 액세스 토큰으로 로그인 (선택적)
  async googleLoginWithToken(accessToken: string): Promise<LoginResponse> {
    return this.request<LoginResponse>(`/app/users/auth/google/login?accessToken=${accessToken}`, {
      method: 'GET'
    });
  },
}; 