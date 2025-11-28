/**
 * 템플릿 관리 모듈
 */

import { renderCuteTemplate, renderCuteTemplatePreview } from './template1.js';

// 사용 가능한 템플릿 목록
export const templates = {
    cute: {
        id: 'cute',
        name: '귀여운 스타일',
        render: renderCuteTemplate,
        preview: renderCuteTemplatePreview,
        description: '파스텔톤과 둥근 모서리로 포근한 느낌을 주는 템플릿',
    },
    // 추후 템플릿 추가 가능
    // modern: { ... },
    // minimal: { ... },
};

/**
 * 템플릿 렌더링
 * @param {string} templateId - 템플릿 ID
 * @param {Object} data - 제품 데이터
 * @param {string} productImage - 제품 이미지
 * @param {boolean} isPreview - 미리보기 여부
 * @returns {string} HTML 문자열
 */
export function renderTemplate(templateId, data, productImage, isPreview = false) {
    const template = templates[templateId];

    if (!template) {
        throw new Error(`템플릿을 찾을 수 없습니다: ${templateId}`);
    }

    if (isPreview && template.preview) {
        return template.preview(data, productImage);
    }

    return template.render(data, productImage);
}

/**
 * 사용 가능한 템플릿 목록 가져오기
 * @returns {Array} 템플릿 목록
 */
export function getAvailableTemplates() {
    return Object.values(templates);
}
