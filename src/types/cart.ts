/**
 * 장바구니에 상품을 추가할 때 서버로 전송하는 DTO
 */
export interface CartItemDto {
    itemId: number; // 상품 아이디
    count: number;  // 수량
}

/**
 * 장바구니 목록을 조회할 때 서버에서 받는 DTO
 */
export interface CartDetailDto {
    cartItemId: number; // 장바구니 상품 아이디 (PK)
    itemNm: string;     // 상품명
    price: number;      // 상품 가격
    count: number;      // 현재 수량
    imgUrl: string | null; // 대표 이미지 URL
}

/**
 * 장바구니에서 선택한 상품을 주문할 때 서버로 전송하는 DTO의 항목
 */
export interface CartOrderDtoItem {
    cartItemId: number; // 주문할 장바구니 상품 아이디
}

/**
 * 장바구니에서 여러 상품을 주문할 때 서버로 전송하는 DTO
 */
export interface CartOrderDto {
    cartOrderDtoList: CartOrderDtoItem[];
}