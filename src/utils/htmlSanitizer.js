/**
 * HTML 안전성 검증
 * AI 생성 HTML에서 위험한 요소 제거
 */

/**
 * 위험한 태그 목록
 */
const DANGEROUS_TAGS = [
    'script',
    'iframe',
    'object',
    'embed',
    'link',
    'meta',
    'base',
    'form',
    'input',
    'button',
    'textarea',
    'select',
];

/**
 * 위험한 속성 목록
 */
const DANGEROUS_ATTRIBUTES = [
    'onclick',
    'onload',
    'onerror',
    'onmouseover',
    'onmouseout',
    'onfocus',
    'onblur',
    'onchange',
    'onsubmit',
];

/**
 * HTML에서 위험한 태그 제거
 */
function removeDangerousTags(html) {
    let cleaned = html;

    DANGEROUS_TAGS.forEach(tag => {
        // 여는 태그와 닫는 태그 모두 제거
        const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis');
        cleaned = cleaned.replace(regex, '');

        // 자기 닫는 태그 제거
        const selfClosingRegex = new RegExp(`<${tag}[^>]*/>`, 'gi');
        cleaned = cleaned.replace(selfClosingRegex, '');
    });

    return cleaned;
}

/**
 * 위험한 속성 제거
 */
function removeDangerousAttributes(html) {
    let cleaned = html;

    DANGEROUS_ATTRIBUTES.forEach(attr => {
        const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
        cleaned = cleaned.replace(regex, '');
    });

    // javascript: URL 제거
    cleaned = cleaned.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
    cleaned = cleaned.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '');

    return cleaned;
}

/**
 * 외부 리소스 제거 (data: URL은 허용)
 */
function sanitizeExternalResources(html) {
    let cleaned = html;

    // http:// 또는 https:// 로 시작하는 src 제거 (이미지 등)
    // data: URL은 유지
    cleaned = cleaned.replace(
        /src\s*=\s*["'](https?:\/\/[^"']*)["']/gi,
        'src=""'
    );

    return cleaned;
}

/**
 * HTML 전체 검증 및 정제
 */
export function sanitizeHTML(html) {
    try {
        let cleaned = html;

        // 1. 위험한 태그 제거
        cleaned = removeDangerousTags(cleaned);

        // 2. 위험한 속성 제거
        cleaned = removeDangerousAttributes(cleaned);

        // 3. 외부 리소스 제거 (선택적)
        // cleaned = sanitizeExternalResources(cleaned);

        return cleaned;
    } catch (error) {
        console.error('HTML 검증 실패:', error);
        throw new Error('HTML 검증에 실패했습니다');
    }
}

/**
 * HTML 유효성 간단 체크
 */
export function validateHTML(html) {
    // 최소한의 HTML 구조 확인
    if (!html || html.trim().length === 0) {
        return { valid: false, error: 'HTML이 비어있습니다' };
    }

    // <div> 태그가 있는지 확인
    if (!html.includes('<div')) {
        return { valid: false, error: '유효한 HTML 구조가 아닙니다' };
    }

    // 위험한 태그 확인
    for (const tag of DANGEROUS_TAGS) {
        const regex = new RegExp(`<${tag}[\\s>]`, 'i');
        if (regex.test(html)) {
            return { valid: false, error: `위험한 태그가 포함되어 있습니다: ${tag}` };
        }
    }

    return { valid: true };
}

/**
 * 안전한 HTML로 변환 (검증 + 정제)
 */
export function makeSafeHTML(html) {
    // 1. 먼저 정제 (위험한 태그 자동 제거)
    const cleaned = sanitizeHTML(html);

    // 2. 최소한의 유효성 검사
    if (!cleaned || cleaned.trim().length === 0) {
        throw new Error('HTML이 비어있습니다');
    }

    if (!cleaned.includes('<div')) {
        throw new Error('유효한 HTML 구조가 아닙니다');
    }

    return cleaned;
}
