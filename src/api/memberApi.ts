import apiClient from '../config/axiosSetup.ts'; // 설정된 apiClient 인스턴스 사용
import type { MemberForm, LoginRequest, TokenResponse } from '../types/member.ts';
import axios, { AxiosError } from 'axios';

// 백엔드 API 기본 URL 설정
const API_BASE_URL = '/members';

// 서버의 표준 오류 응답 DTO를 정의합니다. (GlobalExceptionHandler에서 반환하는 형식)
interface ErrorResponseData {
    status: number;
    timestamp: string;
    error: string;
    message: string; // 이 필드가 서버 메시지를 담고 있습니다.
    path: string;
}

/**
 * 회원가입 API 호출
 * @param data MemberForm (name, email, password, address)
 * @returns 성공 메시지
 */
export const registerMember = async (data: MemberForm): Promise<string> => {
    try {
        // 백엔드: POST /api/members/new
        const response = await apiClient.post(`${API_BASE_URL}/new`, data);
        return response.data;

    } catch (error) {
        // AxiosError를 ErrorResponseData 타입으로 단언하여 메시지에 접근합니다.
        if (axios.isAxiosError(error) && error.response) {
            const status = error.response.status;
            // error.response.data를 ErrorResponseData, string, 또는 배열로 처리합니다.
            const errorData = error.response.data as ErrorResponseData | string | Record<string, string>;
            
            let serverErrorMessage: string;

            // ⭐️ 수정된 로직: 배열 형태의 응답을 처리 (유효성 검사 오류일 가능성 높음)
            if (typeof errorData === 'object' && errorData !== null && !('message' in errorData)) {
                // errorData가 { 0: "msg1", 1: "msg2" } 형태일 때, 모든 값을 하나의 문자열로 합칩니다.
                const messages = Object.values(errorData);
                if (messages.length > 0 && messages.every(msg => typeof msg === 'string')) {
                    serverErrorMessage = (messages as string[]).join('; ');
                } else {
                    // JSON 객체이지만 message 필드가 없는 경우 (예외 DTO 형식을 따르지 않는 경우)
                    serverErrorMessage = `회원가입 요청 실패: 서버 응답 (${status})`;
                }
            }
            // 기존 로직: ErrorResponseData 형식일 때
            else if (typeof errorData === 'object' && errorData !== null && 'message' in errorData) {
                 serverErrorMessage = errorData.message;
            }
            // 문자열이거나 기타 예상치 못한 형태일 때
            else {
                serverErrorMessage = `회원가입 요청 실패: 서버 응답 (${status})`;
            }

            throw new Error(serverErrorMessage, {
                cause: { status, data: errorData }
            });
        }
        throw new Error('네트워크 오류가 발생했습니다.');
    }
};

/**
 * 로그인 API 호출
 * @param data LoginRequest (email, password)
 * @returns JWT 토큰 정보 (TokenResponse)
 */
export const loginMember = async (data: LoginRequest): Promise<TokenResponse> => {
    try {
        // 백엔드: POST /api/members/login
        const response = await apiClient.post(`${API_BASE_URL}/login`, data);
        return response.data;

    } catch (error) {
        // ⭐️ Axios 에러에서 발생한 응답 데이터 처리
        if (axios.isAxiosError(error) && error.response) {
            
            // error.response.data를 ErrorResponseData 타입으로 단언
            const errorData = error.response.data as ErrorResponseData;
            const status = error.response.status;
            
            // GlobalExceptionHandler 덕분에 errorData는 항상 { message: "..." } 형태입니다.
            // ⭐️ errorData.message를 직접 사용합니다.
            const serverErrorMessage = errorData.message || `로그인 요청 실패: 서버 응답 (${status})`;

            // 표준 Error 객체를 던집니다. 백엔드 에러 데이터는 'cause'에 담아 전달합니다.
            throw new Error(serverErrorMessage, {
                cause: { status, data: errorData }
            });
        }
        
        // 네트워크 연결 자체의 문제 등 AxiosError가 아닌 경우
        throw new Error('네트워크 연결 또는 요청 구성에 문제가 발생했습니다.');
    }
};
