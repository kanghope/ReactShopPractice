// src/api/itemApi.ts

import apiClient from "../config/axiosSetup";
import axios from 'axios';
// 분리된 타입 정의 사용
import type { 
    ItemFormDto, 
    ItemListContentDto, 
    ItemSearchDto,
    ErrorResponseData,
    PageResponse ,
    MainItemDto// ⭐️ MainItemDto import 추가
} from '../types/item.ts';

// -------------------------------------------------------------
// API Calls
// -------------------------------------------------------------

const API_ADMIN_BASE_URL = '/admin/item';

/**
 * 상품 등록 (POST /api/admin/item/new) i love han!!!
 * @param formData ItemFormDto 및 이미지 파일 리스트
 * @returns 성공 메시지
 */
export const registerItem = async (formData: FormData): Promise<string> => {
    try {
        const response = await apiClient.post(`${API_ADMIN_BASE_URL}/new`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data as string;
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
                    serverErrorMessage = `상품 등록에 실패했습니다.: 서버 응답 (${status})`;
                }
            }
            // 기존 로직: ErrorResponseData 형식일 때
            else if (typeof errorData === 'object' && errorData !== null && 'message' in errorData) {
                 serverErrorMessage = errorData.message;
            }
            // 문자열이거나 기타 예상치 못한 형태일 때
            else {
                serverErrorMessage = `상품 등록에 실패했습니다.: 서버 응답 (${status})`;
            }

            throw new Error(serverErrorMessage, {
                cause: { status, data: errorData }
            });
        }
        throw new Error('네트워크 오류가 발생했습니다.');
    }
};

/**
 * 상품 상세 정보 조회 (GET /api/admin/item/{itemId})
 * @param itemId 상품 ID
 * @returns ItemFormDto (이미지 파일 목록은 제외, ItemImgDtoList만 포함)
 */
export const getItemDetail = async (itemId: number): Promise<ItemFormDto> => {
    try {
        // NOTE: response.data는 서버에서 받은 순수한 Item DTO 타입으로 가정합니다.
        // 클라이언트-전용 필드(itemImgFiles)를 추가하기 위해 응답 데이터 타입을 명시적으로 ItemFormDto에서 
        // 클라이언트-전용 필드를 제외한 타입으로 받는 것이 더 안전합니다. (여기서는 타입 분리가 필요)
        const response = await apiClient.get<Omit<ItemFormDto, 'itemImgFiles'>>(`${API_ADMIN_BASE_URL}/${itemId}`);
        
        // 서버에서 받은 Item DTO에 클라이언트 폼 상태 관리를 위한 itemImgFiles 필드를 추가하여 ItemFormDto를 완성합니다.
        const itemDtoFromServer = response.data;

        // 클라이언트에서 5개의 이미지 슬롯을 관리하기 위해 File[] 배열을 초기화합니다.
        return {
            ...itemDtoFromServer,
            itemImgFiles: new Array(5).fill(null) as (File | null)[], 
        } as ItemFormDto; // 최종적으로 ItemFormDto 타입으로 반환합니다.
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const errorData = error.response.data;
            const message = errorData?.message || '존재하지 않는 상품입니다.';
            throw new Error(message, { cause: error.response.status });
        }
        throw new Error('네트워크 오류가 발생했습니다.');
    }
};

/**
 * 상품 수정 (PUT /api/admin/item/{itemId})
 * @param itemId 수정할 상품 ID
 * @param formData ItemFormDto 및 이미지 파일 리스트
 * @returns 성공 메시지
 */
export const updateItem = async (itemId: number, formData: FormData): Promise<string> => {
    try {
        // PUT 대신 POST 또는 PATCH를 사용하여 MultiPart/form-data를 전송할 수 있도록 Spring 서버 설정을 가정합니다.
        // 또는 Spring Controller에서 PUT 요청을 MultiPart로 받도록 설정을 변경해야 합니다.
        // 일반적인 웹 환경을 고려하여 POST 요청으로 서버에 업데이트 요청을 보낸다고 가정합니다.
        const response = await apiClient.put(`${API_ADMIN_BASE_URL}/${itemId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data as string;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const errorData = error.response.data;
            let errorMessage = Array.isArray(errorData) ? errorData.join(' / ') : errorData;
            throw new Error(errorMessage || '상품 수정에 실패했습니다.');
        }
        throw new Error('네트워크 오류가 발생했습니다.');
    }
};

/**
 * 상품 관리 목록 조회 (GET /api/admin/item/items)
 * @param searchDto 검색 조건
 * @param page 페이지 번호 (0-based)
 * @param size 페이지 크기
 * @returns PageResponse<ItemListContentDto>
 */
export const getItemManageList = async (
    searchDto: ItemSearchDto, 
    page: number = 0, 
    size: number = 5 // 기본 사이즈는 Spring Boot 기본값인 10으로 설정
): Promise<PageResponse<ItemListContentDto>> => {
    
    // URLSearchParams를 사용하여 쿼리스트링 생성
    const params = new URLSearchParams({
        ...searchDto,
        page: page.toString(),
        size: size.toString()
    });
    
    if (searchDto.searchSellStatus === '') {
        params.delete('searchSellStatus');
    }

    try {
        const response = await apiClient.get<PageResponse<ItemListContentDto>>(`/admin/item/items?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error("상품 목록 조회 오류:", error);
        throw new Error('상품 목록을 불러오는 데 실패했습니다.');
    }
};

/**
 * 메인 페이지 상품 목록 및 검색 API 호출 (GET /items)
 * @param itemSearchDto 검색 조건 (searchQuery만 주로 사용됨)
 * @param page 현재 페이지 번호 (0-based)
 * @param size 페이지 당 항목 수
 * @returns PageResponse<MainItemDto>
 */
export const getMainItems = async (
    itemSearchDto: Pick<ItemSearchDto, 'searchQuery'>, // 메인 페이지에서는 searchQuery만 필요
    page: number = 0,
    size: number = 6 // 메인 페이지 기본 페이지 크기 6
): Promise<PageResponse<MainItemDto>> => {
    try {
        // URLSearchParams를 사용하여 쿼리스트링 생성
        const params = new URLSearchParams({
            searchQuery: itemSearchDto.searchQuery || '',
            page: page.toString(),
            size: size.toString(),
        });

        // 🚨 메인 페이지 엔드포인트: 백엔드 ItemController의 "/" 또는 "/items"로 가정합니다.
        const response = await apiClient.get<PageResponse<MainItemDto>>(`/items?${params.toString()}`);
        
        return response.data;

    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const status = error.response.status;
            const errorData = error.response.data;
            const serverErrorMessage = errorData?.message || `상품 목록 조회 실패: 서버 응답 (${status})`;

            throw new Error(serverErrorMessage, {
                cause: { status, data: errorData }
            });
        }
        throw new Error('네트워크 오류가 발생했습니다.');
    }
};


/**
 * ⭐️ 일반 사용자용 상품 상세 정보 조회 (GET /api/item/{itemId})
 * @param itemId 상품 ID
 * @returns ItemFormDto 
 */
export const getPublicItemDetail = async (itemId: number): Promise<ItemFormDto> => {
    try {
        // 🚨 경로를 '/item/{itemId}'로 변경
        const response = await apiClient.get<Omit<ItemFormDto, 'itemImgFiles'>>(`/item/${itemId}`); 
        
        // getItemDetail과 동일한 로직으로 ItemFormDto를 완성
        const itemDtoFromServer = response.data;
        return {
            ...itemDtoFromServer,
            itemImgFiles: new Array(5).fill(null) as (File | null)[], 
        } as ItemFormDto;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            const status = error.response.status;
            const errorData = error.response.data;
            const serverErrorMessage = errorData?.message || `상품 목록 조회 실패: 서버 응답 (${status})`;

            throw new Error(serverErrorMessage, {
                cause: { status, data: errorData }
            });
        }
        throw new Error('상품 정보를 불러오는 데 실패했습니다.');
    }
};
