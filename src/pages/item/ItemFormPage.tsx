// src/pages/admin/ItemFormPage.tsx

import React, { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { getItemDetail, registerItem, updateItem } from '../../api/itemApi.ts';
import type { ItemFormDto, ItemImgDto } from '../../types/item.ts'; 

// 초기 폼 상태 정의
const initialItemImgDtoList: ItemImgDto[] = Array(5).fill(null).map((_, index) => ({
    id: null, imgName: null, oriImgName: null, imgUrl: null, isRepImg: index === 0 ? 'Y' : 'N'
}));

const initialFormState: ItemFormDto = {
    id: null,
    itemNm: '',
    price: null,
    stockNumber: null,
    itemDetail: '',
    itemSellStatus: 'SELL',
    itemImgFiles: new Array(5).fill(null), // 클라이언트에서 파일을 담는 배열
    itemImgDtoList: initialItemImgDtoList, // 기존 이미지 정보를 담는 배열
};

const ItemFormPage: React.FC = () => {
    const { itemId } = useParams<{ itemId: string }>();
    const isEditMode = !!itemId;
    const navigate = useNavigate();
    const [formData, setFormData] = useState<ItemFormDto>(initialFormState);

    const [loading, setLoading] = useState(true);
    const [submitError, setSubmitError] = useState<string | null>(null);
    // 서버 유효성 검사 에러를 저장하는 상태
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({}); 

    // -------------------------------------------------------------
    // 1. 수정 모드일 때 상품 데이터 로드
    // -------------------------------------------------------------
    useEffect(() => {
        if (!isEditMode || !itemId) {
            setLoading(false);
            return;
        }

        const loadItemData = async () => {
            try {
                const id = parseInt(itemId, 10);
                if (isNaN(id)) throw new Error('잘못된 상품 ID입니다.');

                const detailDto = await getItemDetail(id);
                
                // 로드된 이미지 데이터에 빈 이미지를 추가하여 총 5개를 맞춥니다.
                const loadedImgs: ItemImgDto[] = detailDto.itemImgDtoList || [];
                const paddedImgs = [...loadedImgs];
                while (paddedImgs.length < 5) {
                    // isRepImg 설정은 서버에서 결정되므로, 빈 공간은 'N'으로 설정
                    paddedImgs.push({ id: null, imgName: null, oriImgName: null, imgUrl: null, isRepImg: 'N' });
                }

                // DTO 업데이트 (itemImgFiles는 서버 응답에 없으므로 유지됨)
                setFormData({ 
                    ...detailDto, 
                    itemImgDtoList: paddedImgs,
                    itemImgFiles: new Array(5).fill(null) // 파일 인풋 초기화
                });

            } catch (error) {
                console.error('상품 정보 로드 실패:', error);
                setSubmitError(`상품 정보를 불러올 수 없습니다. ${(error as Error).message}`);
            } finally {
                setLoading(false);
            }
        };

        loadItemData();
    }, [isEditMode, itemId]);


    // -------------------------------------------------------------
    // 2. 폼 입력 필드 변경 핸들러
    // -------------------------------------------------------------
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        let processedValue: string | number | null = value;
        if (name === 'price' || name === 'stockNumber') {
            // 빈 문자열이 들어오면 null로 처리 (숫자 입력 필드의 일반적인 관행)
            processedValue = value === '' ? null : parseInt(value, 10);
            if (value !== '' && isNaN(processedValue as number)) return; 
        }

        setFormData(prev => ({
            ...prev,
            [name]: processedValue as any // 타입 캐스팅으로 DTO 구조 유지
        }));

        // 에러 초기화
        setFieldErrors(prev => ({ ...prev, [name]: null }));
    };

    // -------------------------------------------------------------
    // 3. 이미지 파일 변경 핸들러 (Thymeleaf의 bindDomEvent 로직 구현)
    // -------------------------------------------------------------
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0] || null;

        if (file) {
            const fileName = file.name;
            const fileExt = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
            const allowedExts = ["jpg", "jpeg", "gif", "png", "bmp"];

            if (!allowedExts.includes(fileExt)) {
                alert("이미지 파일(jpg, jpeg, gif, png, bmp)만 등록이 가능합니다.");
                e.target.value = ''; // 파일 선택 취소 (비우기)
                setFormData(prev => {
                    const newFiles = [...prev.itemImgFiles];
                    newFiles[index] = null;
                    return { ...prev, itemImgFiles: newFiles };
                });
                return;
            }
        }
        
        // 파일 상태 업데이트
        setFormData(prev => {
            const newFiles = [...prev.itemImgFiles];
            newFiles[index] = file;
            return { ...prev, itemImgFiles: newFiles };
        });
    };

    // -------------------------------------------------------------
    // 4. 폼 제출 핸들러 (등록/수정)
    // -------------------------------------------------------------
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setFieldErrors({});

        const form = new FormData();
        
        // 1. ItemFormDto (JSON)
        // 파일을 제외하고 서버가 필요로 하는 필드만 추출
        const { itemImgFiles, ...itemFormDtoToSubmit } = formData;

        // 수정 모드일 경우 기존 이미지 ID 리스트(itemImgIds)를 생성하여 DTO에 추가
        if (isEditMode) {
            // 기존 이미지 ID를 hidden 필드 대신 DTO에 명시적으로 추가하여 서버로 보냄
            // 서버는 이 ID 리스트와 함께 전송된 파일 리스트를 비교하여 이미지 업데이트/삭제를 처리해야 함
            itemFormDtoToSubmit.itemImgIds = formData.itemImgDtoList
                .map(img => img.id)
                .filter((id): id is number => id !== null); 
        }

        form.append('itemFormDto', new Blob([JSON.stringify(itemFormDtoToSubmit)], {
            type: 'application/json'
        }));

        // 2. 이미지 파일 (MultipartFile 리스트)
        // 파일이 선택된 경우에만 'itemImgFile' 이름으로 FormData에 추가
        itemImgFiles.forEach((file, index) => {
            if (file) {
                // name="itemImgFile"로 서버에 전송
                form.append('itemImgFile', file); 
            } else if (isEditMode && formData.itemImgDtoList[index].id !== null) {
                // 수정 모드에서 파일이 변경되지 않고 기존 이미지가 있는 경우:
                // 서버의 MultipartFile List와 itemImgIds List를 매칭하기 위해
                // 해당 위치에 **빈 파일**을 보내 기존 이미지가 유지되도록 처리할 수 있습니다.
                // Spring Boot의 경우 빈 파일(길이 0)은 무시되므로, 기존 이미지를 유지하는 로직은 itemImgIds로 판단하는 것이 일반적입니다.
                // 여기서는 Thymeleaf 예제의 `name="itemImgFile"`이 파일이 없는 경우에도 빈 요소로 전송된다는 가정하에
                // 명시적으로 null을 보내지 않고, 파일이 있을 때만 추가하여 서버가 itemImgFiles 리스트의 크기를 다르게 받도록 합니다.
                // Spring Controller의 정확한 로직에 따라 이 부분은 조정될 수 있습니다. (현재 코드는 파일이 있을 때만 append)
            }
        });

        try {
            const id = isEditMode ? parseInt(itemId!, 10) : null;
            const resultMessage = id
                ? await updateItem(id, form)
                : await registerItem(form);

            alert(isEditMode ? `상품 수정 성공: ${resultMessage}` : `상품 등록 성공: ${resultMessage}`);
            navigate('/admin/items'); 

        } catch (error) {
            const err = error as Error;
            const status = (err.cause as { status?: number, data?: any })?.status;
            const errorData = (err.cause as { status?: number, data?: any })?.data; // API에서 넘겨준 원본 에러 데이터

            console.error('API Error:', err.message, 'Data:', errorData);

            // ⭐️ 수정된 로직: 에러 데이터가 객체 형태(필드 에러 맵)일 경우 fieldErrors를 업데이트
            if (status === 400 && typeof errorData === 'object' && errorData !== null && !('message' in errorData)) {
                // 서버에서 { itemNm: "필수입니다", price: "0보다 커야합니다" } 형태로 응답했다고 가정
                // 에러 데이터를 fieldErrors 상태에 직접 매핑하여 필드별 에러를 표시합니다.
                setFieldErrors(errorData as Record<string, string>); 
                setSubmitError("유효성 검사 오류가 발생했습니다. 아래 필드를 확인해주세요.");
            } else {
                // 일반적인 서버 에러(500, 인증 에러 등) 또는 일반 메시지 에러
                setSubmitError(err.message || '알 수 없는 오류가 발생했습니다.');
            }
        }
    };


    if (loading) {
        return <Layout><div className="text-center py-5">상품 정보를 불러오는 중...</div></Layout>;
    }

    const pageTitle = isEditMode ? '수정' : '등록';
    const submitButtonText = `상품 ${pageTitle}`;
    const submitButtonClass = isEditMode ? 'btn-success' : 'btn-primary';

    return (
        <div className="container my-5">
            <div className="row justify-content-center">
                <div className="col-md-10 col-lg-8">

                    <div className="card shadow-lg p-4">

                        <p className="h3 text-center mb-4 border-bottom pb-2">
                            <i className="bi bi-box-seam me-2"></i> 상품 <span className="text-primary">{pageTitle}</span>
                        </p>

                        {/* 전체 오류 메시지 표시 */}
                        {submitError && (
                            <div className="alert alert-danger p-2 mb-3">
                                <p className="fieldError mb-0 small">⚠️ {submitError}</p>
                            </div>
                        )}
                        
                        <form onSubmit={handleSubmit}>

                            {/* ID Hidden Field */}
                            {isEditMode && (
                                <input type="hidden" name="id" value={formData.id || ''} />
                            )}
                            {/* CSRF 토큰은 axiosSetup.ts에서 자동으로 처리한다고 가정하고 여기서는 생략합니다. */}


                            {/* 상품 판매 상태 */}
                            <div className="mb-3">
                                <label htmlFor="itemSellStatus" className="form-label">상품 판매 상태</label>
                                <select 
                                    name="itemSellStatus" 
                                    className="form-select"
                                    value={formData.itemSellStatus}
                                    onChange={handleChange}
                                >
                                    <option value="SELL">판매중</option>
                                    <option value="SOLD_OUT">품절</option>
                                </select>
                            </div>

                            {/* 상품명 */}
                            <div className="mb-3">
                                <label htmlFor="itemNm" className="form-label">상품명</label>
                                <input 
                                    type="text" 
                                    name="itemNm" 
                                    className={`form-control ${fieldErrors.itemNm ? 'is-invalid' : ''}`} 
                                    placeholder="상품명을 입력해주세요" 
                                    value={formData.itemNm}
                                    onChange={handleChange}
                                />
                                {fieldErrors.itemNm && (
                                    <p className="fieldError mt-1">{fieldErrors.itemNm}</p>
                                )}
                            </div>

                            {/* 가격 */}
                            <div className="mb-3">
                                <label htmlFor="price" className="form-label">가격</label>
                                <input 
                                    type="number" 
                                    name="price" 
                                    className={`form-control ${fieldErrors.price ? 'is-invalid' : ''}`}
                                    placeholder="상품의 가격을 입력해주세요"
                                    value={formData.price === null ? '' : formData.price}
                                    onChange={handleChange}
                                />
                                {fieldErrors.price && (
                                    <p className="fieldError mt-1">{fieldErrors.price}</p>
                                )}
                            </div>

                            {/* 재고 수량 */}
                            <div className="mb-3">
                                <label htmlFor="stockNumber" className="form-label">재고 수량</label>
                                <input 
                                    type="number" 
                                    name="stockNumber" 
                                    className={`form-control ${fieldErrors.stockNumber ? 'is-invalid' : ''}`}
                                    placeholder="상품의 재고를 입력해주세요"
                                    value={formData.stockNumber === null ? '' : formData.stockNumber}
                                    onChange={handleChange}
                                />
                                {fieldErrors.stockNumber && (
                                    <p className="fieldError mt-1">{fieldErrors.stockNumber}</p>
                                )}
                            </div>

                            {/* 상품 상세 내용 */}
                            <div className="mb-3">
                                <label htmlFor="itemDetail" className="form-label">상품 상세 내용</label>
                                <textarea 
                                    className={`form-control ${fieldErrors.itemDetail ? 'is-invalid' : ''}`}
                                    rows={5} 
                                    name="itemDetail" 
                                    placeholder="상세 내용을 입력해주세요"
                                    value={formData.itemDetail}
                                    onChange={handleChange}
                                />
                                {fieldErrors.itemDetail && (
                                    <p className="fieldError mt-1">{fieldErrors.itemDetail}</p>
                                )}
                            </div>

                            <h5 className="mb-3 mt-4 text-info">상품 이미지 등록</h5>

                            {/* 이미지 입력 필드 반복 (총 5개) */}
                            {formData.itemImgDtoList.map((imgDto, index) => {
                                const file = formData.itemImgFiles[index];
                                const labelText = file?.name 
                                    || imgDto.oriImgName 
                                    || (isEditMode ? '새로운 이미지 선택' : '선택된 파일 없음');

                                return (
                                    <div className="mb-3" key={index}>
                                        <label className="form-label text-muted">상품 이미지 {index + 1}</label>
                                        <div className="input-group">
                                            <input 
                                                type="file" 
                                                // file input은 uncontrolled component로 두거나 value를 null로 설정해야 합니다.
                                                // React에서 파일 인풋은 fileList를 다루므로 value를 직접 설정하지 않습니다.
                                                className="form-control custom-file-input" 
                                                name={`itemImgFile${index}`}
                                                onChange={(e) => handleFileChange(e, index)}
                                            />
                                            {/* 수정 모드에서 기존 이미지가 있는 경우, ID를 hidden 필드로 전송 (DTO로 대체될 수 있음) */}
                                            {isEditMode && imgDto.id !== null && (
                                                <input type="hidden" name="itemImgIds" value={imgDto.id} />
                                            )}
                                            <label className="input-group-text custom-file-label">
                                                {labelText}
                                            </label>
                                        </div>
                                    </div>
                                );
                            })}


                            {/* 버튼 그룹 */}
                            <div className="d-grid gap-2 col-6 mx-auto mt-4">
                                <button type="submit" className={`btn ${submitButtonClass} btn-lg`}>
                                    <i className={`bi bi-${isEditMode ? 'arrow-up-circle' : 'save'} me-2`}></i> {submitButtonText}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemFormPage;