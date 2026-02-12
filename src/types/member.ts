// types/member.ts

/**
 * 회원가입/정보 수정 요청 시 사용되는 폼 데이터 타입
 * password 필드는 선택 사항(수정 시)으로 처리했습니다.
 */
export interface MemberForm {
    name: string;
    email: string;
    password?: string;
    address: string;
}

/**
 * 로그인 요청 시 사용되는 데이터 타입
 */
export interface LoginRequest {
    email: string;
    password: string;
}

/**
 * 토큰 응답 시 사용되는 데이터 타입
 */
export interface TokenResponse {
    grantType: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number;
    // ⭐ Thymeleaf 환경처럼 헤더에 사용자 이름을 표시하기 위해 기본 정보 포함
    id: number;
    email: string;
    memberName: string;
    role: 'USER' | 'ADMIN'; // 사용자 역할 추가
}
/**
 * 사용자 프로필 정보 타입 (GET /members/profile 응답 기준)
 */
export interface MemberProfile {
    id: number;
    email: string;
    name: string;
    address: string;
    role: string;
    createdAt: string; // ISO 8601 string
}

/**
 * 백엔드에서 응답하는 표준 에러 응답 구조 (401, 404, 500 등)
 */
export interface ErrorResponse {
    status: number;
    timestamp: string;
    error: string;
    message: string;
    path: string;
}

/**
 * 프론트엔드 Service 레이어에서 throw할 에러 객체 구조
 */
export interface ServiceError {
    status: number;
    data: ErrorResponse | any;
}
/**
 * 현재 로그인한 사용자 정보 타입 (Context에서 사용)
 * 토큰에 포함된 정보 또는 별도로 조회한 정보입니다.
 */
export interface CurrentUser {
    memberId: number; // 사용자 식별 ID
    email: string;    // 사용자 이메일
    name: string;     // 사용자 이름 (헤더 표시용)
    role: 'USER' | 'ADMIN'; // 사용자 역할 추가
}

/**
 * 회원가입 요청 객체
 */
export interface RegisterRequest extends LoginRequest {
    memberName: string;
}