//import type { PageResponse } from './item.ts'; 
// PageResponse, ErrorResponseData는 item.ts 또는 common.ts에서 가져와야 함

export type OrderStatus = 'ORDER' | 'CANCEL'; // 주문 상태

/**
 * 주문 상품 정보 DTO (OrderHistDto 내부)
 */
export interface OrderItemDto {
    itemNm: string; // 상품명
    count: number; // 주문 수량
    orderPrice: number; // 주문 당시 가격
    imgUrl: string | null; // 대표 이미지 URL
}

/**
 * 주문 이력 항목 DTO (Spring의 OrderHistDto와 동일)
 */
export interface OrderHistDto {
    orderId: number; 
    orderDate: string; // 주문 날짜 (예: '2023-11-15 14:30')
    orderStatus: OrderStatus; // 주문 상태
    orderItemDtoList: OrderItemDto[]; // 주문 상품 목록
}