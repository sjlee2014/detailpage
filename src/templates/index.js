/**
 * 템플릿 관리 모듈 (레거시 호환용)
 * 
 * 참고: 새 시스템은 pageRenderer.js를 사용합니다.
 * 이 파일은 규칙 기반 모드 호환을 위해 유지됩니다.
 */

// 기본 템플릿 렌더링 함수 (간소화)
function renderSimpleTemplate(data, productImage) {
    const { mainCopy = '', subCopy = '', features = [] } = data;

    const featureHtml = features.map(f => `
        <div style="padding: 16px; background: #f9fafb; border-radius: 12px; text-align: center;">
            <span style="font-size: 24px;">${f.icon || '✨'}</span>
            <h4 style="margin: 8px 0 4px; font-size: 14px; font-weight: 600;">${f.title || ''}</h4>
            <p style="margin: 0; font-size: 12px; color: #6b7280;">${f.text || ''}</p>
        </div>
    `).join('');

    return `
<div style="max-width: 800px; margin: 0 auto; font-family: -apple-system, sans-serif; background: #fff;">
    <div style="text-align: center; padding: 40px 20px;">
        <img src="${productImage}" alt="제품" style="max-width: 100%; border-radius: 16px;" />
        <h1 style="font-size: 28px; margin: 24px 0 12px;">${mainCopy}</h1>
        <p style="color: #6b7280; font-size: 16px;">${subCopy}</p>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; padding: 20px;">
        ${featureHtml}
    </div>
</div>
    `.trim();
}

// 사용 가능한 템플릿 목록
export const templates = {
    cute: {
        id: 'cute',
        name: '기본 스타일',
        render: renderSimpleTemplate,
        preview: renderSimpleTemplate,
        description: '깔끔한 기본 템플릿',
    },
};

/**
 * 템플릿 렌더링
 */
export function renderTemplate(templateId, data, productImage, isPreview = false) {
    const template = templates[templateId] || templates.cute;
    return template.render(data, productImage);
}

/**
 * 사용 가능한 템플릿 목록 가져오기
 */
export function getAvailableTemplates() {
    return Object.values(templates);
}
