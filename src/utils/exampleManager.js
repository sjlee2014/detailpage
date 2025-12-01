/**
 * 예시 이미지 관리 (Few-shot Learning)
 * src/examples 폴더의 이미지를 로드하여 AI 프롬프트에 주입
 */

/**
 * 예시 이미지 목록 정의
 * 사용자가 이미지를 추가하면 여기에 경로를 추가하세요
 */
const EXAMPLE_LIBRARY = {
    minimal: [
        '/examples/minimal/example_smile_badge.jpg',
        '/examples/minimal/example_korea_badge.jpg',
    ],
    rich: [
        '/examples/rich/example_long_detail.jpg',
        '/examples/rich/example_colorful_house.jpg',
        '/examples/rich/example_snowflake_sticker.png',
        '/examples/rich/example_ornament_collection.png',
    ]
};

/**
 * 스타일에 맞는 예시 이미지 경로 반환
 * @param {string} style - 'minimal' 또는 'rich'
 * @returns {Array<string>} 이미지 경로 배열
 */
export function getExamplePaths(style = 'minimal') {
    return EXAMPLE_LIBRARY[style] || [];
}

/**
 * 이미지 경로를 Data URL로 변환
 * @param {string} imagePath - 이미지 경로
 * @returns {Promise<string>} Data URL
 */
export async function loadImageAsDataURL(imagePath) {
    try {
        const response = await fetch(imagePath);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('이미지 로드 실패:', imagePath, error);
        return null;
    }
}

/**
 * 스타일에 맞는 예시 이미지를 Data URL로 로드
 * @param {string} style - 'minimal' 또는 'rich'
 * @param {number} maxExamples - 최대 예시 개수 (기본: 3)
 * @returns {Promise<Array<string>>} Data URL 배열
 */
export async function loadExampleImages(style = 'minimal', maxExamples = 3) {
    const paths = getExamplePaths(style);
    const limitedPaths = paths.slice(0, maxExamples);

    if (limitedPaths.length === 0) {
        console.log(`${style} 스타일 예시가 없습니다.`);
        return [];
    }

    const dataURLs = await Promise.all(
        limitedPaths.map(path => loadImageAsDataURL(path))
    );

    // null 제거 (로드 실패한 이미지)
    return dataURLs.filter(url => url !== null);
}

/**
 * 모든 스타일의 예시 개수 반환
 * @returns {Object} 스타일별 예시 개수
 */
export function getExampleCounts() {
    return {
        minimal: EXAMPLE_LIBRARY.minimal.length,
        rich: EXAMPLE_LIBRARY.rich.length,
        total: EXAMPLE_LIBRARY.minimal.length + EXAMPLE_LIBRARY.rich.length
    };
}

/**
 * 사용자 가이드 메시지
 */
export function getUsageGuide() {
    const counts = getExampleCounts();
    return `
📚 Few-shot Learning 예시 라이브러리
- 미니멀 스타일: ${counts.minimal}개
- 풍부한 스타일: ${counts.rich}개
- 총 ${counts.total}개

예시를 추가하려면:
1. /src/examples/minimal 또는 /rich 폴더에 이미지 추가
2. src/utils/exampleManager.js의 EXAMPLE_LIBRARY에 경로 추가
3. 페이지 새로고침
    `.trim();
}
