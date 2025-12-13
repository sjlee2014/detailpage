/**
 * 비주얼 에디터 - 메인 로직
 * 요소 선택, 스타일 패널 제어, 이벤트 관리
 */

// ========== 인라인 Undo/Redo 시스템 ==========
let historyStack = [];
let historyIndex = -1;
const MAX_HISTORY = 30;

function pushHistory(html) {
    // 현재 위치 이후의 히스토리 삭제
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(html);
    if (historyStack.length > MAX_HISTORY) {
        historyStack.shift();
    }
    historyIndex = historyStack.length - 1;
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        return historyStack[historyIndex];
    }
    return null;
}

function redo() {
    if (historyIndex < historyStack.length - 1) {
        historyIndex++;
        return historyStack[historyIndex];
    }
    return null;
}

function initHistory(container) {
    historyStack = [container.innerHTML];
    historyIndex = 0;
}

function getHistoryInfo() {
    return {
        canUndo: historyIndex > 0,
        canRedo: historyIndex < historyStack.length - 1,
        index: historyIndex,
        length: historyStack.length
    };
}

// ========== 전역 상태 ==========
let isActive = false;
let selectedElement = null;
let previewContainer = null;
let stylePanel = null;

/**
 * 비주얼 에디터 활성화
 * @param {HTMLElement} previewElement - 미리보기 영역
 */
export function enableVisualEditor(previewElement) {
    if (isActive) return;

    isActive = true;
    previewContainer = previewElement;

    // 초기 히스토리 저장
    initHistory(previewElement);

    // 편집 모드 클래스 추가
    previewElement.classList.add('visual-editor-active');

    // 모든 요소에 클릭 이벤트 추가
    attachElementListeners(previewElement);

    // 키보드 단축키 등록
    registerKeyboardShortcuts();

    // 스타일 패널 표시
    showStylePanel();

    console.log('🎨 비주얼 에디터 활성화됨');
}

/**
 * 비주얼 에디터 비활성화
 */
export function disableVisualEditor() {
    if (!isActive) return;

    isActive = false;

    if (previewContainer) {
        previewContainer.classList.remove('visual-editor-active');
        removeElementListeners(previewContainer);
    }

    // 선택 해제
    deselectAll();

    // 키보드 단축키 제거
    unregisterKeyboardShortcuts();

    // 스타일 패널 숨김
    hideStylePanel();

    console.log('🚫 비주얼 에디터 비활성화됨');
}

/**
 * 요소에 이벤트 리스너 추가
 */
function attachElementListeners(container) {
    const editableElements = container.querySelectorAll('div, p, h1, h2, h3, h4, h5, h6, span, img, a, button');

    editableElements.forEach(el => {
        // 너무 작은 요소 제외 (높이 10px 미만)
        if (el.offsetHeight < 10) return;

        el.addEventListener('click', handleElementClick);
        el.addEventListener('mouseenter', handleElementHover);
        el.addEventListener('mouseleave', handleElementLeave);
    });
}

/**
 * 요소에서 이벤트 리스너 제거
 */
function removeElementListeners(container) {
    const elements = container.querySelectorAll('div, p, h1, h2, h3, h4, h5, h6, span, img, a, button');

    elements.forEach(el => {
        el.removeEventListener('click', handleElementClick);
        el.removeEventListener('mouseenter', handleElementHover);
        el.removeEventListener('mouseleave', handleElementLeave);
        el.classList.remove('visual-editor-hover', 'visual-editor-selected');
    });
}

/**
 * 요소 클릭 핸들러
 */
function handleElementClick(e) {
    if (!isActive) return;

    e.stopPropagation();
    e.preventDefault();

    selectElement(e.currentTarget);
}

/**
 * 요소 호버 핸들러
 */
function handleElementHover(e) {
    if (!isActive) return;
    if (selectedElement === e.currentTarget) return; // 선택된 요소는 제외

    e.stopPropagation();
    e.currentTarget.classList.add('visual-editor-hover');
}

/**
 * 요소 호버 해제 핸들러
 */
function handleElementLeave(e) {
    if (!isActive) return;

    e.stopPropagation();
    e.currentTarget.classList.remove('visual-editor-hover');
}

/**
 * 요소 선택
 * @param {HTMLElement} element - 선택할 요소
 */
export function selectElement(element) {
    if (!element) return;

    // 이전 선택 해제
    deselectAll();

    // 새 요소 선택
    selectedElement = element;
    selectedElement.classList.add('visual-editor-selected');

    console.log('✅ 요소 선택됨:', element.tagName, element.className);

    // 스타일 패널 업데이트
    updateStylePanel(element);

    // 선택 이벤트 발생
    const event = new CustomEvent('visualEditorElementSelected', {
        detail: { element }
    });
    document.dispatchEvent(event);
}

/**
 * 모든 선택 해제
 */
export function deselectAll() {
    if (selectedElement) {
        selectedElement.classList.remove('visual-editor-selected');
        selectedElement = null;
    }

    console.log('🔄 선택 해제됨');
}

/**
 * 현재 선택된 요소 반환
 * @returns {HTMLElement|null}
 */
export function getSelectedElement() {
    return selectedElement;
}

/**
 * 스타일 패널 표시
 */
function showStylePanel() {
    stylePanel = document.getElementById('stylePanel');
    if (stylePanel) {
        stylePanel.classList.remove('hidden');
    }
}

/**
 * 스타일 패널 숨김
 */
function hideStylePanel() {
    if (stylePanel) {
        stylePanel.classList.add('hidden');
    }
}

/**
 * 스타일 패널 업데이트
 * @param {HTMLElement} element - 선택된 요소
 */
function updateStylePanel(element) {
    // StylePanel.js에서 처리
    const event = new CustomEvent('updateStylePanel', {
        detail: { element }
    });
    document.dispatchEvent(event);
}

/**
 * 스타일 적용 (히스토리 저장 포함)
 * @param {HTMLElement} element - 대상 요소
 * @param {string} property - CSS 속성
 * @param {string} value - 값
 */
export function applyStyle(element, property, value) {
    if (!element) return;

    // 스타일 적용
    element.style[property] = value;

    // 히스토리 저장
    saveCurrentState();

    console.log(`🎨 스타일 적용: ${property} = ${value}`);
}

/**
 * 요소 삭제 (히스토리 저장 포함)
 * @param {HTMLElement} element - 삭제할 요소
 */
export function deleteElement(element) {
    if (!element) return;

    element.remove();
    deselectAll();

    // 히스토리 저장
    saveCurrentState();

    console.log('🗑️ 요소 삭제됨');
}

/**
 * 현재 상태 저장
 */
function saveCurrentState() {
    if (previewContainer) {
        pushHistory(previewContainer.innerHTML);
    }
}

/**
 * Undo 실행
 */
export function executeUndo() {
    const previousState = undo();
    if (previousState && previewContainer) {
        previewContainer.innerHTML = previousState;

        // 이벤트 리스너 재등록
        removeElementListeners(previewContainer);
        attachElementListeners(previewContainer);

        deselectAll();
        console.log('↩️ Undo 완료');
    }
}

/**
 * Redo 실행
 */
export function executeRedo() {
    const nextState = redo();
    if (nextState && previewContainer) {
        previewContainer.innerHTML = nextState;

        // 이벤트 리스너 재등록
        removeElementListeners(previewContainer);
        attachElementListeners(previewContainer);

        deselectAll();
        console.log('↪️ Redo 완료');
    }
}

/**
 * 키보드 단축키 등록
 */
let keyboardHandler = null;

function registerKeyboardShortcuts() {
    keyboardHandler = (e) => {
        // Ctrl+Z: Undo
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            executeUndo();
        }

        // Ctrl+Shift+Z 또는 Ctrl+Y: Redo
        if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
            e.preventDefault();
            executeRedo();
        }

        // Delete: 선택된 요소 삭제
        if (e.key === 'Delete' && selectedElement) {
            e.preventDefault();
            deleteElement(selectedElement);
        }

        // Escape: 선택 해제
        if (e.key === 'Escape') {
            e.preventDefault();
            deselectAll();
        }
    };

    document.addEventListener('keydown', keyboardHandler);
    console.log('⌨️ 키보드 단축키 등록됨 (Ctrl+Z, Ctrl+Shift+Z, Delete, Esc)');
}

/**
 * 키보드 단축키 제거
 */
function unregisterKeyboardShortcuts() {
    if (keyboardHandler) {
        document.removeEventListener('keydown', keyboardHandler);
        keyboardHandler = null;
    }
}

/**
 * 활성화 상태 확인
 * @returns {boolean}
 */
export function isVisualEditorActive() {
    return isActive;
}

/**
 * 히스토리 정보 반환
 * @returns {Object}
 */
export function getHistory() {
    return getHistoryInfo();
}
