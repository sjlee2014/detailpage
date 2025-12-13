/**
 * 템플릿 기반 상세페이지 생성기 V2
 * 섹션 토글, Option/Size 입력, 그리드 설정 지원
 */

import { generateDetailPage, themes } from '../templates/detailPageTemplate.js';
import { generateComponents, generateSteps } from '../utils/ollamaClient.js';
import { showToast, showConfirm, showLoading } from '../utils/uiHelpers.js';

class TemplatePageGenerator {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.slots = {
      productName: '',
      subtitle: '',
      heroImage: null,
      options: [], // [{image, name}]
      productImages: [], // [{image, caption}]
      components: [], // [{name, qty, icon, image}]
      componentDesc: '', // 구성품 공통 설명
      steps: [], // [{title, description, image}]
      sizeInfo: { text: '', image: null },
      notices: [
        '제품 색상은 모니터에 따라 다르게 보일 수 있습니다.',
        '수공예 제품 특성상 약간의 개별 차이가 있을 수 있습니다.'
      ],
      primaryColor: '#6B5CE7',
      secondaryColor: '#FF6B9D',
      sectionToggles: {
        option: true,
        component: true,
        detail: true,
        size: true,
        steps: true,
        notice: true
      },
      gridColumns: {
        option: 2,
        component: 3,
        detail: 1
      }
    };
    this.selectedTheme = 'purple';
    this.editMode = false;
    this.selectedElement = null;
    this.originalContent = null;
    this.init();
  }

  init() {
    this.loadFromStorage();
    this.render();
    this.bindEvents();
    this.restoreInputValues();
    this.updatePreview();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('templatePageGenerator_slots');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.slots = { ...this.slots, ...parsed };
      }
      const savedTheme = localStorage.getItem('templatePageGenerator_theme');
      if (savedTheme) {
        this.selectedTheme = savedTheme;
        const theme = themes[this.selectedTheme];
        if (theme) {
          this.slots.primaryColor = theme.primary;
          this.slots.secondaryColor = theme.secondary;
        }
      }
    } catch (e) {
      console.error('Failed to load from storage:', e);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('templatePageGenerator_slots', JSON.stringify(this.slots));
      localStorage.setItem('templatePageGenerator_theme', this.selectedTheme);
    } catch (e) {
      console.error('Failed to save to storage:', e);
      showToast('저장 실패: 저장 공간이 부족합니다.', 'error');
    }
  }

  restoreInputValues() {
    // 텍스트 입력 복원
    const productNameInput = this.container.querySelector('#tpl-product-name');
    const subtitleInput = this.container.querySelector('#tpl-subtitle');
    const componentDescInput = this.container.querySelector('#component-desc');
    const sizeTextInput = this.container.querySelector('#size-text');

    if (productNameInput) productNameInput.value = this.slots.productName || '';
    if (subtitleInput) subtitleInput.value = this.slots.subtitle || '';
    if (componentDescInput) componentDescInput.value = this.slots.componentDesc || '';
    if (sizeTextInput) sizeTextInput.value = this.slots.sizeInfo?.text || '';

    // 히어로 이미지 복원
    const heroPreview = this.container.querySelector('#hero-preview');
    if (this.slots.heroImage && heroPreview) {
      heroPreview.innerHTML = `<img src="${this.slots.heroImage}" alt="대표 이미지">`;
      heroPreview.classList.add('show');
    }

    // 사이즈 이미지 복원
    const sizePreview = this.container.querySelector('#size-preview');
    if (this.slots.sizeInfo?.image && sizePreview) {
      sizePreview.innerHTML = `<img src="${this.slots.sizeInfo.image}" alt="사이즈">`;
      sizePreview.classList.add('show');
    }

    // 리스트 렌더링
    this.renderOptions();
    this.renderComponents();
    this.renderProductImages();
    this.renderSteps();
    this.renderNotices();
  }

  render() {
    this.container.innerHTML = `
      <div class="template-generator">
        <div class="input-panel">
          <h2>📝 상세페이지 정보 입력</h2>
          
          <!-- 테마 선택 -->
          <div class="form-group">
            <label>🎨 테마 선택</label>
            <div class="theme-selector">
              ${Object.entries(themes).map(([key, theme]) => `
                <button class="theme-btn ${this.selectedTheme === key ? 'active' : ''}" 
                        data-theme="${key}"
                        style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary})">
                </button>
              `).join('')}
            </div>
          </div>

          <!-- 섹션 토글 -->
          <div class="form-group">
            <label>⚙️ 섹션 표시 설정</label>
            <div class="toggle-grid">
              <label class="toggle-item">
                <input type="checkbox" id="toggle-option" ${this.slots.sectionToggles.option ? 'checked' : ''} />
                <span>옵션</span>
              </label>
              <label class="toggle-item">
                <input type="checkbox" id="toggle-component" ${this.slots.sectionToggles.component ? 'checked' : ''} />
                <span>구성품</span>
              </label>
              <label class="toggle-item">
                <input type="checkbox" id="toggle-detail" ${this.slots.sectionToggles.detail ? 'checked' : ''} />
                <span>상세</span>
              </label>
              <label class="toggle-item">
                <input type="checkbox" id="toggle-size" ${this.slots.sectionToggles.size ? 'checked' : ''} />
                <span>사이즈</span>
              </label>
              <label class="toggle-item">
                <input type="checkbox" id="toggle-steps" ${this.slots.sectionToggles.steps ? 'checked' : ''} />
                <span>만들기 순서</span>
              </label>
              <label class="toggle-item">
                <input type="checkbox" id="toggle-notice" ${this.slots.sectionToggles.notice ? 'checked' : ''} />
                <span>유의사항</span>
              </label>
            </div>
          </div>

          <!-- 그리드 설정 -->
          <div class="form-group">
            <label>📐 그리드 열 수</label>
            <div class="grid-settings">
              <div class="grid-setting-item">
                <span>옵션</span>
                <select id="grid-option">
                  <option value="1" ${this.slots.gridColumns.option === 1 ? 'selected' : ''}>1열</option>
                  <option value="2" ${this.slots.gridColumns.option === 2 ? 'selected' : ''}>2열</option>
                  <option value="3" ${this.slots.gridColumns.option === 3 ? 'selected' : ''}>3열</option>
                  <option value="4" ${this.slots.gridColumns.option === 4 ? 'selected' : ''}>4열</option>
                  <option value="5" ${this.slots.gridColumns.option === 5 ? 'selected' : ''}>5열</option>
                </select>
              </div>
              <div class="grid-setting-item">
                <span>구성품</span>
                <select id="grid-component">
                  <option value="1" ${this.slots.gridColumns.component === 1 ? 'selected' : ''}>1열</option>
                  <option value="2" ${this.slots.gridColumns.component === 2 ? 'selected' : ''}>2열</option>
                  <option value="3" ${this.slots.gridColumns.component === 3 ? 'selected' : ''}>3열</option>
                  <option value="4" ${this.slots.gridColumns.component === 4 ? 'selected' : ''}>4열</option>
                  <option value="5" ${this.slots.gridColumns.component === 5 ? 'selected' : ''}>5열</option>
                </select>
              </div>
              <div class="grid-setting-item">
                <span>상세</span>
                <select id="grid-detail">
                  <option value="1" ${this.slots.gridColumns.detail === 1 ? 'selected' : ''}>1열</option>
                  <option value="2" ${this.slots.gridColumns.detail === 2 ? 'selected' : ''}>2열</option>
                  <option value="3" ${this.slots.gridColumns.detail === 3 ? 'selected' : ''}>3열</option>
                  <option value="4" ${this.slots.gridColumns.detail === 4 ? 'selected' : ''}>4열</option>
                  <option value="5" ${this.slots.gridColumns.detail === 5 ? 'selected' : ''}>5열</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 제품명 -->
          <div class="form-group">
            <label>📦 제품명 *</label>
            <input type="text" id="tpl-product-name" placeholder="예: 귀여운 동물 뱃지 만들기" class="text-input" />
          </div>

          <!-- 부제목 -->
          <div class="form-group">
            <label>💬 부제목</label>
            <input type="text" id="tpl-subtitle" placeholder="예: 아이들과 함께 만드는 창작 키트" class="text-input" />
          </div>

          <!-- 대표 이미지 -->
          <div class="form-group">
            <label>🖼️ 대표 이미지</label>
            <input type="file" id="hero-input" accept="image/*" class="file-input" />
            <div id="hero-preview" class="preview-box"></div>
          </div>

          <!-- Option 섹션 -->
          <div class="form-group section-group" data-section="option">
            <div class="row-header">
              <label>🎯 Option (옵션 종류)</label>
            </div>
            <p class="hint">이미지 여러 개를 한번에 선택할 수 있습니다</p>
            <input type="file" id="option-bulk-input" accept="image/*" multiple class="file-input" />
            <div id="options-list"></div>
          </div>

          <!-- Component 섹션 -->
          <div class="form-group section-group" data-section="component">
            <div class="row-header">
              <label>📋 Component (구성품)</label>
              <button class="ai-btn" id="ai-components">🤖 AI 추천</button>
            </div>
            <input type="text" id="component-desc" placeholder="구성품 공통 설명 (예: 만들기 용품 세트)" class="text-input" style="margin-bottom:12px;" />
            <input type="file" id="component-bulk-input" accept="image/*" multiple class="file-input" />
            <div id="components-list"></div>
          </div>

          <!-- Detail 섹션 -->
          <div class="form-group section-group" data-section="detail">
            <label>📸 Detail (상세 이미지)</label>
            <p class="hint">이미지 여러 개를 한번에 선택할 수 있습니다</p>
            <input type="file" id="detail-bulk-input" accept="image/*" multiple class="file-input" />
            <div id="product-images-list"></div>
          </div>

          <!-- Size 섹션 -->
          <div class="form-group section-group" data-section="size">
            <label>📏 Size (크기 정보)</label>
            <input type="text" id="size-text" placeholder="예: 직경 7.5cm" class="text-input" />
            <input type="file" id="size-image-input" accept="image/*" class="file-input" />
            <div id="size-preview" class="preview-box"></div>
          </div>

          <!-- Steps 섹션 -->
          <div class="form-group section-group" data-section="steps">
            <div class="row-header">
              <label>🔢 How to Make (만들기 순서)</label>
              <button class="ai-btn" id="ai-steps">🤖 AI 추천</button>
            </div>
            <div id="steps-list"></div>
            <button class="add-btn" id="add-step">+ 단계 추가</button>
          </div>

          <!-- Notice 섹션 -->
          <div class="form-group section-group" data-section="notice">
            <label>⚠️ Notice (유의사항)</label>
            <div id="notices-list"></div>
            <button class="add-btn" id="add-notice">+ 유의사항 추가</button>
          </div>

          <!-- 액션 버튼 -->
          <div class="action-buttons">
            <button class="primary-btn" id="generate-page">🚀 상세페이지 생성</button>
            <button class="secondary-btn" id="download-html">📥 HTML</button>
            <button class="secondary-btn" id="download-jpg" style="background:#10b981;color:white;border-color:#10b981;">🖼️ JPG 고화질</button>
          </div>
        </div>

        <!-- 우측: 미리보기 -->
        <div class="preview-panel">
          <div class="preview-header">
            <h2>👁️ 실시간 미리보기</h2>
            <div class="preview-controls">
              <button class="edit-mode-btn" id="toggle-edit-mode">✏️ 편집 모드</button>
              <span class="preview-size">860px</span>
            </div>
          </div>
          
          <div class="preview-container">
            <div class="preview-scroll">
              <div class="preview-frame" id="preview-frame"></div>
            </div>
            
            <!-- 편집 패널 (우측 고정 사이드바) -->
            <div class="edit-panel" id="edit-panel" style="display:none;">
              <div class="edit-panel-header">
                <span>🎨 텍스트 편집</span>
                <button class="close-edit-panel" id="close-edit-panel">✕</button>
              </div>
              <div class="edit-panel-content">
                <div class="edit-group">
                  <label>색상</label>
                  <div class="color-controls">
                    <input type="color" id="edit-color" value="#333333">
                    <div class="color-presets">
                      <button class="color-preset" data-color="#333333" style="background:#333333;"></button>
                      <button class="color-preset" data-color="#6366f1" style="background:#6366f1;"></button>
                      <button class="color-preset" data-color="#10b981" style="background:#10b981;"></button>
                      <button class="color-preset" data-color="#f59e0b" style="background:#f59e0b;"></button>
                      <button class="color-preset" data-color="#ef4444" style="background:#ef4444;"></button>
                      <button class="color-preset" data-color="#ec4899" style="background:#ec4899;"></button>
                    </div>
                  </div>
                </div>
                <div class="edit-group">
                  <label>폰트</label>
                  <select id="edit-font">
                    <option value="'Noto Sans KR', sans-serif">Noto Sans KR</option>
                    <option value="'Pacifico', cursive">Pacifico (손글씨)</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Georgia, serif">Georgia</option>
                  </select>
                </div>
                <div class="edit-group">
                  <label>크기 <span id="font-size-value">16px</span></label>
                  <input type="range" id="edit-font-size" min="10" max="72" value="16">
                </div>
                <div class="edit-group">
                  <label>위치 조정</label>
                  <div class="position-controls">
                    <button class="pos-btn" data-dir="up">↑</button>
                    <div class="pos-row">
                      <button class="pos-btn" data-dir="left">←</button>
                      <button class="pos-btn" data-dir="reset">⟲</button>
                      <button class="pos-btn" data-dir="right">→</button>
                    </div>
                    <button class="pos-btn" data-dir="down">↓</button>
                  </div>
                </div>
                <div class="edit-group">
                  <label>텍스트 수정</label>
                  <textarea id="edit-text" rows="3" placeholder="텍스트 선택 후 수정"></textarea>
                </div>
                <p class="edit-hint">💡 텍스트 클릭 후 직접 수정 가능</p>
                <div class="edit-actions">
                  <button class="edit-save-btn" id="edit-save">✓ 저장</button>
                  <button class="edit-cancel-btn" id="edit-cancel">✕ 취소</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        * {
          box-sizing: border-box;
        }

        .template-generator {
          display: grid;
          grid-template-columns: 450px 1fr;
          gap: 0;
          min-height: 100vh;
          background: #f5f5f5;
          font-family: 'Noto Sans KR', sans-serif;
        }

        .input-panel {
          background: white;
          padding: 24px;
          overflow-y: auto;
          height: 100vh;
          border-right: 1px solid #e8e8e8;
          position: sticky;
          top: 0;
        }

        .input-panel h2 {
          font-size: 18px;
          margin-bottom: 20px;
          color: #333;
        }

        .form-group {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0f0f0;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #444;
          font-size: 14px;
        }

        .hint {
          font-size: 12px;
          color: #888;
          margin: -4px 0 8px 0;
        }

        /* 토글 그리드 */
        .toggle-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .toggle-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #555;
          cursor: pointer;
        }

        .toggle-item input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #6B5CE7;
        }

        /* 그리드 설정 */
        .grid-settings {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .grid-setting-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .grid-setting-item select {
          padding: 6px 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 13px;
        }

        /* 텍스트 입력 */
        .text-input {
          width: 100%;
          padding: 12px 14px;
          border: 2px solid #e8e8e8;
          border-radius: 10px;
          font-size: 14px;
          transition: all 0.2s;
          background: #fafafa;
          font-family: inherit;
        }

        .text-input:focus {
          border-color: #6B5CE7;
          outline: none;
          background: white;
          box-shadow: 0 0 0 3px rgba(107, 92, 231, 0.1);
        }

        /* 파일 입력 */
        .file-input {
          width: 100%;
          padding: 10px;
          border: 2px dashed #d0d0d0;
          border-radius: 10px;
          background: #fafafa;
          cursor: pointer;
          font-size: 13px;
          color: #666;
          transition: all 0.2s;
          font-family: inherit;
        }

        .file-input:hover {
          border-color: #6B5CE7;
          background: #f5f0ff;
        }

        .preview-box {
          margin-top: 8px;
          display: none;
        }

        .preview-box.show {
          display: block;
        }

        .preview-box img {
          width: 100%;
          max-height: 150px;
          object-fit: contain;
          border-radius: 8px;
          background: #f5f5f5;
        }

        /* 테마 선택 */
        .theme-selector {
          display: flex;
          gap: 8px;
        }

        .theme-btn {
          width: 40px;
          height: 40px;
          border: 3px solid transparent;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .theme-btn:hover {
          transform: scale(1.1);
        }

        .theme-btn.active {
          border-color: #333;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        /* 버튼 */
        .add-btn {
          width: 100%;
          padding: 10px;
          border: 2px dashed #d0d0d0;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          color: #888;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .add-btn:hover {
          border-color: #6B5CE7;
          color: #6B5CE7;
          background: #f5f0ff;
        }

        .row-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .row-header label {
          margin-bottom: 0;
        }

        .ai-btn {
          background: linear-gradient(135deg, #10b981, #3b82f6);
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 14px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ai-btn:hover {
          transform: scale(1.05);
        }

        /* 카드 아이템 */
        .item-card {
          background: #f8f8f8;
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 10px;
        }

        .item-card input,
        .item-card textarea {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 13px;
          font-family: inherit;
          margin-top: 6px;
        }

        .item-card textarea {
          min-height: 50px;
          resize: vertical;
        }

        .item-card .remove-btn {
          background: #ff6b6b;
          color: white;
          border: none;
          padding: 4px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          margin-top: 8px;
        }

        .item-card .remove-btn:hover {
          background: #e55555;
        }

        .item-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .item-row input {
          flex: 1;
        }

        /* 액션 버튼 */
        .action-buttons {
          display: flex;
          gap: 10px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }

        .primary-btn {
          flex: 1;
          padding: 14px;
          background: linear-gradient(135deg, #6B5CE7, #FF6B9D);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(107, 92, 231, 0.3);
        }

        .secondary-btn {
          padding: 14px 20px;
          background: white;
          color: #6B5CE7;
          border: 2px solid #6B5CE7;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .secondary-btn:hover {
          background: #f5f0ff;
        }

        /* 미리보기 패널 */
        .preview-panel {
          background: #e8e8e8;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .preview-header {
          background: white;
          padding: 14px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #ddd;
        }

        .preview-header h2 {
          font-size: 15px;
          color: #333;
          margin: 0;
        }

        .preview-size {
          font-size: 12px;
          color: #999;
          background: #f5f5f5;
          padding: 4px 10px;
          border-radius: 4px;
        }

        .preview-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .edit-mode-btn {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .edit-mode-btn:hover {
          background: #e5e7eb;
        }

        .edit-mode-btn.active {
          background: #6366f1;
          color: white;
          border-color: #6366f1;
        }

        /* 편집 패널 - 우측 고정 사이드바 */
        .preview-container {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .edit-panel {
          width: 220px;
          background: white;
          border-left: 1px solid #ddd;
          padding: 16px;
          overflow-y: auto;
          position: fixed;
          right: 0;
          top: 60px;
          height: calc(100vh - 60px);
          z-index: 100;
          box-shadow: -2px 0 10px rgba(0,0,0,0.1);
          animation: slideIn 0.2s ease;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .edit-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .close-edit-panel {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #666;
        }

        .edit-panel-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .edit-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .edit-group label {
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }

        .color-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .color-controls input[type="color"] {
          width: 36px;
          height: 30px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }

        .color-presets {
          display: flex;
          gap: 4px;
        }

        .color-preset {
          width: 20px;
          height: 20px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 4px;
          cursor: pointer;
          transition: transform 0.1s;
        }

        .color-preset:hover {
          transform: scale(1.2);
        }

        .edit-group select {
          padding: 6px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
        }

        .edit-group input[type="range"] {
          width: 100%;
        }

        .position-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .pos-row {
          display: flex;
          gap: 4px;
        }

        .pos-btn {
          width: 28px;
          height: 28px;
          border: 1px solid #ddd;
          background: #f9f9f9;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .pos-btn:hover {
          background: #e8e8e8;
        }

        .edit-hint {
          font-size: 11px;
          color: #888;
          margin: 0;
        }

        .edit-group textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
          resize: vertical;
          font-family: inherit;
        }

        .edit-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .edit-save-btn {
          flex: 1;
          padding: 10px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }

        .edit-save-btn:hover {
          background: #059669;
        }

        .edit-cancel-btn {
          flex: 1;
          padding: 10px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }

        .edit-cancel-btn:hover {
          background: #dc2626;
        }

        .preview-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          justify-content: center;
        }

        .preview-frame {
          width: 860px;
          background: white;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          border-radius: 8px;
          overflow: hidden;
        }

        .preview-frame iframe {
          width: 100%;
          min-height: 2000px;
          border: none;
          display: block;
        }

        /* 섹션 그룹 비활성화 */
        .section-group.disabled {
          opacity: 0.4;
          pointer-events: none;
        }
      </style>
    `;
  }

  bindEvents() {
    // 테마 선택
    this.container.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedTheme = btn.dataset.theme;
        const theme = themes[this.selectedTheme];
        this.slots.primaryColor = theme.primary;
        this.slots.secondaryColor = theme.secondary;
        this.container.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.updatePreview();
      });
    });

    // 섹션 토글
    ['option', 'component', 'detail', 'size', 'steps', 'notice'].forEach(section => {
      const toggle = this.container.querySelector(`#toggle-${section}`);
      if (toggle) {
        toggle.addEventListener('change', (e) => {
          this.slots.sectionToggles[section] = e.target.checked;
          this.updateSectionVisibility();
          this.updatePreview();
        });
      }
    });

    // 그리드 설정
    ['option', 'component', 'detail'].forEach(section => {
      const select = this.container.querySelector(`#grid-${section}`);
      if (select) {
        select.addEventListener('change', (e) => {
          this.slots.gridColumns[section] = parseInt(e.target.value);
          this.updatePreview();
        });
      }
    });

    // 텍스트 입력
    this.container.querySelector('#tpl-product-name').addEventListener('input', (e) => {
      this.slots.productName = e.target.value;
      this.updatePreview();
    });

    this.container.querySelector('#tpl-subtitle').addEventListener('input', (e) => {
      this.slots.subtitle = e.target.value;
      this.updatePreview();
    });

    // 대표 이미지 업로드
    const heroInput = this.container.querySelector('#hero-input');
    const heroPreview = this.container.querySelector('#hero-preview');

    heroInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.slots.heroImage = ev.target.result;
          heroPreview.innerHTML = `<img src="${ev.target.result}" alt="대표 이미지">`;
          heroPreview.classList.add('show');
          this.updatePreview();
        };
        reader.readAsDataURL(file);
      }
    });

    // Size 입력
    this.container.querySelector('#size-text').addEventListener('input', (e) => {
      this.slots.sizeInfo.text = e.target.value;
      this.updatePreview();
    });

    const sizeImageInput = this.container.querySelector('#size-image-input');
    const sizePreview = this.container.querySelector('#size-preview');

    sizeImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.slots.sizeInfo.image = ev.target.result;
          sizePreview.innerHTML = `<img src="${ev.target.result}" alt="사이즈">`;
          sizePreview.classList.add('show');
          this.updatePreview();
        };
        reader.readAsDataURL(file);
      }
    });

    // 구성품 공통 설명
    const componentDescInput = this.container.querySelector('#component-desc');
    if (componentDescInput) {
      componentDescInput.addEventListener('input', (e) => {
        this.slots.componentDesc = e.target.value;
        this.updatePreview();
      });
    }

    // 옵션 복수 이미지 업로드
    const optionBulkInput = this.container.querySelector('#option-bulk-input');
    if (optionBulkInput) {
      optionBulkInput.addEventListener('change', (e) => {
        this.handleBulkImageUpload(e.target.files, 'options');
        e.target.value = ''; // 같은 파일 다시 선택 가능하도록
      });
    }

    // 구성품 복수 이미지 업로드
    const componentBulkInput = this.container.querySelector('#component-bulk-input');
    if (componentBulkInput) {
      componentBulkInput.addEventListener('change', (e) => {
        this.handleBulkImageUpload(e.target.files, 'components');
        e.target.value = '';
      });
    }

    // 상세 이미지 복수 업로드
    const detailBulkInput = this.container.querySelector('#detail-bulk-input');
    if (detailBulkInput) {
      detailBulkInput.addEventListener('change', (e) => {
        this.handleBulkImageUpload(e.target.files, 'productImages');
        e.target.value = '';
      });
    }

    // 버튼 이벤트
    this.container.querySelector('#add-step').addEventListener('click', () => this.addStep());
    this.container.querySelector('#add-notice').addEventListener('click', () => this.addNotice());
    this.container.querySelector('#generate-page').addEventListener('click', () => this.updatePreview());
    this.container.querySelector('#download-html').addEventListener('click', () => this.downloadHTML());
    this.container.querySelector('#download-jpg').addEventListener('click', () => this.downloadJPG());

    // AI 버튼
    this.container.querySelector('#ai-components').addEventListener('click', () => this.aiGenerateComponents());
    this.container.querySelector('#ai-steps').addEventListener('click', () => this.aiGenerateSteps());

    // 편집 모드 이벤트
    this.container.querySelector('#toggle-edit-mode').addEventListener('click', () => this.toggleEditMode());
    this.container.querySelector('#close-edit-panel').addEventListener('click', () => this.toggleEditMode(false));

    // 색상 변경
    this.container.querySelector('#edit-color').addEventListener('input', (e) => this.updateSelectedColor(e.target.value));
    this.container.querySelectorAll('.color-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const color = e.target.getAttribute('data-color');
        this.container.querySelector('#edit-color').value = color;
        this.updateSelectedColor(color);
      });
    });

    // 폰트 변경
    this.container.querySelector('#edit-font').addEventListener('change', (e) => this.updateSelectedFont(e.target.value));

    // 폰트 크기 변경
    this.container.querySelector('#edit-font-size').addEventListener('input', (e) => {
      const size = e.target.value + 'px';
      this.container.querySelector('#font-size-value').textContent = size;
      this.updateSelectedFontSize(size);
    });

    // 위치 조정 버튼
    this.container.querySelectorAll('.pos-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dir = e.target.getAttribute('data-dir');
        this.moveSelectedElement(dir);
      });
    });

    // 텍스트 수정
    this.container.querySelector('#edit-text').addEventListener('input', (e) => {
      this.updateSelectedText(e.target.value);
    });

    // 저장/취소 버튼
    this.container.querySelector('#edit-save').addEventListener('click', () => this.saveEdits());
    this.container.querySelector('#edit-cancel').addEventListener('click', () => this.cancelEdits());

    // 초기 렌더링
    this.renderNotices();
    this.updateSectionVisibility();
  }

  updateSectionVisibility() {
    const sections = ['option', 'component', 'detail', 'size', 'steps', 'notice'];
    sections.forEach(section => {
      const group = this.container.querySelector(`.section-group[data-section="${section}"]`);
      if (group) {
        if (this.slots.sectionToggles[section]) {
          group.classList.remove('disabled');
        } else {
          group.classList.add('disabled');
        }
      }
    });
  }

  handleBulkImageUpload(files, targetSection) {
    if (!files || files.length === 0) return;

    const processFile = (file) => {
      return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    };

    // 모든 파일 처리
    Promise.all(Array.from(files).map(processFile)).then((results) => {
      const validImages = results.filter(r => r !== null);

      if (targetSection === 'options') {
        validImages.forEach(img => {
          this.slots.options.push({ image: img, name: '' });
        });
        this.renderOptions();
      } else if (targetSection === 'components') {
        validImages.forEach(img => {
          this.slots.components.push({ name: '', qty: '', icon: '📦', image: img });
        });
        this.renderComponents();
      } else if (targetSection === 'productImages') {
        validImages.forEach(img => {
          this.slots.productImages.push({ image: img, caption: '' });
        });
        this.renderProductImages();
      }

      this.updatePreview();
    });
  }

  addOption() {
    this.slots.options.push({ image: null, name: '' });
    this.renderOptions();
  }

  renderOptions() {
    const list = this.container.querySelector('#options-list');
    if (!list) return;

    list.innerHTML = this.slots.options.map((opt, index) => `
      <div class="item-card">
        <input type="file" accept="image/*" class="file-input" data-index="${index}" />
        ${opt.image ? `<div class="preview-box show"><img src="${opt.image}"></div>` : ''}
        <input type="text" placeholder="옵션 이름" value="${opt.name || ''}" data-index="${index}" class="option-name-input" />
        <button class="remove-btn" data-index="${index}">× 삭제</button>
      </div>
    `).join('');

    // 이벤트 바인딩
    list.querySelectorAll('input[type="file"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            this.slots.options[idx].image = ev.target.result;
            this.renderOptions();
            this.updatePreview();
          };
          reader.readAsDataURL(file);
        }
      });
    });

    list.querySelectorAll('.option-name-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.slots.options[idx].name = e.target.value;
        this.updatePreview();
      });
    });

    list.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        this.slots.options.splice(idx, 1);
        this.renderOptions();
        this.updatePreview();
      });
    });
  }

  addComponent() {
    this.slots.components.push({ name: '', qty: '', icon: '📦', image: null });
    this.renderComponents();
  }

  renderComponents() {
    const list = this.container.querySelector('#components-list');
    if (!list) return;

    list.innerHTML = this.slots.components.map((comp, index) => `
      <div class="item-card">
        <input type="file" accept="image/*" class="file-input" data-index="${index}" />
        ${comp.image ? `<div class="preview-box show"><img src="${comp.image}"></div>` : ''}
        <div class="item-row">
          <input type="text" placeholder="구성품 이름" value="${comp.name || ''}" data-field="name" data-index="${index}" />
          <input type="text" placeholder="수량" value="${comp.qty || ''}" data-field="qty" data-index="${index}" style="width: 70px;" />
        </div>
        <button class="remove-btn" data-index="${index}">× 삭제</button>
      </div>
    `).join('');

    // 이벤트 바인딩
    list.querySelectorAll('input[type="file"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            this.slots.components[idx].image = ev.target.result;
            this.renderComponents();
            this.updatePreview();
          };
          reader.readAsDataURL(file);
        }
      });
    });

    list.querySelectorAll('input[data-field]').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const field = e.target.dataset.field;
        this.slots.components[idx][field] = e.target.value;
        this.updatePreview();
      });
    });

    list.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        this.slots.components.splice(idx, 1);
        this.renderComponents();
        this.updatePreview();
      });
    });
  }

  addProductImage() {
    this.slots.productImages.push({ image: null, caption: '' });
    this.renderProductImages();
  }

  renderProductImages() {
    const list = this.container.querySelector('#product-images-list');
    if (!list) return;

    list.innerHTML = this.slots.productImages.map((item, index) => `
      <div class="item-card">
        <input type="file" accept="image/*" class="file-input" data-index="${index}" />
        ${item.image ? `<div class="preview-box show"><img src="${item.image}"></div>` : ''}
        <textarea placeholder="이미지 설명 (선택사항)" data-index="${index}">${item.caption || ''}</textarea>
        <button class="remove-btn" data-index="${index}">× 삭제</button>
      </div>
    `).join('');

    // 이벤트 바인딩
    list.querySelectorAll('input[type="file"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            this.slots.productImages[idx].image = ev.target.result;
            this.renderProductImages();
            this.updatePreview();
          };
          reader.readAsDataURL(file);
        }
      });
    });

    list.querySelectorAll('textarea').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.slots.productImages[idx].caption = e.target.value;
        this.updatePreview();
      });
    });

    list.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        this.slots.productImages.splice(idx, 1);
        this.renderProductImages();
        this.updatePreview();
      });
    });
  }

  addStep() {
    this.slots.steps.push({ title: '', description: '', image: null });
    this.renderSteps();
  }

  renderSteps() {
    const list = this.container.querySelector('#steps-list');
    if (!list) return;

    list.innerHTML = this.slots.steps.map((step, index) => `
      <div class="item-card">
        <div style="font-weight: 600; margin-bottom: 8px; color: #6B5CE7;">STEP ${index + 1}</div>
        <input type="file" accept="image/*" class="file-input" data-index="${index}" />
        ${step.image ? `<div class="preview-box show"><img src="${step.image}"></div>` : ''}
        <input type="text" placeholder="단계 제목" value="${step.title || ''}" data-field="title" data-index="${index}" />
        <textarea placeholder="상세 설명" data-index="${index}">${step.description || ''}</textarea>
        <button class="remove-btn" data-index="${index}">× 삭제</button>
      </div>
    `).join('');

    // 이벤트 바인딩
    list.querySelectorAll('input[type="file"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            this.slots.steps[idx].image = ev.target.result;
            this.renderSteps();
            this.updatePreview();
          };
          reader.readAsDataURL(file);
        }
      });
    });

    list.querySelectorAll('input[data-field="title"]').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.slots.steps[idx].title = e.target.value;
        this.updatePreview();
      });
    });

    list.querySelectorAll('textarea').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.slots.steps[idx].description = e.target.value;
        this.updatePreview();
      });
    });

    list.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        this.slots.steps.splice(idx, 1);
        this.renderSteps();
        this.updatePreview();
      });
    });
  }

  renderNotices() {
    const list = this.container.querySelector('#notices-list');
    if (!list) return;

    list.innerHTML = this.slots.notices.map((notice, index) => `
      <div class="item-card">
        <div class="item-row">
          <input type="text" value="${notice}" placeholder="유의사항" data-index="${index}" />
          <button class="remove-btn" data-index="${index}" style="margin-top: 0;">×</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('input[data-index]').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.slots.notices[idx] = e.target.value;
        this.updatePreview();
      });
    });

    list.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        this.slots.notices.splice(idx, 1);
        this.renderNotices();
        this.updatePreview();
      });
    });
  }

  addNotice() {
    this.slots.notices.push('');
    this.renderNotices();
  }

  async aiGenerateComponents() {
    if (!this.slots.productName) {
      showToast('먼저 제품명을 입력해주세요!', 'warning');
      return;
    }

    const btn = this.container.querySelector('#ai-components');
    btn.textContent = '생성 중...';

    try {
      const result = await generateComponents(this.slots.productName);
      this.slots.components = result.components.map(c => ({
        name: c.name,
        qty: c.qty,
        icon: c.icon || '📦',
        image: null
      }));
      this.renderComponents();
      this.updatePreview();
      showToast(`${result.components.length}개 구성품이 추천되었습니다.`, 'success');
    } catch (error) {
      console.error('AI 구성품 생성 실패:', error);
      showToast('AI 추천 실패. Ollama가 실행 중인지 확인하거나 수동으로 입력해주세요.', 'error');
    }

    btn.textContent = '🤖 AI 추천';
  }

  async aiGenerateSteps() {
    if (!this.slots.productName) {
      showToast('먼저 제품명을 입력해주세요!', 'warning');
      return;
    }

    const btn = this.container.querySelector('#ai-steps');
    btn.textContent = '생성 중...';

    try {
      const result = await generateSteps(this.slots.productName);
      this.slots.steps = result.steps.map(s => ({
        title: s.title,
        description: s.description,
        image: null
      }));
      this.renderSteps();
      this.updatePreview();
      showToast(`${result.steps.length}개 단계가 추천되었습니다.`, 'success');
    } catch (error) {
      console.error('AI 단계 생성 실패:', error);
      showToast('AI 추천 실패. Ollama가 실행 중인지 확인하거나 수동으로 입력해주세요.', 'error');
    }

    btn.textContent = '🤖 AI 추천';
  }

  updatePreview() {
    const frame = this.container.querySelector('#preview-frame');
    const html = generateDetailPage(this.slots);

    const iframe = document.createElement('iframe');
    frame.innerHTML = '';
    frame.appendChild(iframe);

    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();

    // 변경사항 자동 저장
    this.saveToStorage();
  }

  downloadHTML() {
    const html = generateDetailPage(this.slots);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.slots.productName || 'detail-page'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async downloadJPG() {
    const btn = this.container.querySelector('#download-jpg');
    const originalText = btn.textContent;
    btn.textContent = '생성 중...';
    btn.disabled = true;

    try {
      // html-to-image 동적 로드 (CORS 처리 개선)
      if (!window.htmlToImage) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';
        document.head.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      // 미리보기 iframe에서 콘텐츠 추출
      const previewFrame = this.container.querySelector('#preview-frame iframe');
      if (!previewFrame || !previewFrame.contentDocument) {
        throw new Error('Preview not ready');
      }

      const detailPage = previewFrame.contentDocument.querySelector('.detail-page');
      if (!detailPage) {
        throw new Error('Detail page not found');
      }

      // 콘텐츠를 메인 문서로 복사 (CORS 우회)
      const cloneContainer = document.createElement('div');
      cloneContainer.style.cssText = 'position:fixed;left:-9999px;top:0;width:860px;background:#fff;z-index:-1;';
      document.body.appendChild(cloneContainer);

      // iframe의 모든 스타일 복사
      const iframeDoc = previewFrame.contentDocument;
      const iframeStyles = iframeDoc.querySelectorAll('style');
      iframeStyles.forEach(style => {
        const clonedStyle = style.cloneNode(true);
        cloneContainer.appendChild(clonedStyle);
      });

      // 로컬 폰트를 base64로 로드하여 인라인 삽입 (CORS 문제 완전 해결)
      btn.textContent = '폰트 로딩...';

      const loadFontAsBase64 = async (url) => {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      };

      try {
        // 로컬 폰트 경로 (public 폴더)
        const notoRegularUrl = '/fonts/NotoSansKR-Regular.woff2';
        const pacificoUrl = '/fonts/Pacifico-Regular.woff2';

        const [notoRegularBase64, pacificoBase64] = await Promise.all([
          loadFontAsBase64(notoRegularUrl),
          loadFontAsBase64(pacificoUrl)
        ]);

        // fontEmbedCSS 생성 (html-to-image가 SVG에 직접 삽입)
        this.fontEmbedCSS = `
          @font-face {
            font-family: 'Noto Sans KR';
            font-weight: 400;
            font-style: normal;
            src: url(data:font/woff2;base64,${notoRegularBase64}) format('woff2');
          }
          @font-face {
            font-family: 'Pacifico';
            font-weight: 400;
            font-style: normal;
            src: url(data:font/woff2;base64,${pacificoBase64}) format('woff2');
          }
        `;
      } catch (fontError) {
        console.warn('폰트 base64 로드 실패:', fontError);
        this.fontEmbedCSS = '';
      }

      // detail-page 복사
      const clone = detailPage.cloneNode(true);
      cloneContainer.appendChild(clone);

      // 폰트 렌더링 대기
      btn.textContent = '렌더링...';
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 1500));

      // html-to-image로 캡처 (fontEmbedCSS로 폰트 직접 임베딩)
      const scale = 2;
      const dataUrl = await window.htmlToImage.toJpeg(clone, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: scale,
        skipFonts: false, // 폰트 처리 활성화!
        fontEmbedCSS: this.fontEmbedCSS, // base64 폰트 직접 전달
        cacheBust: true
      });

      // 다운로드
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${this.slots.productName || 'detail-page'}_고화질.jpg`;
      a.click();

      // 정리
      document.body.removeChild(cloneContainer);
      showToast('JPG 고화질 이미지가 다운로드되었습니다.', 'success');

    } catch (error) {
      console.error('JPG 생성 실패:', error);
      showToast('JPG 생성에 실패했습니다. 다시 시도해주세요.', 'error');
    }

    btn.textContent = originalText;
    btn.disabled = false;
  }

  // ===== 편집 모드 =====

  toggleEditMode(forceState) {
    const btn = this.container.querySelector('#toggle-edit-mode');
    const panel = this.container.querySelector('#edit-panel');

    if (typeof forceState === 'boolean') {
      this.editMode = forceState;
    } else {
      this.editMode = !this.editMode;
    }

    if (this.editMode) {
      btn.classList.add('active');
      panel.style.display = 'block';

      // 원본 저장 (취소 시 복원용)
      const previewFrame = this.container.querySelector('#preview-frame iframe');
      if (previewFrame && previewFrame.contentDocument) {
        const detailPage = previewFrame.contentDocument.querySelector('.detail-page');
        if (detailPage) {
          this.originalContent = detailPage.innerHTML;
        }
      }

      this.enableEditableElements();
    } else {
      btn.classList.remove('active');
      panel.style.display = 'none';
      this.disableEditableElements();
      this.selectedElement = null;
    }
  }

  enableEditableElements() {
    const previewFrame = this.container.querySelector('#preview-frame iframe');
    if (!previewFrame || !previewFrame.contentDocument) return;

    const iframeDoc = previewFrame.contentDocument;
    const textElements = iframeDoc.querySelectorAll('h1, h2, h3, h4, p, span, .section-title, .section-title-script, .hero-title, .hero-subtitle');

    textElements.forEach((el, index) => {
      el.setAttribute('data-edit-id', `edit-${index}`);
      el.style.cursor = 'pointer';
      el.style.transition = 'outline 0.2s, background 0.2s';

      el.addEventListener('mouseenter', this.handleElementHover);
      el.addEventListener('mouseleave', this.handleElementLeave);
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectElement(el);
      });
    });
  }

  handleElementHover = (e) => {
    if (e.target !== this.selectedElement) {
      e.target.style.outline = '2px dashed #6366f1';
      e.target.style.outlineOffset = '2px';
    }
  }

  handleElementLeave = (e) => {
    if (e.target !== this.selectedElement) {
      e.target.style.outline = 'none';
    }
  }

  disableEditableElements() {
    const previewFrame = this.container.querySelector('#preview-frame iframe');
    if (!previewFrame || !previewFrame.contentDocument) return;

    const iframeDoc = previewFrame.contentDocument;
    const textElements = iframeDoc.querySelectorAll('[data-edit-id]');

    textElements.forEach(el => {
      el.style.cursor = '';
      el.style.outline = 'none';
      el.removeEventListener('mouseenter', this.handleElementHover);
      el.removeEventListener('mouseleave', this.handleElementLeave);
    });
  }

  selectElement(el) {
    // 이전 선택 해제
    if (this.selectedElement) {
      this.selectedElement.style.outline = 'none';
      this.selectedElement.style.background = '';
    }

    this.selectedElement = el;
    el.style.outline = '3px solid #6366f1';
    el.style.outlineOffset = '2px';

    // 현재 스타일 읽어서 패널에 반영
    const computedStyle = window.getComputedStyle(el);
    const colorInput = this.container.querySelector('#edit-color');
    const fontSelect = this.container.querySelector('#edit-font');
    const sizeInput = this.container.querySelector('#edit-font-size');
    const sizeValue = this.container.querySelector('#font-size-value');

    // 색상 (rgb를 hex로 변환)
    const rgb = computedStyle.color.match(/\d+/g);
    if (rgb) {
      const hex = '#' + rgb.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
      colorInput.value = hex;
    }

    // 폰트 크기
    const fontSize = parseInt(computedStyle.fontSize);
    sizeInput.value = fontSize;
    sizeValue.textContent = fontSize + 'px';

    // 텍스트 내용 반영
    const textArea = this.container.querySelector('#edit-text');
    textArea.value = el.textContent || '';

    // 드래그 활성화
    this.enableDrag(el);
  }

  updateSelectedColor(color) {
    if (!this.selectedElement) return;
    this.selectedElement.style.color = color;
  }

  updateSelectedFont(font) {
    if (!this.selectedElement) return;
    this.selectedElement.style.fontFamily = font;
  }

  updateSelectedFontSize(size) {
    if (!this.selectedElement) return;
    this.selectedElement.style.fontSize = size;
  }

  moveSelectedElement(direction) {
    if (!this.selectedElement) return;

    // position relative로 설정
    if (!this.selectedElement.style.position) {
      this.selectedElement.style.position = 'relative';
    }

    const step = 5; // px
    let left = parseInt(this.selectedElement.style.left) || 0;
    let top = parseInt(this.selectedElement.style.top) || 0;

    switch (direction) {
      case 'up': top -= step; break;
      case 'down': top += step; break;
      case 'left': left -= step; break;
      case 'right': left += step; break;
      case 'reset': left = 0; top = 0; break;
    }

    this.selectedElement.style.left = left + 'px';
    this.selectedElement.style.top = top + 'px';
  }

  enableDrag(el) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    const onMouseDown = (e) => {
      if (e.button !== 0) return; // 좌클릭만
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      if (!el.style.position) {
        el.style.position = 'relative';
      }
      startLeft = parseInt(el.style.left) || 0;
      startTop = parseInt(el.style.top) || 0;

      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      el.style.left = (startLeft + dx) + 'px';
      el.style.top = (startTop + dy) + 'px';
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    el.addEventListener('mousedown', onMouseDown);
    el.ownerDocument.addEventListener('mousemove', onMouseMove);
    el.ownerDocument.addEventListener('mouseup', onMouseUp);
  }

  updateSelectedText(text) {
    if (!this.selectedElement) return;
    this.selectedElement.textContent = text;
  }

  saveEdits() {
    // 현재 상태를 저장 (원본 백업 클리어)
    this.originalContent = null;
    this.toggleEditMode(false);
    showToast('✓ 편집 내용이 저장되었습니다!', 'success');
  }

  cancelEdits() {
    // 원본으로 복원
    if (this.originalContent) {
      const previewFrame = this.container.querySelector('#preview-frame iframe');
      if (previewFrame && previewFrame.contentDocument) {
        const detailPage = previewFrame.contentDocument.querySelector('.detail-page');
        if (detailPage) {
          detailPage.innerHTML = this.originalContent;
        }
      }
    }
    this.toggleEditMode(false);
  }
}

export default TemplatePageGenerator;
