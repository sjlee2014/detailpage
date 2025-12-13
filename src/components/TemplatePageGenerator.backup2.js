/**
 * 템플릿 기반 상세페이지 생성기 - 최종 버전
 * 이미지 업로드: 가장 간단하고 확실한 방법 (버튼 + input.click())
 */

import { generateDetailPage, themes } from '../templates/detailPageTemplate.js';
import { generateComponents, generateSteps } from '../utils/ollamaClient.js';

class TemplatePageGenerator {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.slots = {
      productName: '',
      subtitle: '',
      heroImage: null,
      productImages: [],
      components: [],
      steps: [],
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

          <!-- 대표 이미지 -->
          <div class="form-group">
            <label>🖼️ 대표 이미지</label>
            <div class="upload-btn" id="hero-upload-btn" style="position: relative;">
              <div class="upload-content">
                <span class="upload-icon">📷</span>
                <span class="upload-text">클릭하여 이미지 선택</span>
              </div>
              <input type="file" id="hero-input" accept="image/*" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;" />
            </div>
          </div>

          <!-- 제품 상세 이미지 -->
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
              <button class="ai-btn" id="ai-components">🤖 AI 추천</button>
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
              <button class="ai-btn" id="ai-steps">🤖 AI 추천</button>
            </div>
            <div id="steps-list"></div>
            <button class="add-btn" id="add-step">
              <span>+</span> 단계 추가
            </button>
          </div>

          <!-- 유의사항 -->
          <div class="form-group">
            <label>⚠️ 구매시 유의사항</label>
            <div id="notices-list"></div>
            <button class="add-btn" id="add-notice">
              <span>+</span> 유의사항 추가
            </button>
          </div>

          <!-- 액션 버튼 -->
          <div class="action-buttons">
            <button class="primary-btn" id="generate-page">🚀 상세페이지 생성</button>
            <button class="secondary-btn" id="download-html">📥 다운로드</button>
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

        .upload-btn {
          width: 100%;
          height: 180px;
          border: 2px dashed #d0d0d0;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
          background: #fafafa;
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-btn:hover {
          border-color: #6B5CE7;
          background-color: #f5f0ff;
        }

        .upload-btn.filled {
          border-style: solid;
          border-color: #6B5CE7;
        }

        .upload-btn.filled .upload-content {
          display: none;
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #999;
        }

        .upload-icon {
          font-size: 32px;
          opacity: 0.6;
        }

        .upload-text {
          font-size: 13px;
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

        .product-upload-btn {
          width: 100px;
          height: 100px;
          min-width: 100px;
          border: 2px dashed #d0d0d0;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background-size: cover;
          background-position: center;
          font-size: 24px;
          color: #bbb;
          position: relative;
          overflow: hidden;
        }

        .product-upload-btn:hover {
          border-color: #6B5CE7;
          background-color: #f5f0ff;
        }

        .product-upload-btn.filled {
          border-style: solid;
          border-color: #6B5CE7;
        }

        .product-upload-btn.filled .upload-content {
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

        .image-card-actions {
          display: flex;
          justify-content: flex-end;
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
        }

        .ai-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
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

        .step-item-card {
          background: #f8f9fa;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          border: 2px solid #e8e8e8;
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
        }

        .step-body {
          display: flex;
          gap: 12px;
        }

        .step-upload-btn {
          width: 120px;
          height: 100px;
          min-width: 120px;
          border: 2px dashed #ccc;
          border-radius: 12px;
          cursor: pointer;
          background: #fff;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step-upload-btn:hover {
          border-color: #6B5CE7;
          background-color: #f5f0ff;
        }

        .step-upload-btn.filled {
          border-style: solid;
          border-color: #6B5CE7;
        }

        .step-upload-btn.filled .upload-content {
          display: none;
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

    // 대표 이미지 업로드 - input이 직접 클릭됨
    const heroBtn = this.container.querySelector('#hero-upload-btn');
    const heroInput = this.container.querySelector('#hero-input');

    heroInput.addEventListener('change', (e) => {
      console.log('파일 선택됨:', e.target.files);
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.slots.heroImage = ev.target.result;
          heroBtn.style.backgroundImage = `url(${ev.target.result})`;
          heroBtn.classList.add('filled');
          this.updatePreview();
        };
        reader.readAsDataURL(file);
      }
    });

    // 버튼 이벤트
    this.container.querySelector('#add-component').addEventListener('click', () => this.addComponent());
    this.container.querySelector('#add-step').addEventListener('click', () => this.addStep());
    this.container.querySelector('#add-notice').addEventListener('click', () => this.addNotice());
    this.container.querySelector('#add-product-image').addEventListener('click', () => this.addProductImage());
    this.container.querySelector('#generate-page').addEventListener('click', () => this.updatePreview());
    this.container.querySelector('#download-html').addEventListener('click', () => this.downloadHTML());

    // AI 버튼
    this.container.querySelector('#ai-components').addEventListener('click', () => this.aiGenerateComponents());
    this.container.querySelector('#ai-steps').addEventListener('click', () => this.aiGenerateSteps());

    // 초기 렌더링
    this.renderNotices();
  }

  addProductImage() {
    const index = this.slots.productImages.length;
    this.slots.productImages.push({ image: null, caption: '' });
    this.renderProductImages();
  }

  renderProductImages() {
    const list = this.container.querySelector('#product-images-list');
    if (!list) return;

    list.innerHTML = this.slots.productImages.map((item, index) => `
      <div class="image-card" data-index="${index}">
        <div class="image-card-top">
          <div class="product-upload-btn ${item.image ? 'filled' : ''}" 
               style="position: relative; ${item.image ? `background-image: url(${item.image})` : ''}"
               data-index="${index}">
            <div class="upload-content" style="pointer-events: none;">+</div>
            <input type="file" accept="image/*" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;" data-index="${index}" />
          </div>
          <div class="image-card-content">
            <textarea placeholder="이미지 아래에 표시될 설명을 입력하세요 (선택사항)" 
                      class="image-caption" data-index="${index}">${item.caption || ''}</textarea>
            <div class="image-card-actions">
              <button class="remove-btn" data-index="${index}">×</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // 이벤트 바인딩
    list.querySelectorAll('.image-card').forEach((card, index) => {
      const input = card.querySelector('input[type="file"]');

      // 파일 선택
      input.addEventListener('change', (e) => {
        console.log(`상세 이미지 ${index} 파일 선택됨:`, e.target.files);
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            this.slots.productImages[index].image = ev.target.result;
            this.renderProductImages();
            this.updatePreview();
          };
          reader.readAsDataURL(file);
        }
      });
    });

    list.querySelectorAll('.image-caption').forEach(textarea => {
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
        <input type="text" placeholder="단계 제목" class="step-title" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
        <button class="remove-btn">×</button>
      </div>
      <div class="step-body">
        <div class="step-upload-btn" data-step="${index}" style="position: relative;">
          <div class="upload-content" style="display: flex; flex-direction: column; align-items: center; color: #aaa; font-size: 12px; pointer-events: none;">
            <span style="font-size: 24px;">📷</span>
            <span>이미지</span>
          </div>
          <input type="file" accept="image/*" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;" data-step="${index}" />
        </div>
        <textarea placeholder="상세 설명..." class="step-desc"></textarea>
      </div>
    `;

    const updateStep = () => {
      this.slots.steps[index] = {
        title: item.querySelector('.step-title').value,
        description: item.querySelector('.step-desc').value,
        image: this.slots.steps[index]?.image || null
      };
      this.updatePreview();
    };

    item.querySelector('.step-title').addEventListener('input', updateStep);
    item.querySelector('.step-desc').addEventListener('input', updateStep);

    // 이미지 업로드
    const imgBtn = item.querySelector('.step-upload-btn');
    const imgInput = item.querySelector('input[type="file"]');

    imgInput.addEventListener('change', (e) => {
      console.log(`단계 ${index} 파일 선택됨:`, e.target.files);
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (!this.slots.steps[index]) {
            this.slots.steps[index] = { title: '', description: '', image: null };
          }
          this.slots.steps[index].image = ev.target.result;
          imgBtn.style.backgroundImage = `url(${ev.target.result})`;
          imgBtn.classList.add('filled');
          this.updatePreview();
        };
        reader.readAsDataURL(file);
      }
    });

    item.querySelector('.remove-btn').addEventListener('click', () => {
      this.slots.steps.splice(index, 1);
      item.remove();
      list.querySelectorAll('.step-badge').forEach((badge, i) => {
        badge.textContent = `STEP ${i + 1}`;
      });
      this.updatePreview();
    });

    this.slots.steps.push({ title: '', description: '', image: null });
    list.appendChild(item);
  }

  renderNotices() {
    const list = this.container.querySelector('#notices-list');
    if (!list) return;

    list.innerHTML = this.slots.notices.map((notice, index) => `
      <div class="item-row">
        <input type="text" value="${notice}" placeholder="유의사항 입력" data-notice="${index}" style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
        <button class="remove-btn" data-notice="${index}">×</button>
      </div>
    `).join('');

    list.querySelectorAll('input[data-notice]').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.notice);
        this.slots.notices[idx] = e.target.value;
        this.updatePreview();
      });
    });

    list.querySelectorAll('button[data-notice]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.notice);
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
      alert('먼저 제품명을 입력해주세요!');
      return;
    }

    const btn = this.container.querySelector('#ai-components');
    btn.textContent = '생성 중...';

    try {
      const result = await generateComponents(this.slots.productName);
      this.slots.components = [];
      this.container.querySelector('#components-list').innerHTML = '';

      for (const comp of result.components) {
        this.addComponent();
        const list = this.container.querySelector('#components-list');
        const lastItem = list.lastElementChild;
        if (lastItem) {
          lastItem.querySelector('.comp-icon').value = comp.icon || '📦';
          lastItem.querySelector('.comp-name').value = comp.name || '';
          lastItem.querySelector('.comp-qty').value = comp.qty || '';

          const index = this.slots.components.length - 1;
          this.slots.components[index] = comp;
        }
      }
      this.updatePreview();
    } catch (error) {
      console.error('AI 생성 실패:', error);
      alert('AI 서버에 연결할 수 없습니다.');
    } finally {
      btn.textContent = '🤖 AI 추천';
    }
  }

  async aiGenerateSteps() {
    if (!this.slots.productName) {
      alert('먼저 제품명을 입력해주세요!');
      return;
    }

    const btn = this.container.querySelector('#ai-steps');
    btn.textContent = '생성 중...';

    try {
      const result = await generateSteps(this.slots.productName);
      this.slots.steps = [];
      this.container.querySelector('#steps-list').innerHTML = '';

      for (const step of result.steps) {
        this.addStep();
        const list = this.container.querySelector('#steps-list');
        const lastItem = list.lastElementChild;
        if (lastItem) {
          lastItem.querySelector('.step-title').value = step.title || '';
          lastItem.querySelector('.step-desc').value = step.description || '';

          const index = this.slots.steps.length - 1;
          this.slots.steps[index] = {
            title: step.title || '',
            description: step.description || '',
            image: null
          };
        }
      }
      this.updatePreview();
    } catch (error) {
      console.error('AI 생성 실패:', error);
      alert('AI 서버에 연결할 수 없습니다.');
    } finally {
      btn.textContent = '🤖 AI 추천';
    }
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
}

export default TemplatePageGenerator;
