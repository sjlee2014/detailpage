/**
 * Undo/Redo 스택 관리
 * 상태 히스토리를 저장하고 되돌리기/다시실행 기능 제공
 */

const MAX_HISTORY_SIZE = 20; // 최대 20개까지 저장 (메모리 절약)

let history = []; // 히스토리 스택
let historyIndex = -1; // 현재 위치

/**
 * 현재 상태를 히스토리에 저장
 * @param {string} htmlSnapshot - 현재 HTML 스냅샷
 */
export function pushHistory(htmlSnapshot) {
    // Redo 불가능한 분기: 현재 인덱스 이후 삭제
    if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
    }

    // 새 상태 추가
    history.push(htmlSnapshot);

    // 최대 크기 초과 시 가장 오래된 것 삭제
    if (history.length > MAX_HISTORY_SIZE) {
        history.shift();
    } else {
        historyIndex++;
    }

    console.log(`📚 히스토리 저장됨 (${historyIndex + 1}/${history.length})`);
}

/**
 * Undo - 이전 상태로 복원
 * @returns {string|null} 이전 상태의 HTML 또는 null
 */
export function undo() {
    if (historyIndex <= 0) {
        console.warn('⚠️ Undo 불가능: 히스토리 시작점');
        return null;
    }

    historyIndex--;
    const previousState = history[historyIndex];
    console.log(`↩️ Undo 실행 (${historyIndex + 1}/${history.length})`);
    return previousState;
}

/**
 * Redo - 다음 상태로 복원
 * @returns {string|null} 다음 상태의 HTML 또는 null
 */
export function redo() {
    if (historyIndex >= history.length - 1) {
        console.warn('⚠️ Redo 불가능: 히스토리 끝');
        return null;
    }

    historyIndex++;
    const nextState = history[historyIndex];
    console.log(`↪️ Redo 실행 (${historyIndex + 1}/${history.length})`);
    return nextState;
}

/**
 * 히스토리 초기화
 */
export function clearHistory() {
    history = [];
    historyIndex = -1;
    console.log('🗑️ 히스토리 초기화됨');
}

/**
 * 현재 히스토리 상태 반환 (디버깅용)
 * @returns {Object} 히스토리 정보
 */
export function getHistoryInfo() {
    return {
        size: history.length,
        index: historyIndex,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
    };
}

/**
 * 초기 상태 저장
 * @param {HTMLElement} previewElement - 미리보기 영역
 */
export function initHistory(previewElement) {
    clearHistory();
    pushHistory(previewElement.innerHTML);
    console.log('✅ 초기 히스토리 저장됨');
}
