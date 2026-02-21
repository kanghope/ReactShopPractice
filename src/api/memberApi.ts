import apiClient from '../config/axiosSetup.ts'; // 설정된 apiClient 인스턴스 사용
import type { MemberForm, LoginRequest, TokenResponse } from '../types/member.ts';
import axios from 'axios';

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

    } catch (error) 
    {
        /*
        // AxiosError를 ErrorResponseData 타입으로 단언하여 메시지에 접근합니다.
        if (axios.isAxiosError(error) && error.response) {
            const status = error.response.status;
            // error.response.data를 ErrorResponseData, string, 또는 배열로 처리합니다.
            const errorData = error.response.data as ErrorResponseData | string | Record<string, string>;
            
            let serverErrorMessage: string;

            // ⭐️ 수정된 로직: 서버에서 필드-에러 메시지 맵을 반환할 경우 (400 Bad Request 등 유효성 검사 오류)
            if (typeof errorData === 'object' && errorData !== null) {
                // errorData가 { itemNm: "필수 항목입니다", price: "0보다 커야 합니다" } 형태일 때
                // 일반적인 ErrorResponseData 형식이 아닐 경우 (필드 에러)
                if (!('message' in errorData)) {
                    // 필드 에러를 위한 전체 메시지 생성 (전체 오류 메시지로 사용할 용도)
                    const messages = Object.values(errorData);
                    serverErrorMessage = messages.length > 0 && messages.every(msg => typeof msg === 'string') 
                        ? (messages as string[]).join('; ') 
                        : `상품 등록에 실패했습니다.: 서버 응답 (${status})`;

                    // 💡 중요: 필드 에러 객체를 그대로 cause의 data에 담아 프론트엔드로 전파합니다.
                    throw new Error(serverErrorMessage, {
                        cause: { status, data: errorData as Record<string, string> }
                    });
                } 
                // 기존 로직: ErrorResponseData 형식일 때
                else { 
                    serverErrorMessage = (errorData as ErrorResponseData).message;
                }
            }
            // 문자열이거나 기타 예상치 못한 형태일 때
            else {
                serverErrorMessage = `상품 등록에 실패했습니다.: 서버 응답 (${status})`;
            }

            // ErrorResponseData 형식이나 일반 문자열 에러일 경우의 처리
            throw new Error(serverErrorMessage, {
                cause: { status, data: errorData }
            });
        }*/
        if(axios.isAxiosError(error) && error.response)
        {
            const status = error.response.status;
            const errorData = error.response.data;// 서버에서 보낸 List 또는 Map
            // 핵심: 문자열로 변환하지 말고 원본 데이터를 'cause'에 담아 던짐
            throw new Error('VALIDATION_ERROR',{
                cause: {status, data: errorData}
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
