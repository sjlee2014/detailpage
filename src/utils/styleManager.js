/**
 * 스타일 예시 관리
 * Local Storage를 사용하여 상세페이지 예시 저장 및 관리
 */

const STORAGE_KEY = 'vibecoding_style_examples';

/**
 * 모든 예시 가져오기
 */
export function getExamples() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            return [];
        }
        return JSON.parse(data);
    } catch (error) {
        console.error('예시 불러오기 실패:', error);
        return [];
    }
}

/**
 * 예시 저장
 */
export function saveExample(imageData, metadata = {}) {
    try {
        const examples = getExamples();

        const newExample = {
            id: Date.now().toString(),
            image: imageData,
            uploadedAt: new Date().toISOString(),
            ...metadata,
        };

        examples.push(newExample);

        // 최대 5개까지만 저장
        if (examples.length > 5) {
            examples.shift(); // 가장 오래된 것 제거
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(examples));
        return newExample;
    } catch (error) {
        console.error('예시 저장 실패:', error);
        throw new Error('예시 저장에 실패했습니다');
    }
}

/**
 * 예시 삭제
 */
export function deleteExample(id) {
    try {
        const examples = getExamples();
        const filtered = examples.filter(ex => ex.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('예시 삭제 실패:', error);
        return false;
    }
}

/**
 * 모든 예시 삭제
 */
export function clearExamples() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('예시 초기화 실패:', error);
        return false;
    }
}

/**
 * 예시 개수 확인
 */
export function getExampleCount() {
    return getExamples().length;
}
