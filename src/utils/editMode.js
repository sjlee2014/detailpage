/**
 * 편집 모드 (Edit Mode) 유틸리티
 * 생성된 상세페이지의 특정 부분을 선택하고 재생성하는 기능
 */

import { generateContent } from './geminiClient.js';

// 전역 상태
let isEditModeActive = false;
let currentPreviewElement = null;
let hoveredSection = null;
let selectedSection = null;

/**
 * 편집 모드 활성화
 * @param {HTMLElement} previewElement - 미리보기 영역 DOM 요소
 */
export function enableEditMode(previewElement) {
    if (isEditModeActive) return;

    isEditModeActive = true;
    currentPreviewElement = previewElement;

    // 편집 모드 클래스 추가
    previewElement.classList.add('edit-mode-active');

    // 모든 편집 가능한 섹션에 이벤트 리스너 추가
    attachSectionListeners(previewElement);

    console.log('✏️ 편집 모드 활성화됨');
}

/**
 * 편집 모드 비활성화
 */
export function disableEditMode() {
    if (!isEditModeActive) return;

    isEditModeActive = false;

    if (currentPreviewElement) {
        currentPreviewElement.classList.remove('edit-mode-active');
        removeSectionListeners(currentPreviewElement);
    }

    // 하이라이트 제거
    if (hoveredSection) {
        hoveredSection.classList.remove('section-highlight');
        hoveredSection = null;
    }

    currentPreviewElement = null;
    console.log('🚫 편집 모드 비활성화됨');
}

/**
 * 섹션에 이벤트 리스너 추가
 */
function attachSectionListeners(containerElement) {
    // 모든 div 요소를 선택 가능한 섹션으로 간주
    const sections = containerElement.querySelectorAll('div');

    sections.forEach(section => {
        // 너무 작은 섹션은 제외 (높이 20px 미만)
        if (section.offsetHeight < 20) return;

        section.addEventListener('mouseenter', handleSectionHover);
        section.addEventListener('mouseleave', handleSectionLeave);
        section.addEventListener('click', handleSectionClick);
    });
}

/**
 * 섹션에서 이벤트 리스너 제거
 */
function removeSectionListeners(containerElement) {
    const sections = containerElement.querySelectorAll('div');

    sections.forEach(section => {
        section.removeEventListener('mouseenter', handleSectionHover);
        section.removeEventListener('mouseleave', handleSectionLeave);
        section.removeEventListener('click', handleSectionClick);
        section.classList.remove('section-highlight', 'section-selected');
    });
}

/**
 * 섹션 호버 핸들러
 */
function handleSectionHover(e) {
    if (!isEditModeActive) return;

    e.stopPropagation();

    // 이전 하이라이트 제거
    if (hoveredSection && hoveredSection !== e.currentTarget) {
        hoveredSection.classList.remove('section-highlight');
    }

    hoveredSection = e.currentTarget;
    hoveredSection.classList.add('section-highlight');
}

/**
 * 섹션 호버 해제 핸들러
 */
function handleSectionLeave(e) {
    if (!isEditModeActive) return;

    e.stopPropagation();
    e.currentTarget.classList.remove('section-highlight');

    if (hoveredSection === e.currentTarget) {
        hoveredSection = null;
    }
}

/**
 * 섹션 클릭 핸들러
 */
function handleSectionClick(e) {
    if (!isEditModeActive) return;

    e.stopPropagation();
    e.preventDefault();

    selectedSection = e.currentTarget;

    // 모든 섹션에서 선택 클래스 제거
    currentPreviewElement.querySelectorAll('.section-selected').forEach(el => {
        el.classList.remove('section-selected');
    });

    // 선택된 섹션 표시
    selectedSection.classList.add('section-selected');

    console.log('📍 섹션 선택됨:', selectedSection);

    // 편집 모달 표시 이벤트 발생
    const event = new CustomEvent('sectionSelected', {
        detail: { section: selectedSection }
    });
    document.dispatchEvent(event);
}

/**
 * 선택된 섹션의 HTML 추출
 * @returns {string} 섹션의 HTML
 */
export function captureSelectedSection() {
    if (!selectedSection) {
        console.warn('⚠️ 선택된 섹션이 없습니다');
        return null;
    }

    return {
        element: selectedSection,
        html: selectedSection.outerHTML,
        textContent: selectedSection.textContent.trim()
    };
}

/**
 * AI로 섹션 재생성
 * @param {string} originalHtml - 원본 섹션 HTML
 * @param {string} editPrompt - 사용자의 수정 지시사항
 * @param {Object} context - 컨텍스트 정보 (전체 페이지 정보)
 * @returns {Promise<string>} 재생성된 HTML
 */
export async function regenerateSection(originalHtml, editPrompt, context = {}) {
    console.log('🤖 AI 섹션 재생성 시작...');
    console.log('원본 HTML 길이:', originalHtml.length);
    console.log('수정 지시:', editPrompt);

    const prompt = `당신은 전문 웹 디자이너입니다. 다음 HTML 섹션을 사용자의 요청에 따라 수정해주세요.

【원본 섹션 HTML】
${originalHtml}

【사용자 수정 요청】
${editPrompt}

【중요 규칙】
1. **기존 스타일 유지**: 원본의 색상, 폰트, 레이아웃 스타일을 최대한 유지하세요
2. **인라인 스타일만 사용**: class 대신 style 속성 사용
3. **RGB 색상 형식**: hex(#123456) 대신 rgb(R, G, B) 사용
4. **안전한 CSS만**: gradient, text-shadow, filter 등 금지
5. **수정 범위 최소화**: 요청된 부분만 수정하고 나머지는 그대로 유지
6. **완전한 HTML 반환**: 해당 섹션의 완전한 HTML 코드 반환 (설명 없이)

${context.productName ? `【제품명】${context.productName}` : ''}
${context.productDesc ? `【제품 설명】${context.productDesc}` : ''}

수정된 HTML만 반환하세요 (코드 블록 없이, 순수 HTML만):`;

    try {
        const response = await generateContent(prompt);

        // HTML 추출 (코드 블록이 있으면 제거)
        let cleanHtml = response.trim();

        // ```html ... ``` 제거
        const htmlBlockMatch = cleanHtml.match(/```html\s*([\s\S]*?)```/);
        if (htmlBlockMatch) {
            cleanHtml = htmlBlockMatch[1].trim();
        }

        // ``` ... ``` 제거
        const codeBlockMatch = cleanHtml.match(/```\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            cleanHtml = codeBlockMatch[1].trim();
        }

        console.log('✅ 섹션 재생성 완료');
        return cleanHtml;

    } catch (error) {
        console.error('❌ 섹션 재생성 실패:', error);

        // API 할당량 초과 에러 처리
        if (error.message && error.message.includes('429')) {
            throw new Error('⏳ API 요청 한도를 초과했습니다. 10-15초 후 다시 시도해주세요.');
        }

        // 기타 에러
        const errorMsg = error.message || '알 수 없는 오류가 발생했습니다';
        throw new Error(`섹션 재생성 실패: ${errorMsg}`);
    }
}

/**
 * 섹션 교체
 * @param {HTMLElement} oldElement - 교체할 기존 요소
 * @param {string} newHtml - 새로운 HTML
 */
export function replaceSection(oldElement, newHtml) {
    if (!oldElement || !newHtml) {
        console.warn('⚠️ 섹션 교체 실패: 요소 또는 HTML이 없습니다');
        return false;
    }

    try {
        // 임시 컨테이너에 새 HTML 파싱
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = newHtml.trim();

        const newElement = tempContainer.firstElementChild;

        if (!newElement) {
            throw new Error('유효한 HTML 요소를 생성할 수 없습니다');
        }

        // 기존 요소를 새 요소로 교체
        oldElement.parentNode.replaceChild(newElement, oldElement);

        console.log('✅ 섹션 교체 완료');
        return true;

    } catch (error) {
        console.error('❌ 섹션 교체 실패:', error);
        throw error;
    }
}

/**
 * 편집 모드 활성화 상태 확인
 * @returns {boolean}
 */
export function isEditMode() {
    return isEditModeActive;
}

/**
 * 현재 선택된 섹션 가져오기
 * @returns {HTMLElement|null}
 */
export function getSelectedSection() {
    return selectedSection;
}

/**
 * 선택 해제
 */
export function clearSelection() {
    if (selectedSection) {
        selectedSection.classList.remove('section-selected');
        selectedSection = null;
    }
}
