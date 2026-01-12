//import type { UserRole } from "./auth.ts";


// ItemSellStatus Enum (백엔드와 동일하게)
export type ItemSellStatus = 'SELL' | 'SOLD_OUT';

/**
 * 상품 이미지 정보 DTO
 */
export interface ItemImgDto {
    id: number | null; // 이미지 ID (수정 시 사용)
    imgName: string | null;
    oriImgName: string | null; // 원본 이미지 파일명
    imgUrl: string | null; // 이미지 URL
    isRepImg: 'Y' | 'N'; // 대표 이미지 여부
}

/**
 * 상품 등록/수정 폼 DTO (ItemFormDto)
 * 클라이언트 폼 상태를 나타내며, File 객체를 직접 포함합니다.
 */
export interface ItemFormDto {
    id: number | null; // 상품 ID (수정 시 사용, 등록 시 null)
    itemNm: string; // 상품명
    price: number | null; // 가격
    stockNumber: number | null; // 재고 수량
    itemDetail: string; // 상품 상세 설명
    itemSellStatus: ItemSellStatus; // 상품 판매 상태
    
    // 이미지 파일 리스트 (클라이언트에서 파일을 담는 용도, 최대 5개)
    itemImgFiles: (File | null)[];
    
    // 이미지 정보 DTO 리스트 (수정 시 기존 이미지 정보를 표시하는 용도)
    itemImgDtoList: ItemImgDto[];

    // 서버에 전송 시 사용할 기존 이미지 ID 목록 (선택 사항, 필요에 따라 추가)
    itemImgIds?: (number | null )[]; 
}

/**
 * 상품 검색 조건 DTO (ItemSearchDto)
 */
export interface ItemSearchDto {
    searchDateType: 'all' | '1d' | '1w' | '1m' | '6m';
    searchSellStatus: '' | ItemSellStatus; // ''는 '전체'를 의미
    searchBy: 'itemNm' | 'createdBy';
    searchQuery: string;
}

/**
 * 상품 목록 테이블에 표시되는 항목 DTO (ItemListContentDto)123
 */
export interface ItemListContentDto {
    id: number;
    itemNm: string;
    itemSellStatus: ItemSellStatus;
    createdBy: string;
    regTime: string; // 등록일 (ISO String)
}

/**
 * 메인 페이지 상품 목록 DTO (백엔드 MainItemDto와 동일)
 */
export interface MainItemDto {
    id: number;
    itemNm: string;
    itemDetail: string;
    imgUrl: string | null; // 대표 이미지가 없을 수도 있으므로 null 허용
    price: number;
}

/**
 * Spring Data JPA Page<T> 응답 구조
 */
export interface PageResponse<T> {
    content: T[]; // 실제 데이터 목록
    number: number; // 현재 페이지 번호 (0부터 시작)
    totalPages: number; // 총 페이지 수
    totalElements: number; // 총 요소 수
    first: boolean; // 첫 페이지 여부
    last: boolean; // 마지막 페이지 여부
    size: number; // 페이지 당 요소 수
    // 기타 Spring Page 관련 필드...
}

// 서버의 표준 오류 응답 DTO를 정의합니다. (GlobalExceptionHandler에서 반환하는 형식)
export interface ErrorResponseData {
    status: number;
    timestamp: string;
    error: string;
    message: string; // 이 필드가 서버 메시지를 담고 있습니다.
    path: string;
}