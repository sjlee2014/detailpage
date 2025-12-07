/**
 * 스타일 편집 패널
 * 선택된 요소의 스타일을 시각적으로 편집
 */

import { applyStyle, deleteElement, getSelectedElement } from '../utils/visualEditor.js';

let currentElement = null;
let panel = null;

/**
 * 스타일 패널 초기화
 */
export function initStylePanel() {
    panel = document.getElementById('stylePanel');

    if (!panel) {
        console.error('❌ 스타일 패널을 찾을 수 없습니다');
        return;
    }

    // 패널 HTML 생성
    panel.innerHTML = createPanelHTML();

    // 이벤트 리스너 등록
    attachPanelListeners();

    // 요소 선택 이벤트 리스너
    document.addEventListener('updateStylePanel', (e) => {
        updatePanel(e.detail.element);
    });

    console.log('✅ 스타일 패널 초기화 완료');
}

/**
 * 패널 HTML 생성
 */
function createPanelHTML() {
    return `
    <div class="style-panel-header">
      <h3>🎨 스타일 편집</h3>
      <button id="closeStylePanel" class="close-btn">×</button>
    </div>

    <div class="style-panel-body">
      <!-- 요소 정보 -->
      <div class="panel-section" id="elementInfo">
        <p class="panel-hint">요소를 선택하세요</p>
      </div>

      <!-- 텍스트 편집 -->
      <div class="panel-section hidden" id="textEditSection">
        <label class="panel-label">✏️ 텍스트 내용</label>
        <textarea id="textContentInput" class="panel-textarea" rows="3"></textarea>
        <button id="applyTextBtn" class="btn btn-primary btn-sm btn-full mt-sm">적용</button>
      </div>

      <!-- 색상 편집 -->
      <div class="panel-section hidden" id="colorEditSection">
        <label class="panel-label">🎨 배경색</label>
        <div class="color-picker-row">
          <input type="color" id="bgColorPicker" class="color-input" value="#ffffff">
          <input type="text" id="bgColorText" class="color-text" value="#ffffff">
          <button id="resetBgColor" class="btn-icon" title="기본값">↻</button>
        </div>

        <label class="panel-label mt-md">🔤 글자색</label>
        <div class="color-picker-row">
          <input type="color" id="textColorPicker" class="color-input" value="#000000">
          <input type="text" id="textColorText" class="color-text" value="#000000">
          <button id="resetTextColor" class="btn-icon" title="기본값">↻</button>
        </div>
      </div>

      <!-- 폰트 편집 -->
      <div class="panel-section hidden" id="fontEditSection">
        <label class="panel-label">📏 폰트 크기: <span id="fontSizeValue">16px</span></label>
        <input type="range" id="fontSizeSlider" min="12" max="72" value="16" class="slider">

        <label class="panel-label mt-md">🔠 폰트 굵기</label>
        <div class="button-group">
          <button id="fontNormal" class="btn-toggle active" data-weight="normal">Normal</button>
          <button id="fontBold" class="btn-toggle" data-weight="bold">Bold</button>
        </div>
      </div>

      <!-- 정렬 -->
      <div class="panel-section hidden" id="alignEditSection">
        <label class="panel-label">📐 정렬</label>
        <div class="button-group">
          <button id="alignLeft" class="btn-toggle" data-align="left">←</button>
          <button id="alignCenter" class="btn-toggle" data-align="center">↔</button>
          <button id="alignRight" class="btn-toggle" data-align="right">→</button>
        </div>
      </div>

      <!-- 여백 편집 -->
      <div class="panel-section hidden" id="spacingEditSection">
        <label class="panel-label">📏 여백 (Padding): <span id="paddingValue">0px</span></label>
        <input type="range" id="paddingSlider" min="0" max="100" value="0" class="slider">
      </div>

      <!-- 액션 버튼 -->
      <div class="panel-section hidden" id="actionSection">
        <button id="deleteElementBtn" class="btn btn-secondary btn-full">
          🗑️ 요소 삭제
        </button>
      </div>
    </div>
  `;
}

/**
 * 패널에 이벤트 리스너 추가
 */
function attachPanelListeners() {
    // 닫기 버튼
    const closeBtn = panel.querySelector('#closeStylePanel');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            panel.classList.add('hidden');
        });
    }

    // 텍스트 적용
    const applyTextBtn = panel.querySelector('#applyTextBtn');
    if (applyTextBtn) {
        applyTextBtn.addEventListener('click', applyTextContent);
    }

    // 배경색
    const bgColorPicker = panel.querySelector('#bgColorPicker');
    const bgColorText = panel.querySelector('#bgColorText');
    if (bgColorPicker && bgColorText) {
        bgColorPicker.addEventListener('input', (e) => {
            bgColorText.value = e.target.value;
            applyBackgroundColor(e.target.value);
        });
        bgColorText.addEventListener('change', (e) => {
            bgColorPicker.value = e.target.value;
            applyBackgroundColor(e.target.value);
        });
    }

    // 글자색
    const textColorPicker = panel.querySelector('#textColorPicker');
    const textColorText = panel.querySelector('#textColorText');
    if (textColorPicker && textColorText) {
        textColorPicker.addEventListener('input', (e) => {
            textColorText.value = e.target.value;
            applyTextColor(e.target.value);
        });
        textColorText.addEventListener('change', (e) => {
            textColorPicker.value = e.target.value;
            applyTextColor(e.target.value);
        });
    }

    // 폰트 크기
    const fontSizeSlider = panel.querySelector('#fontSizeSlider');
    const fontSizeValue = panel.querySelector('#fontSizeValue');
    if (fontSizeSlider && fontSizeValue) {
        fontSizeSlider.addEventListener('input', (e) => {
            const size = e.target.value + 'px';
            fontSizeValue.textContent = size;
            applyFontSize(size);
        });
    }

    // 폰트 굵기
    const fontNormal = panel.querySelector('#fontNormal');
    const fontBold = panel.querySelector('#fontBold');
    if (fontNormal && fontBold) {
        fontNormal.addEventListener('click', () => {
            fontNormal.classList.add('active');
            fontBold.classList.remove('active');
            applyFontWeight('normal');
        });
        fontBold.addEventListener('click', () => {
            fontBold.classList.add('active');
            fontNormal.classList.remove('active');
            applyFontWeight('bold');
        });
    }

    // 정렬
    const alignButtons = panel.querySelectorAll('[data-align]');
    alignButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            alignButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyTextAlign(btn.dataset.align);
        });
    });

    // 여백
    const paddingSlider = panel.querySelector('#paddingSlider');
    const paddingValue = panel.querySelector('#paddingValue');
    if (paddingSlider && paddingValue) {
        paddingSlider.addEventListener('input', (e) => {
            const padding = e.target.value + 'px';
            paddingValue.textContent = padding;
            applyPadding(padding);
        });
    }

    // 삭제 버튼
    const deleteBtn = panel.querySelector('#deleteElementBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (currentElement && confirm('이 요소를 삭제하시겠습니까?')) {
                deleteElement(currentElement);
                hideAllSections();
            }
        });
    }

    // 리셋 버튼들
    const resetBgBtn = panel.querySelector('#resetBgColor');
    if (resetBgBtn) {
        resetBgBtn.addEventListener('click', () => {
            applyBackgroundColor('');
            bgColorPicker.value = '#ffffff';
            bgColorText.value = 'transparent';
        });
    }

    const resetTextBtn = panel.querySelector('#resetTextColor');
    if (resetTextBtn) {
        resetTextBtn.addEventListener('click', () => {
            applyTextColor('');
            textColorPicker.value = '#000000';
            textColorText.value = 'inherit';
        });
    }
}

/**
 * 패널 업데이트
 * @param {HTMLElement} element - 선택된 요소
 */
function updatePanel(element) {
    if (!element || !panel) return;

    currentElement = element;

    // 요소 정보 표시
    const infoSection = panel.querySelector('#elementInfo');
    if (infoSection) {
        infoSection.innerHTML = `
      <p class="panel-hint">
        <strong>${element.tagName.toLowerCase()}</strong>
        ${element.className ? `<span class="element-class">.${element.className.split(' ')[0]}</span>` : ''}
      </p>
    `;
    }

    // 섹션 표시/숨김
    showRelevantSections(element);

    // 현재 값으로 입력 필드 채우기
    populateCurrentValues(element);
}

/**
 * 요소 유형에 따라 관련 섹션만 표시
 */
function showRelevantSections(element) {
    const textEditSection = panel.querySelector('#textEditSection');
    const colorEditSection = panel.querySelector('#colorEditSection');
    const fontEditSection = panel.querySelector('#fontEditSection');
    const alignEditSection = panel.querySelector('#alignEditSection');
    const spacingEditSection = panel.querySelector('#spacingEditSection');
    const actionSection = panel.querySelector('#actionSection');

    // 모두 숨김
    hideAllSections();

    const tagName = element.tagName.toLowerCase();
    const isTextElement = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'button', 'div'].includes(tagName);
    const isImage = tagName === 'img';

    // 텍스트 요소
    if (isTextElement && element.textContent.trim().length > 0) {
        textEditSection.classList.remove('hidden');
        fontEditSection.classList.remove('hidden');
    }

    // 모든 요소에 색상/정렬/여백 편집 허용
    colorEditSection.classList.remove('hidden');
    alignEditSection.classList.remove('hidden');
    spacingEditSection.classList.remove('hidden');

    // 액션 버튼 항상 표시
    actionSection.classList.remove('hidden');
}

/**
 * 모든 섹션 숨김
 */
function hideAllSections() {
    const sections = panel.querySelectorAll('.panel-section:not(#elementInfo)');
    sections.forEach(section => section.classList.add('hidden'));
}

/**
 * 현재 값으로 입력 필드 채우기
 */
function populateCurrentValues(element) {
    const computed = window.getComputedStyle(element);

    // 텍스트 내용
    const textInput = panel.querySelector('#textContentInput');
    if (textInput) {
        textInput.value = element.textContent.trim();
    }

    // 배경색
    const bgColor = rgbToHex(computed.backgroundColor);
    const bgColorPicker = panel.querySelector('#bgColorPicker');
    const bgColorText = panel.querySelector('#bgColorText');
    if (bgColorPicker && bgColorText) {
        bgColorPicker.value = bgColor;
        bgColorText.value = bgColor;
    }

    // 글자색
    const textColor = rgbToHex(computed.color);
    const textColorPicker = panel.querySelector('#textColorPicker');
    const textColorText = panel.querySelector('#textColorText');
    if (textColorPicker && textColorText) {
        textColorPicker.value = textColor;
        textColorText.value = textColor;
    }

    // 폰트 크기
    const fontSize = parseInt(computed.fontSize);
    const fontSizeSlider = panel.querySelector('#fontSizeSlider');
    const fontSizeValue = panel.querySelector('#fontSizeValue');
    if (fontSizeSlider && fontSizeValue) {
        fontSizeSlider.value = fontSize;
        fontSizeValue.textContent = fontSize + 'px';
    }

    // 폰트 굵기
    const fontWeight = computed.fontWeight;
    const fontNormal = panel.querySelector('#fontNormal');
    const fontBold = panel.querySelector('#fontBold');
    if (fontNormal && fontBold) {
        if (parseInt(fontWeight) >= 600) {
            fontBold.classList.add('active');
            fontNormal.classList.remove('active');
        } else {
            fontNormal.classList.add('active');
            fontBold.classList.remove('active');
        }
    }

    // 정렬
    const textAlign = computed.textAlign;
    const alignButtons = panel.querySelectorAll('[data-align]');
    alignButtons.forEach(btn => {
        if (btn.dataset.align === textAlign) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 여백
    const padding = parseInt(computed.padding);
    const paddingSlider = panel.querySelector('#paddingSlider');
    const paddingValue = panel.querySelector('#paddingValue');
    if (paddingSlider && paddingValue) {
        paddingSlider.value = padding;
        paddingValue.textContent = padding + 'px';
    }
}

/**
 * RGB를 HEX로 변환
 */
function rgbToHex(rgb) {
    if (!rgb || rgb.includes('rgba(0, 0, 0, 0)') || rgb === 'transparent') {
        return '#ffffff';
    }

    const match = rgb.match(/\d+/g);
    if (!match) return '#000000';

    const r = parseInt(match[0]).toString(16).padStart(2, '0');
    const g = parseInt(match[1]).toString(16).padStart(2, '0');
    const b = parseInt(match[2]).toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
}

// ===== 스타일 적용 함수들 =====

function applyTextContent() {
    const textInput = panel.querySelector('#textContentInput');
    if (currentElement && textInput) {
        currentElement.textContent = textInput.value;
        applyStyle(currentElement, 'textContent', textInput.value);
    }
}

function applyBackgroundColor(color) {
    if (currentElement) {
        applyStyle(currentElement, 'backgroundColor', color);
    }
}

function applyTextColor(color) {
    if (currentElement) {
        applyStyle(currentElement, 'color', color);
    }
}

function applyFontSize(size) {
    if (currentElement) {
        applyStyle(currentElement, 'fontSize', size);
    }
}

function applyFontWeight(weight) {
    if (currentElement) {
        applyStyle(currentElement, 'fontWeight', weight);
    }
}

function applyTextAlign(align) {
    if (currentElement) {
        applyStyle(currentElement, 'textAlign', align);
    }
}

function applyPadding(padding) {
    if (currentElement) {
        applyStyle(currentElement, 'padding', padding);
    }
}
