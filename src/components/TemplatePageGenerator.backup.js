/**
 * 템플릿 기반 상세페이지 생성기 V3
 * 풍성한 디자인 + 빈 섹션 자동 숨김
 */

import { generateDetailPage, getEmptyTemplate, themes } from '../templates/detailPageTemplate.js';
import { checkOllamaStatus, generateComponents, generateSteps } from '../utils/ollamaClient.js';

class TemplatePageGenerator {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.slots = {
      productName: '',
      subtitle: '',
      heroImage: null,
      productImages: [], // [{image: dataUrl, caption: '설명텍스트'}]
      components: [],
      steps: [],
      features: [],
      notices: [
        '제품 색상은 모니터에 따라 다르게 보일 수 있습니다.',
        '수공예 제품 특성상 약간의 개별 차이가 있을 수 있습니다.'
      ],
      primaryColor: '#6B5CE7',
      secondaryColor: '#FF6B9D'
    };
    this.selectedTheme = 'purple';
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.updatePreview();
  }

  render() {
    this.container.innerHTML = `
      <div class="template-generator">
        <!-- 좌측: 입력 폼 -->
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

          <!-- 기본 정보 -->
          <div class="form-group">
            <label>📦 제품명 *</label>
            <input type="text" id="tpl-product-name" placeholder="예: EVA 할로윈 거미줄 모빌 만들기" />
          </div>

          <div class="form-group">
            <label>💬 부제목</label>
            <input type="text" id="tpl-subtitle" placeholder="예: 아이들과 함께 만드는 할로윈 데코" />
          </div>

          <!-- 히어로 이미지 -->
          <div class="form-group">
            <label>🖼️ 대표 이미지</label>
            <label class="image-drop-zone hero-zone" id="hero-drop-zone" data-slot="heroImage">
              <div class="drop-content">
                <span class="drop-icon">📷</span>
                <span class="drop-text">클릭하거나 드래그</span>
              </div>
              <input type="file" accept="image/*" hidden />
            </label>
          </div>

          <!-- 제품 이미지들 -->
          <div class="form-group">
            <label>📸 제품 상세 이미지</label>
            <p class="form-hint">이미지와 함께 설명을 추가할 수 있습니다</p>
            <div id="product-images-list"></div>
            <button class="add-btn" id="add-product-image">
              <span>+</span> 이미지 추가
            </button>
          </div>

          <!-- 구성품 -->
          <div class="form-group">
            <div class="section-header-row">
              <label>📋 구성품</label>
              <button class="ai-btn" id="ai-components" title="AI가 구성품을 추천합니다">
                🤖 AI 추천
              </button>
            </div>
            <div id="components-list"></div>
            <button class="add-btn" id="add-component">
              <span>+</span> 구성품 추가
            </button>
          </div>

          <!-- 만들기 순서 -->
          <div class="form-group">
            <div class="section-header-row">
              <label>🔢 만들기 순서</label>
              <button class="ai-btn" id="ai-steps" title="AI가 만들기 순서를 추천합니다">
                🤖 AI 추천
              </button>
            </div>
            <div id="steps-list"></div>
            <button class="add-btn" id="add-step">
              <span>+</span> 단계 추가
            </button>
          </div>

          <!-- 구매시 유의사항 -->
          <div class="form-group">
            <label>⚠️ 구매시 유의사항</label>
            <div id="notices-list"></div>
            <button class="add-btn" id="add-notice">
              <span>+</span> 유의사항 추가
            </button>
          </div>

          <!-- 액션 버튼 -->
          <div class="action-buttons">
            <button class="primary-btn" id="generate-page">
              🚀 상세페이지 생성
            </button>
            <button class="secondary-btn" id="download-html">
              📥 다운로드
            </button>
          </div>
        </div>

        <!-- 우측: 미리보기 -->
        <div class="preview-panel">
          <div class="preview-header">
            <h2>👁️ 실시간 미리보기</h2>
            <span class="preview-size">860px</span>
          </div>
          <div class="preview-scroll">
            <div class="preview-frame" id="preview-frame"></div>
          </div>
        </div>
      </div>

      <style>
        .template-generator {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 0;
          min-height: 100vh;
          background: #f5f5f5;
        }

        .input-panel {
          background: white;
          padding: 28px;
          overflow-y: auto;
          max-height: 100vh;
          border-right: 1px solid #e8e8e8;
        }

        .input-panel h2 {
          font-size: 18px;
          margin-bottom: 24px;
          color: #333;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 10px;
          color: #444;
          font-size: 14px;
        }

        .form-group input[type="text"],
        .form-group textarea {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e8e8e8;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.2s;
          background: #fafafa;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          border-color: #6B5CE7;
          outline: none;
          background: white;
          box-shadow: 0 0 0 4px rgba(107, 92, 231, 0.1);
        }

        .theme-selector {
          display: flex;
          gap: 10px;
        }

        .theme-btn {
          width: 44px;
          height: 44px;
          border: 3px solid transparent;
          border-radius: 12px;
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

        .image-drop-zone {
          border: 2px dashed #d0d0d0;
          border-radius: 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #fafafa;
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
        }

        .image-drop-zone:hover {
          border-color: #6B5CE7;
          background-color: #f5f0ff;
        }

        .image-drop-zone.filled {
          border-style: solid;
          border-color: #6B5CE7;
        }

        .image-drop-zone.filled .drop-content,
        .image-drop-zone.filled span {
          display: none;
        }

        .hero-zone {
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .drop-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #999;
        }

        .drop-icon {
          font-size: 32px;
          opacity: 0.6;
        }

        .drop-text {
          font-size: 13px;
        }

        .images-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }

        .images-grid .image-drop-zone {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: #bbb;
        }

        .add-btn {
          width: 100%;
          padding: 14px;
          border: 2px dashed #d0d0d0;
          background: transparent;
          border-radius: 12px;
          cursor: pointer;
          color: #888;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .add-btn:hover {
          border-color: #6B5CE7;
          color: #6B5CE7;
          background: #f5f0ff;
        }

        .add-btn span {
          font-size: 18px;
          font-weight: bold;
        }

        .form-hint {
          font-size: 12px;
          color: #888;
          margin-bottom: 10px;
        }

        .image-card {
          background: #f8f8f8;
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 12px;
        }

        .image-card-top {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .image-card .image-upload-zone {
          width: 100px;
          height: 100px;
          border: 2px dashed #d0d0d0;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background-size: cover;
          background-position: center;
          flex-shrink: 0;
          font-size: 24px;
          color: #bbb;
        }

        .image-card .image-upload-zone.filled {
          border-style: solid;
          border-color: #6B5CE7;
        }

        .image-card .image-upload-zone.filled span {
          display: none;
        }

        .image-card-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .image-card-content textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          resize: vertical;
          min-height: 60px;
          font-family: inherit;
        }

        .image-card-content textarea:focus {
          border-color: #6B5CE7;
          outline: none;
        }

        .image-card-actions {
          display: flex;
          justify-content: flex-end;
        }

        .item-row {
          background: #f8f8f8;
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 10px;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .item-row select {
          width: 52px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 18px;
          text-align: center;
          cursor: pointer;
        }

        .item-row input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }

        .item-row input:focus {
          border-color: #6B5CE7;
          outline: none;
        }

        .remove-btn {
          background: #ff6b6b;
          color: white;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .remove-btn:hover {
          background: #e55555;
          transform: scale(1.1);
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .primary-btn {
          flex: 1;
          padding: 16px;
          background: linear-gradient(135deg, #6B5CE7, #FF6B9D);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(107, 92, 231, 0.3);
        }

        .secondary-btn {
          padding: 16px 24px;
          background: white;
          color: #6B5CE7;
          border: 2px solid #6B5CE7;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .secondary-btn:hover {
          background: #f5f0ff;
        }

        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .section-header-row label {
          margin-bottom: 0;
        }

        .ai-btn {
          background: linear-gradient(135deg, #10b981, #3b82f6);
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .ai-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .ai-btn.loading {
          opacity: 0.7;
          pointer-events: none;
        }

        .ai-btn.loading::after {
          content: '';
          width: 12px;
          height: 12px;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-left: 6px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .preview-panel {
          background: #e8e8e8;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .preview-header {
          background: white;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #ddd;
        }

        .preview-header h2 {
          font-size: 16px;
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

        .preview-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
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

    // 텍스트 입력
    this.container.querySelector('#tpl-product-name').addEventListener('input', (e) => {
      this.slots.productName = e.target.value;
      this.updatePreview();
    });

    this.container.querySelector('#tpl-subtitle').addEventListener('input', (e) => {
      this.slots.subtitle = e.target.value;
      this.updatePreview();
    });

    // 이미지 드롭존
    this.bindImageDropZones();

    // 구성품 추가
    this.container.querySelector('#add-component').addEventListener('click', () => {
      this.addComponent();
    });

    // 단계 추가
    this.container.querySelector('#add-step').addEventListener('click', () => {
      this.addStep();
    });

    // 생성 버튼
    this.container.querySelector('#generate-page').addEventListener('click', () => {
      this.updatePreview();
    });

    // 다운로드 버튼
    this.container.querySelector('#download-html').addEventListener('click', () => {
      this.downloadHTML();
    });

    // AI 구성품 추천 버튼
    this.container.querySelector('#ai-components').addEventListener('click', async () => {
      await this.aiGenerateComponents();
    });

    // AI 단계 추천 버튼
    this.container.querySelector('#ai-steps').addEventListener('click', async () => {
      await this.aiGenerateSteps();
    });

    // 유의사항 추가
    this.container.querySelector('#add-notice').addEventListener('click', () => {
      this.addNotice();
    });

    // 기존 유의사항 렌더링
    this.renderNotices();

    // 제품 이미지 추가
    this.container.querySelector('#add-product-image').addEventListener('click', () => {
      this.addProductImage();
    });

    // 제품 이미지 렌더링
    this.renderProductImages();
  }

  async aiGenerateComponents() {
    const productName = this.slots.productName;
    if (!productName) {
      alert('먼저 제품명을 입력해주세요!');
      return;
    }

    const btn = this.container.querySelector('#ai-components');
    btn.classList.add('loading');
    btn.textContent = '생성 중...';

    try {
      const result = await generateComponents(productName);

      // 기존 구성품 삭제
      this.slots.components = [];
      this.container.querySelector('#components-list').innerHTML = '';

      // AI 결과 추가
      for (const comp of result.components) {
        this.addComponentWithData(comp);
      }

      if (!result.success) {
        console.warn('AI 응답 파싱 실패, 기본값 사용:', result.error);
      }
    } catch (error) {
      console.error('AI 구성품 생성 실패:', error);
      alert('AI 서버에 연결할 수 없습니다.\nOllama가 실행 중인지 확인해주세요.');
    } finally {
      btn.classList.remove('loading');
      btn.textContent = '🤖 AI 추천';
    }
  }

  async aiGenerateSteps() {
    const productName = this.slots.productName;
    if (!productName) {
      alert('먼저 제품명을 입력해주세요!');
      return;
    }

    const btn = this.container.querySelector('#ai-steps');
    btn.classList.add('loading');
    btn.textContent = '생성 중...';

    try {
      const result = await generateSteps(productName);

      // 기존 단계 삭제
      this.slots.steps = [];
      this.container.querySelector('#steps-list').innerHTML = '';

      // AI 결과 추가
      for (const step of result.steps) {
        this.addStepWithData(step);
      }

      if (!result.success) {
        console.warn('AI 응답 파싱 실패, 기본값 사용:', result.error);
      }
    } catch (error) {
      console.error('AI 단계 생성 실패:', error);
      alert('AI 서버에 연결할 수 없습니다.\nOllama가 실행 중인지 확인해주세요.');
    } finally {
      btn.classList.remove('loading');
      btn.textContent = '🤖 AI 추천';
    }
  }

  addComponentWithData(data) {
    this.addComponent();
    const list = this.container.querySelector('#components-list');
    const lastItem = list.lastElementChild;

    if (lastItem) {
      const iconSelect = lastItem.querySelector('.comp-icon');
      const nameInput = lastItem.querySelector('.comp-name');
      const qtyInput = lastItem.querySelector('.comp-qty');

      if (iconSelect) iconSelect.value = data.icon || '📦';
      if (nameInput) nameInput.value = data.name || '';
      if (qtyInput) qtyInput.value = data.qty || '';

      // 슬롯 업데이트
      const index = this.slots.components.length - 1;
      this.slots.components[index] = {
        icon: data.icon || '📦',
        name: data.name || '',
        qty: data.qty || ''
      };
    }
    this.updatePreview();
  }

  addStepWithData(data) {
    this.addStep();
    const list = this.container.querySelector('#steps-list');
    const lastItem = list.lastElementChild;

    if (lastItem) {
      const titleInput = lastItem.querySelector('.step-title');
      const descInput = lastItem.querySelector('.step-desc');

      if (titleInput) titleInput.value = data.title || '';
      if (descInput) descInput.value = data.description || '';

      // 슬롯 업데이트
      const index = this.slots.steps.length - 1;
      this.slots.steps[index] = {
        title: data.title || '',
        description: data.description || '',
        image: null
      };
    }
    this.updatePreview();
  }

  bindImageDropZones() {
    // 대표 이미지(hero-zone)만 처리 - 제품 이미지는 renderProductImages에서 별도 처리
    const heroZone = this.container.querySelector('.hero-zone');
    if (!heroZone) return;

    const input = heroZone.querySelector('input[type="file"]');

    // label 태그 사용으로 클릭 이벤트 핸들러 불필요

    heroZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      heroZone.style.borderColor = '#6B5CE7';
      heroZone.style.background = '#f5f0ff';
    });

    heroZone.addEventListener('dragleave', () => {
      heroZone.style.borderColor = '';
      heroZone.style.background = '';
    });

    heroZone.addEventListener('drop', (e) => {
      e.preventDefault();
      heroZone.style.borderColor = '';
      heroZone.style.background = '';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this.handleImageUpload(file, heroZone);
      }
    });

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleImageUpload(file, heroZone);
      }
    });
  }

  handleImageUpload(file, zone) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      zone.style.backgroundImage = `url(${base64})`;
      zone.classList.add('filled');

      const slot = zone.dataset.slot;
      const index = zone.dataset.index;

      if (slot === 'heroImage') {
        this.slots.heroImage = base64;
      } else if (slot === 'productImages') {
        this.slots.productImages[parseInt(index)] = base64;
      }

      this.updatePreview();
    };
    reader.readAsDataURL(file);
  }

  addComponent() {
    const list = this.container.querySelector('#components-list');
    const index = this.slots.components.length;

    const item = document.createElement('div');
    item.className = 'item-row';
    item.innerHTML = `
      <select class="comp-icon">
        <option>📦</option>
        <option>🎨</option>
        <option>✂️</option>
        <option>🧵</option>
        <option>📐</option>
        <option>🖌️</option>
        <option>💎</option>
        <option>🪡</option>
        <option>🎀</option>
        <option>⭐</option>
      </select>
      <input type="text" placeholder="구성품 이름" class="comp-name" />
      <input type="text" placeholder="수량" class="comp-qty" style="width: 70px;" />
      <button class="remove-btn">×</button>
    `;

    const updateComponent = () => {
      this.slots.components[index] = {
        icon: item.querySelector('.comp-icon').value,
        name: item.querySelector('.comp-name').value,
        qty: item.querySelector('.comp-qty').value
      };
      this.updatePreview();
    };

    item.querySelector('.comp-icon').addEventListener('change', updateComponent);
    item.querySelector('.comp-name').addEventListener('input', updateComponent);
    item.querySelector('.comp-qty').addEventListener('input', updateComponent);

    item.querySelector('.remove-btn').addEventListener('click', () => {
      this.slots.components.splice(index, 1);
      item.remove();
      this.updatePreview();
    });

    this.slots.components.push({ icon: '📦', name: '', qty: '' });
    list.appendChild(item);
  }

  addStep() {
    const list = this.container.querySelector('#steps-list');
    const index = this.slots.steps.length;

    const item = document.createElement('div');
    item.className = 'step-item-card';
    item.innerHTML = `
      <div class="step-header">
        <span class="step-badge">STEP ${index + 1}</span>
        <input type="text" placeholder="단계 제목 (예: 재료 준비하기)" class="step-title" />
        <button class="remove-btn">×</button>
      </div>
      <div class="step-body">
        <label class="step-image-upload" data-step-index="${index}">
          <div class="step-img-placeholder">
            <span>📷</span>
            <span>이미지 추가</span>
          </div>
          <input type="file" accept="image/*" hidden />
        </label>
        <textarea placeholder="상세 설명을 입력하세요..." class="step-desc"></textarea>
      </div>
    `;

    // 스타일 추가 (한 번만)
    if (!document.getElementById('step-card-styles')) {
      const style = document.createElement('style');
      style.id = 'step-card-styles';
      style.textContent = `
        .step-item-card {
          background: #f8f9fa;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          border: 2px solid #e8e8e8;
          transition: all 0.2s;
        }
        .step-item-card:hover {
          border-color: #6B5CE7;
        }
        .step-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .step-badge {
          background: linear-gradient(135deg, #6B5CE7, #FF6B9D);
          color: white;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }
        .step-header input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }
        .step-body {
          display: flex;
          gap: 12px;
        }
        .step-image-upload {
          width: 120px;
          height: 100px;
          border: 2px dashed #ccc;
          border-radius: 12px;
          cursor: pointer;
          background: #fff;
          background-size: cover;
          background-position: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .step-image-upload:hover {
          border-color: #6B5CE7;
          background-color: #f5f0ff;
        }
        .step-image-upload.filled {
          border-style: solid;
          border-color: #6B5CE7;
        }
        .step-image-upload.filled .step-img-placeholder {
          display: none;
        }
        .step-img-placeholder {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #aaa;
          font-size: 12px;
          gap: 4px;
        }
        .step-img-placeholder span:first-child {
          font-size: 24px;
        }
        .step-body textarea {
          flex: 1;
          min-height: 80px;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 10px;
          resize: vertical;
          font-size: 14px;
          font-family: inherit;
        }
        .step-body textarea:focus {
          border-color: #6B5CE7;
          outline: none;
        }
      `;
      document.head.appendChild(style);
    }

    const updateStep = () => {
      this.slots.steps[index] = {
        title: item.querySelector('.step-title').value,
        description: item.querySelector('.step-desc').value,
        image: this.slots.steps[index]?.image || null
      };
      this.updatePreview();
    };

    // 텍스트 입력 이벤트
    item.querySelector('.step-title').addEventListener('input', updateStep);
    item.querySelector('.step-desc').addEventListener('input', updateStep);

    // 이미지 업로드 이벤트
    const imgZone = item.querySelector('.step-image-upload');
    const imgInput = imgZone.querySelector('input[type="file"]');

    // label 태그 사용으로 클릭 이벤트 핸들러 불필요

    imgZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      imgZone.style.borderColor = '#6B5CE7';
      imgZone.style.background = '#f5f0ff';
    });

    imgZone.addEventListener('dragleave', () => {
      imgZone.style.borderColor = '';
      imgZone.style.background = '';
    });

    imgZone.addEventListener('drop', (e) => {
      e.preventDefault();
      imgZone.style.borderColor = '';
      imgZone.style.background = '';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this.handleStepImageUpload(file, imgZone, index);
      }
    });

    imgInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleStepImageUpload(file, imgZone, index);
      }
    });

    // 삭제 버튼
    item.querySelector('.remove-btn').addEventListener('click', () => {
      this.slots.steps.splice(index, 1);
      item.remove();
      // 번호 재정렬
      list.querySelectorAll('.step-badge').forEach((badge, i) => {
        badge.textContent = `STEP ${i + 1}`;
      });
      this.updatePreview();
    });

    this.slots.steps.push({ title: '', description: '', image: null });
    list.appendChild(item);
  }

  handleStepImageUpload(file, zone, stepIndex) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      zone.style.backgroundImage = `url(${base64})`;
      zone.classList.add('filled');

      if (this.slots.steps[stepIndex]) {
        this.slots.steps[stepIndex].image = base64;
      }
      this.updatePreview();
    };
    reader.readAsDataURL(file);
  }

  updatePreview() {
    const previewFrame = this.container.querySelector('#preview-frame');
    const html = generateDetailPage({
      ...this.slots,
      productImages: this.slots.productImages.filter(Boolean),
      components: this.slots.components.filter(c => c.name),
      steps: this.slots.steps.filter(s => s.title)
    });

    const iframe = document.createElement('iframe');
    previewFrame.innerHTML = '';
    previewFrame.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // 높이 자동 조절
    iframe.onload = () => {
      try {
        iframe.style.height = iframeDoc.body.scrollHeight + 'px';
      } catch (e) { }
    };
  }

  downloadHTML() {
    const html = generateDetailPage({
      ...this.slots,
      productImages: this.slots.productImages.filter(Boolean),
      components: this.slots.components.filter(c => c.name),
      steps: this.slots.steps.filter(s => s.title)
    });

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.slots.productName || '상세페이지'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  renderNotices() {
    const list = this.container.querySelector('#notices-list');
    if (!list) return;

    list.innerHTML = this.slots.notices.map((notice, index) => `
      <div class="item-row notice-row" data-index="${index}">
        <input type="text" value="${notice}" placeholder="유의사항 입력" class="notice-text" />
        <button class="remove-btn">×</button>
      </div>
    `).join('');

    // 이벤트 바인딩
    list.querySelectorAll('.notice-row').forEach((row, index) => {
      row.querySelector('.notice-text').addEventListener('input', (e) => {
        this.slots.notices[index] = e.target.value;
        this.updatePreview();
      });

      row.querySelector('.remove-btn').addEventListener('click', () => {
        this.slots.notices.splice(index, 1);
        this.renderNotices();
        this.updatePreview();
      });
    });
  }

  addNotice() {
    this.slots.notices.push('');
    this.renderNotices();

    // 마지막 입력 필드에 포커스
    const list = this.container.querySelector('#notices-list');
    const lastInput = list.querySelector('.notice-row:last-child .notice-text');
    if (lastInput) lastInput.focus();
  }

  renderProductImages() {
    const list = this.container.querySelector('#product-images-list');
    if (!list) return;

    list.innerHTML = this.slots.productImages.map((item, index) => `
      <div class="image-card" data-index="${index}">
        <div class="image-card-top">
          <label class="image-upload-zone product-img-zone ${item.image ? 'filled' : ''}" 
               style="${item.image ? `background-image: url(${item.image})` : ''}">
            <span>+</span>
            <input type="file" accept="image/*" hidden />
          </label>
          <div class="image-card-content">
            <textarea placeholder="이미지 아래에 표시될 설명을 입력하세요 (선택사항)" class="image-caption">${item.caption || ''}</textarea>
            <div class="image-card-actions">
              <button class="remove-btn">×</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // 이벤트 바인딩
    list.querySelectorAll('.image-card').forEach((card, index) => {
      const uploadZone = card.querySelector('.product-img-zone');
      const fileInput = card.querySelector('input[type="file"]');
      const captionInput = card.querySelector('.image-caption');
      const removeBtn = card.querySelector('.remove-btn');

      // label 태그 사용으로 클릭 이벤트 핸들러 불필요

      // 드래그 앤 드롭
      uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '#6B5CE7';
        uploadZone.style.background = '#f5f0ff';
      });

      uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = '';
        uploadZone.style.background = '';
      });

      uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '';
        uploadZone.style.background = '';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
          this.handleProductImageUpload(file, index);
        }
      });

      // 파일 선택 후 처리
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.handleProductImageUpload(file, index);
        }
      });

      // 설명 텍스트
      captionInput.addEventListener('input', (e) => {
        this.slots.productImages[index].caption = e.target.value;
        this.updatePreview();
      });

      // 삭제
      removeBtn.addEventListener('click', () => {
        this.slots.productImages.splice(index, 1);
        this.renderProductImages();
        this.updatePreview();
      });
    });
  }

  handleProductImageUpload(file, index) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.slots.productImages[index].image = e.target.result;
      this.renderProductImages();
      this.updatePreview();
    };
    reader.readAsDataURL(file);
  }

  addProductImage() {
    this.slots.productImages.push({ image: null, caption: '' });
    this.renderProductImages();
  }
}

export default TemplatePageGenerator;
