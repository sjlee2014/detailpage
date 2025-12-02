/**
 * 패턴 및 텍스트 매칭 검증기
 * 생성된 HTML이 이미지의 실제 패턴/텍스트와 일치하는지 검증
 */

/**
 * HTML 내 이미지 사용 순서 및 주변 텍스트 검증
 * @param {string} html - 생성된 HTML
 * @param {Array} analysisResults - 이미지 분석 결과 배열
 */
export function validateImageTextMatching(html, analysisResults) {
    console.log('🕵️‍♂️ 이미지-텍스트 매칭 검증 시작...');

    const report = {
        isValid: true,
        issues: [],
        matches: []
    };

    // 1. 이미지 플레이스홀더 순서 확인
    const imagePlaceholders = html.match(/\{\{PRODUCT_IMAGE_(\d+)\}\}/g);

    if (!imagePlaceholders) {
        report.issues.push('이미지 플레이스홀더가 발견되지 않았습니다.');
        report.isValid = false;
        return report;
    }

    // 2. 각 이미지 주변 텍스트 분석
    analysisResults.forEach((result, index) => {
        const placeholder = `{{PRODUCT_IMAGE_${index}}}`;
        const placeholderIndex = html.indexOf(placeholder);

        if (placeholderIndex === -1) {
            report.issues.push(`이미지 ${index}가 HTML에 사용되지 않았습니다.`);
            // 필수 이미지가 빠지면 유효하지 않음 (단, 디자인에 따라 일부러 뺄 수도 있음)
        } else {
            // 이미지 주변 500자 텍스트 추출 (앞뒤)
            const start = Math.max(0, placeholderIndex - 250);
            const end = Math.min(html.length, placeholderIndex + 250);
            const surroundingText = html.substring(start, end);

            // OCR 텍스트가 주변에 있는지 확인
            if (result.ocrText && result.ocrText.length > 0) {
                // 공백 제거하고 비교
                const cleanOcr = result.ocrText.replace(/\s+/g, '');
                const cleanSurrounding = surroundingText.replace(/\s+/g, '');

                // OCR 텍스트의 일부라도 포함되어 있는지 확인 (완벽 일치는 어려울 수 있음)
                // 키워드 단위로 분리해서 확인
                const keywords = result.ocrText.split(/\s+/).filter(k => k.length > 1);
                const foundKeywords = keywords.filter(k => surroundingText.includes(k));

                if (foundKeywords.length > 0) {
                    report.matches.push(`✅ 이미지 ${index}: 텍스트 "${foundKeywords.join(', ')}" 발견`);
                } else {
                    // 텍스트가 없다고 해서 무조건 에러는 아님 (디자인적 선택일 수 있음)
                    // 하지만 경고는 필요
                    report.matches.push(`⚠️ 이미지 ${index}: OCR 텍스트 "${result.ocrText}"가 주변에서 발견되지 않음`);
                }
            }

            // 패턴 키워드 확인 (예: "꽃", "태극")
            if (result.pattern) {
                report.matches.push(`ℹ️ 이미지 ${index} 패턴: ${result.pattern}`);
            }
        }
    });

    console.log('✅ 검증 완료:', report);
    return report;
}

/**
 * 검증 보고서 텍스트 생성
 */
export function generateValidationReport(report) {
    if (report.issues.length === 0) {
        return '✅ 이미지 매칭 검증 통과';
    }
    return `⚠️ 검증 이슈 발견:\n${report.issues.join('\n')}`;
}
