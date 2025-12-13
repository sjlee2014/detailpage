/**
 * 썸네일 생성기 컴포넌트
 * 제품 이미지 배경 제거 + 감성 배경 합성 + 타이포그래피
 */

import { removeImageBackground, blobToDataUrl } from '../utils/backgroundRemover.js';
import { showToast, showConfirm, showLoading } from '../utils/uiHelpers.js';

// 배경 템플릿 프리셋
const backgroundPresets = [
  { id: 'lavender', name: '라벤더 드림', color: '#E6E6FA', gradient: null },
  { id: 'peach', name: '피치 핑크', color: null, gradient: 'linear-gradient(180deg, #FFB6C1 0%, #FFDAB9 100%)' },
  { id: 'mint', name: '민트 프레시', color: '#98FB98', gradient: null },
  { id: 'cream', name: '크림 화이트', color: '#FFFDD0', gradient: null },
  { id: 'sky', name: '스카이 블루', color: null, gradient: 'linear-gradient(180deg, #87CEEB 0%, #E0FFFF 100%)' },
  { id: 'coral', name: '코랄 선셋', color: null, gradient: 'linear-gradient(180deg, #FF7F7F 0%, #FFD1DC 100%)' },
  { id: 'purple', name: '퍼플 매직', color: null, gradient: 'linear-gradient(135deg, #6B5CE7 0%, #FF6B9D 100%)' },
  { id: 'custom', name: '직접 업로드', color: null, gradient: null, isCustom: true }
];

class ThumbnailGenerator {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.canvas = null;
    this.ctx = null;

    // 레이어 시스템
    this.layers = []; // [{id, type, image, x, y, width, height, rotation, shadow, visible, name, locked}]
    this.selectedLayerId = null;
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
    this.dragOffset = { x: 0, y: 0 };

    // Undo/Redo 히스토리
    this.historyStack = [];
    this.historyIndex = -1;
    this.maxHistory = 50;

    // 클립보드 (복사/붙여넣기)
    this.clipboard = null;

    // 그림자 설정
    this.shadowSettings = {
      enabled: true,
      blur: 20,
      offsetX: 5,
      offsetY: 10,
      opacity: 0.15
    };

    this.background = {
      type: 'preset',
      preset: backgroundPresets[0],
      customImage: null
    };
    this.text = {
      title: '',
      subtitle: '',
      fontFamily: 'Jalnan2, Noto Sans KR, sans-serif'
    };
    this.canvasSize = { width: 860, height: 860 };
    this.layerIdCounter = 0;

    this.init();
  }

  init() {
    this.render();
    this.setupCanvas();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="thumbnail-generator">
        <!-- 좌측: 컨트롤 패널 -->
        <div class="control-panel">
          <h2>🖼️ 썸네일 생성기</h2>
          
          <!-- 제품 이미지 업로드 -->
          <div class="control-section">
            <label>📦 제품 이미지</label>
            <p class="hint">이미지를 업로드하면 배경이 자동으로 제거됩니다</p>
            <div class="upload-zone" id="productUploadZone">
              <span class="upload-icon">➕</span>
              <span>이미지 추가</span>
              <input type="file" accept="image/*" multiple hidden id="productInput" />
            </div>
            <div class="product-list" id="productList"></div>
            <div class="processing-status hidden" id="processingStatus">
              <div class="spinner"></div>
              <span id="processingText">배경 제거 중...</span>
            </div>
          </div>

          <!-- 배경 선택 -->
          <div class="control-section">
            <label>🎨 배경 선택</label>
            <div class="background-grid" id="backgroundGrid">
              ${backgroundPresets.map(preset => `
                <div class="bg-option ${preset.id === 'lavender' ? 'active' : ''}" 
                     data-id="${preset.id}"
                     style="${preset.gradient ? `background: ${preset.gradient}` : `background-color: ${preset.color || '#ddd'}`}">
                  ${preset.isCustom ? '<span class="custom-icon">📁</span>' : ''}
                </div>
              `).join('')}
            </div>
            <input type="file" accept="image/*" hidden id="customBgInput" />
          </div>

          <!-- 캔버스 크기 -->
          <div class="control-section">
            <label>📐 썸네일 크기</label>
            <div class="size-options">
              <button class="size-btn active" data-size="860x860">정사각형</button>
              <button class="size-btn" data-size="860x1200">세로형</button>
              <button class="size-btn" data-size="1200x860">가로형</button>
            </div>
          </div>

          <!-- 액션 버튼 -->
          <div class="action-section">
            <button class="btn-primary" id="downloadBtn">💾 다운로드</button>
            <button class="btn-secondary" id="clearBtn">🗑️ 초기화</button>
          </div>
        </div>

        <!-- 중앙: 캔버스 -->
        <div class="canvas-panel">
          <div class="canvas-header">
            <span>캔버스</span>
            <span class="canvas-size" id="canvasSizeLabel">860 × 860</span>
          </div>
          <div class="canvas-wrapper">
            <canvas id="thumbnailCanvas" width="860" height="860"></canvas>
          </div>
        </div>

        <!-- 오른쪽: 편집 패널 -->
        <div class="edit-panel">
          <h3>✏️ 편집</h3>
          
          <!-- 선택된 레이어 정보 -->
          <div class="edit-section" id="selectedLayerSection" style="display:none;">
            <label>선택된 레이어</label>
            <div class="selected-layer-info">
              <span id="selectedLayerName">-</span>
            </div>
            
            <!-- 텍스트 레이어 설정 (텍스트일 때만 표시) -->
            <div class="text-layer-controls" id="textLayerControls" style="display:none;">
              <div class="text-content-row">
                <label>내용</label>
                <input type="text" id="layerTextContent" class="text-input" />
              </div>
              <div class="text-style-row">
                <label>폰트</label>
                <select id="layerFontFamily">
                  <option value="Jalnan2, sans-serif">잘난체</option>
                  <option value="Noto Sans KR, sans-serif">노토 산스</option>
                  <option value="Pretendard, sans-serif">프리텐다드</option>
                  <option value="Nanum Gothic, sans-serif">나눔 고딕</option>
                  <option value="Nanum Myeongjo, serif">나눔 명조</option>
                  <option value="Black Han Sans, sans-serif">검은 한산</option>
                </select>
              </div>
              <div class="text-style-row">
                <label>크기</label>
                <input type="number" id="layerFontSize" value="48" min="12" max="200" />
                <span>px</span>
              </div>
              <div class="text-style-row">
                <label>색상</label>
                <input type="color" id="layerTextColor" value="#333333" />
              </div>
              <div class="text-style-row">
                <label>굵기</label>
                <select id="layerFontWeight">
                  <option value="normal">보통</option>
                  <option value="bold" selected>굵게</option>
                </select>
              </div>
            </div>
            
            <!-- 크기 조절 -->
            <div class="size-controls">
              <label>크기</label>
              <div class="size-inputs">
                <input type="number" id="layerWidth" placeholder="W" />
                <span>×</span>
                <input type="number" id="layerHeight" placeholder="H" />
                <button id="lockRatio" class="ratio-btn active" title="비율 유지">🔗</button>
              </div>
            </div>
            
            <!-- 회전 -->
            <div class="rotation-controls">
              <label>회전</label>
              <div class="rotation-row">
                <input type="range" id="layerRotation" min="0" max="360" value="0" />
                <span id="rotationValue">0°</span>
              </div>
            </div>
            
            <!-- 개별 그림자 -->
            <div class="shadow-controls">
              <label class="toggle-label">
                <input type="checkbox" id="layerShadowEnabled" checked />
                <span>그림자</span>
              </label>
              <div class="shadow-sliders">
                <div class="slider-row">
                  <span>흐림</span>
                  <input type="range" id="layerShadowBlur" min="0" max="50" value="20" />
                  <span id="layerShadowBlurValue">20</span>
                </div>
                <div class="slider-row">
                  <span>투명도</span>
                  <input type="range" id="layerShadowOpacity" min="0" max="50" value="15" />
                  <span id="layerShadowOpacityValue">15%</span>
                </div>
              </div>
            </div>
            
            <!-- 레이어 액션 -->
            <div class="layer-actions-row">
              <button id="moveLayerUp" title="앞으로">↑</button>
              <button id="moveLayerDown" title="뒤로">↓</button>
              <button id="duplicateLayer" title="복제">📋</button>
              <button id="lockLayer" title="잠금">🔓</button>
              <button id="deleteLayer" title="삭제">🗑</button>
            </div>
            
            <!-- 정렬 도구 -->
            <div class="layer-actions-row" style="margin-top: 8px;">
              <button id="alignHCenter" title="가로 중앙">⬌</button>
              <button id="alignVCenter" title="세로 중앙">⬍</button>
              <button id="alignCanvasCenter" title="캔버스 중앙">⊕</button>
            </div>
          </div>
          
          <div class="no-selection" id="noSelectionMsg">
            <p>레이어를 선택하세요</p>
          </div>
          
          <!-- 텍스트 추가 -->
          <div class="edit-section">
            <label>✏️ 텍스트 추가</label>
            <div class="text-add-row">
              <input type="text" id="newTextInput" placeholder="텍스트 입력" class="text-input" />
              <button id="addTextBtn" class="add-text-btn">+</button>
            </div>
          </div>
          
          <!-- 도형 추가 -->
          <div class="edit-section">
            <label>🔷 도형 추가</label>
            <div class="shape-tools">
              <button class="shape-btn" data-shape="rectangle" title="사각형">■</button>
              <button class="shape-btn" data-shape="circle" title="원">●</button>
              <button class="shape-btn" data-shape="star" title="별">★</button>
              <button class="shape-btn" data-shape="triangle" title="삼각형">▲</button>
              <button class="shape-btn" data-shape="line" title="선">━</button>
              <button class="shape-btn" data-shape="arrow" title="화살표">→</button>
            </div>
            <div class="shape-color-row">
              <label>채우기</label>
              <input type="color" id="shapeFillColor" value="#6B5CE7" />
              <label>테두리</label>
              <input type="color" id="shapeStrokeColor" value="#333333" />
            </div>
          </div>
          
          <!-- 도형 편집 (도형 선택 시 표시) -->
          <div class="edit-section shape-edit-controls" id="shapeEditControls" style="display:none;">
            <label>🎨 도형 설정</label>
            <div class="shape-color-row">
              <label>채우기</label>
              <input type="color" id="layerFillColor" value="#6B5CE7" />
            </div>
            <div class="shape-color-row">
              <label>테두리</label>
              <input type="color" id="layerStrokeColor" value="#333333" />
            </div>
            <div class="shape-color-row">
              <label>두께</label>
              <input type="number" id="layerStrokeWidth" value="2" min="0" max="20" />
            </div>
          </div>
          
          <!-- 레이어 목록 -->
          <div class="edit-section">
            <label>📑 레이어</label>
            <div class="layer-list" id="layerList">
              <div class="layer-empty">레이어가 없습니다</div>
            </div>
          </div>
        </div>
      </div>

      <style>
        .thumbnail-generator {
          display: grid;
          grid-template-columns: 280px 1fr 300px;
          gap: 0;
          min-height: 100vh;
          background: #f5f5f5;
        }

        .control-panel {
          background: white;
          padding: 20px;
          overflow-y: auto;
          max-height: 100vh;
          border-right: 1px solid #e8e8e8;
        }

        .control-panel h2 {
          font-size: 18px;
          margin-bottom: 20px;
          color: #333;
        }

        /* 오른쪽 편집 패널 */
        .edit-panel {
          background: white;
          padding: 16px;
          overflow-y: auto;
          max-height: 100vh;
          border-left: 1px solid #e8e8e8;
        }

        .edit-panel h3 {
          font-size: 16px;
          margin-bottom: 16px;
          color: #333;
        }

        .edit-section {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #eee;
        }

        .edit-section label {
          display: block;
          font-weight: 600;
          font-size: 13px;
          color: #333;
          margin-bottom: 8px;
        }

        .no-selection {
          text-align: center;
          color: #aaa;
          padding: 20px;
        }

        /* 크기 입력 */
        .size-inputs {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .size-inputs input {
          width: 60px;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
          text-align: center;
        }

        .ratio-btn {
          padding: 6px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
        }

        .ratio-btn.active {
          background: #ede9fe;
          border-color: #6B5CE7;
        }

        /* 회전 */
        .rotation-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rotation-row input[type="range"] {
          flex: 1;
        }

        .rotation-row span {
          width: 35px;
          text-align: right;
          font-size: 12px;
        }

        /* 레이어 액션 버튼 */
        .layer-actions-row {
          display: flex;
          gap: 6px;
          margin-top: 12px;
        }

        .layer-actions-row button {
          flex: 1;
          padding: 8px;
          border: 1px solid #ddd;
          background: #f9f9f9;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .layer-actions-row button:hover {
          background: #ede9fe;
          border-color: #6B5CE7;
        }

        .control-panel h2 {
          font-size: 20px;
          margin-bottom: 24px;
          color: #333;
        }

        .control-section {
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }

        .control-section label {
          display: block;
          font-weight: 600;
          margin-bottom: 10px;
          color: #333;
          font-size: 14px;
        }

        .control-section .hint {
          font-size: 12px;
          color: #888;
          margin-bottom: 10px;
        }

        .upload-zone {
          border: 2px dashed #d0d0d0;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #666;
        }

        .upload-zone:hover {
          border-color: #6B5CE7;
          background: #f5f0ff;
          color: #6B5CE7;
        }

        .upload-icon {
          font-size: 20px;
        }

        .product-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .product-thumb {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
          border: 2px solid #ddd;
          cursor: pointer;
          position: relative;
        }

        .product-thumb.selected {
          border-color: #6B5CE7;
          box-shadow: 0 0 0 3px rgba(107, 92, 231, 0.2);
        }

        .product-thumb .remove-btn {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 20px;
          height: 20px;
          background: #ff6b6b;
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .processing-status {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: #f0f7ff;
          border-radius: 8px;
          margin-top: 12px;
          color: #1a73e8;
          font-size: 13px;
        }

        .processing-status.hidden {
          display: none;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid #1a73e8;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .background-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .bg-option {
          aspect-ratio: 1;
          border-radius: 10px;
          cursor: pointer;
          border: 3px solid transparent;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bg-option:hover {
          transform: scale(1.05);
        }

        .bg-option.active {
          border-color: #333;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .custom-icon {
          font-size: 20px;
        }

        .text-input {
          width: 100%;
          padding: 12px 14px;
          border: 2px solid #e8e8e8;
          border-radius: 10px;
          font-size: 14px;
          margin-bottom: 10px;
          transition: all 0.2s;
        }

        .text-input:focus {
          border-color: #6B5CE7;
          outline: none;
          box-shadow: 0 0 0 4px rgba(107, 92, 231, 0.1);
        }

        .color-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .color-row input[type="color"] {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .color-row span {
          font-size: 13px;
          color: #666;
        }

        /* 텍스트 추가 */
        .text-add-row {
          display: flex;
          gap: 8px;
        }

        .text-add-row .text-input {
          flex: 1;
        }

        .add-text-btn {
          padding: 10px 16px;
          background: #6B5CE7;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .add-text-btn:hover {
          background: #5a4bd1;
        }

        /* 텍스트 레이어 설정 */
        .text-layer-controls {
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #eee;
        }

        .text-content-row,
        .text-style-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .text-style-row label {
          width: 40px;
          font-size: 12px;
          margin: 0 !important;
        }

        .text-style-row select,
        .text-style-row input[type="number"] {
          flex: 1;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .text-style-row input[type="color"] {
          width: 40px;
          height: 30px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .size-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .size-btn {
          padding: 10px 14px;
          border: 2px solid #e8e8e8;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
          text-align: left;
        }

        .size-btn:hover {
          border-color: #6B5CE7;
        }

        .size-btn.active {
          border-color: #6B5CE7;
          background: #f5f0ff;
          color: #6B5CE7;
          font-weight: 600;
        }

        .action-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 20px;
        }

        .btn-primary {
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

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(107, 92, 231, 0.3);
        }

        .btn-secondary {
          padding: 12px;
          background: white;
          color: #666;
          border: 2px solid #e8e8e8;
          border-radius: 10px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          border-color: #ff6b6b;
          color: #ff6b6b;
        }

        .canvas-panel {
          background: #e8e8e8;
          display: flex;
          flex-direction: column;
          padding: 24px;
          overflow: auto;
        }

        .canvas-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          font-weight: 600;
          color: #333;
        }

        .canvas-size {
          font-size: 12px;
          color: #888;
          background: #f5f5f5;
          padding: 4px 10px;
          border-radius: 4px;
        }

        .canvas-wrapper {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          overflow: hidden;
          display: inline-block;
        }

        #thumbnailCanvas {
          display: block;
          max-width: 100%;
          height: auto;
          cursor: default;
        }

        .canvas-hint {
          margin-top: 16px;
          font-size: 13px;
          color: #888;
          text-align: center;
        }

        /* 그림자 설정 */
        .shadow-controls {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .toggle-label input {
          width: 18px;
          height: 18px;
        }

        .shadow-sliders {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .slider-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }

        .slider-row span:first-child {
          width: 50px;
          color: #666;
        }

        .slider-row input[type="range"] {
          flex: 1;
        }

        .slider-row span:last-child {
          width: 35px;
          text-align: right;
          color: #888;
        }

        /* 레이어 패널 */
        .layer-section {
          max-height: 250px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .layer-list {
          flex: 1;
          overflow-y: auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .layer-empty {
          padding: 20px;
          text-align: center;
          color: #aaa;
          font-size: 13px;
        }

        .layer-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: white;
          border-bottom: 1px solid #eee;
          cursor: pointer;
          transition: background 0.2s;
        }

        .layer-item:hover {
          background: #f5f0ff;
        }

        .layer-item.selected {
          background: #ede9fe;
          border-left: 3px solid #6B5CE7;
        }

        .layer-thumb {
          width: 40px;
          height: 40px;
          object-fit: contain;
          background: #f0f0f0;
          border-radius: 4px;
        }

        .layer-info {
          flex: 1;
          overflow: hidden;
        }

        .layer-name {
          font-size: 13px;
          font-weight: 500;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .layer-type {
          font-size: 11px;
          color: #888;
        }

        .layer-actions {
          display: flex;
          gap: 4px;
        }

        .layer-btn {
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .layer-btn:hover {
          opacity: 1;
        }

        .layer-btn.hidden-layer {
          opacity: 0.3;
        }

        /* 도형 도구 스타일 */
        .shape-tools {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 6px;
          margin-bottom: 10px;
        }

        .shape-btn {
          padding: 10px;
          border: 2px solid #e8e8e8;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.2s;
        }

        .shape-btn:hover {
          border-color: #6B5CE7;
          background: #f5f0ff;
        }

        .shape-color-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .shape-color-row label {
          font-size: 12px;
          color: #666;
          margin: 0 !important;
        }

        .shape-color-row input[type="color"] {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .shape-color-row input[type="number"] {
          width: 60px;
          padding: 6px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        /* 레이어 아이콘 (도형/텍스트용) */
        .layer-icon {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: white;
          flex-shrink: 0;
        }

        .layer-icon.text-icon {
          background: #f0f0f0;
          font-weight: bold;
        }
      </style>
    `;
  }

  setupCanvas() {
    this.canvas = document.getElementById('thumbnailCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.redraw();
  }

  bindEvents() {
    // 제품 이미지 업로드
    const productUploadZone = document.getElementById('productUploadZone');
    const productInput = document.getElementById('productInput');

    productUploadZone.addEventListener('click', () => productInput.click());
    productInput.addEventListener('change', (e) => this.handleProductUpload(e.target.files));

    // 드래그앤드롭
    productUploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      productUploadZone.style.borderColor = '#6B5CE7';
      productUploadZone.style.background = '#f5f0ff';
    });

    productUploadZone.addEventListener('dragleave', () => {
      productUploadZone.style.borderColor = '';
      productUploadZone.style.background = '';
    });

    productUploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      productUploadZone.style.borderColor = '';
      productUploadZone.style.background = '';
      const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
      if (files.length) this.handleProductUpload(files);
    });

    // 배경 선택
    document.getElementById('backgroundGrid').addEventListener('click', (e) => {
      const option = e.target.closest('.bg-option');
      if (!option) return;

      const id = option.dataset.id;
      const preset = backgroundPresets.find(p => p.id === id);

      if (preset.isCustom) {
        document.getElementById('customBgInput').click();
        return;
      }

      document.querySelectorAll('.bg-option').forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      this.background = { type: 'preset', preset, customImage: null };
      this.redraw();
    });

    // 커스텀 배경 업로드
    document.getElementById('customBgInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const dataUrl = await this.fileToDataUrl(file);
      const img = await this.loadImage(dataUrl);

      document.querySelectorAll('.bg-option').forEach(o => o.classList.remove('active'));
      document.querySelector('.bg-option[data-id="custom"]').classList.add('active');

      this.background = { type: 'image', preset: null, customImage: img };
      this.redraw();
    });

    // 캔버스 크기
    document.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const [w, h] = btn.dataset.size.split('x').map(Number);
        this.canvasSize = { width: w, height: h };
        this.canvas.width = w;
        this.canvas.height = h;
        document.getElementById('canvasSizeLabel').textContent = `${w} × ${h}`;
        this.redraw();
      });
    });

    // 캔버스 마우스 이벤트
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.onMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.onMouseUp());

    // 우클릭 컨텍스트 메뉴 (색상 변경)
    this.canvas.addEventListener('contextmenu', (e) => this.onRightClick(e));

    // 키보드 단축키
    document.addEventListener('keydown', (e) => {
      // 입력 필드에서는 단축키 무시
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Delete: 레이어 삭제
      if (e.key === 'Delete' && this.selectedLayerId !== null) {
        e.preventDefault();
        this.deleteSelectedLayer();
      }

      // Ctrl+Z: Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      }

      // Ctrl+Y 또는 Ctrl+Shift+Z: Redo
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
        e.preventDefault();
        this.redo();
      }

      // Ctrl+C: 복사
      if (e.ctrlKey && e.key === 'c' && this.selectedLayerId !== null) {
        e.preventDefault();
        this.copyLayer();
      }

      // Ctrl+V: 붙여넣기
      if (e.ctrlKey && e.key === 'v' && this.clipboard !== null) {
        e.preventDefault();
        this.pasteLayer();
      }
    });

    // 다운로드
    document.getElementById('downloadBtn').addEventListener('click', () => this.download());

    // 초기화
    document.getElementById('clearBtn').addEventListener('click', async () => {
      if (this.layers.length === 0) {
        showToast('초기화할 내용이 없습니다.', 'info');
        return;
      }
      const confirmed = await showConfirm({
        title: '정말 초기화하시겠습니까?',
        message: '모든 레이어와 설정이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.',
        icon: '🗑️',
        confirmText: '초기화',
        cancelText: '취소'
      });
      if (confirmed) {
        this.clear();
        showToast('초기화되었습니다.', 'success');
      }
    });

    // 텍스트 추가
    document.getElementById('addTextBtn').addEventListener('click', () => {
      const text = document.getElementById('newTextInput').value.trim();
      if (text) {
        this.addTextLayer(text);
        this.updateLayerList();
        this.updateEditPanel();
        this.redraw();
        document.getElementById('newTextInput').value = '';
      }
    });

    // Enter 키로 텍스트 추가
    document.getElementById('newTextInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('addTextBtn').click();
      }
    });

    // 텍스트 레이어 설정
    document.getElementById('layerTextContent').addEventListener('input', (e) => {
      const layer = this.getSelectedLayer();
      if (layer && layer.type === 'text') {
        layer.text = e.target.value;
        this.redraw();
      }
    });

    document.getElementById('layerFontFamily').addEventListener('change', (e) => {
      const layer = this.getSelectedLayer();
      if (layer && layer.type === 'text') {
        layer.fontFamily = e.target.value;
        this.redraw();
      }
    });

    document.getElementById('layerFontSize').addEventListener('input', (e) => {
      const layer = this.getSelectedLayer();
      if (layer && layer.type === 'text') {
        layer.fontSize = parseInt(e.target.value);
        this.redraw();
      }
    });

    document.getElementById('layerTextColor').addEventListener('input', (e) => {
      const layer = this.getSelectedLayer();
      if (layer && layer.type === 'text') {
        layer.color = e.target.value;
        this.redraw();
      }
    });

    document.getElementById('layerFontWeight').addEventListener('change', (e) => {
      const layer = this.getSelectedLayer();
      if (layer && layer.type === 'text') {
        layer.fontWeight = e.target.value;
        this.redraw();
      }
    });

    // === 오른쪽 편집 패널 이벤트 ===
    this.lockRatio = true;
    this.aspectRatio = 1;

    // 비율 잠금
    document.getElementById('lockRatio').addEventListener('click', (e) => {
      this.lockRatio = !this.lockRatio;
      e.target.classList.toggle('active', this.lockRatio);
    });

    // 크기 입력
    document.getElementById('layerWidth').addEventListener('change', (e) => {
      const layer = this.getSelectedLayer();
      if (!layer) return;
      const newWidth = parseInt(e.target.value);
      if (this.lockRatio) {
        layer.height = newWidth / this.aspectRatio;
        document.getElementById('layerHeight').value = Math.round(layer.height);
      }
      layer.width = newWidth;
      this.redraw();
    });

    document.getElementById('layerHeight').addEventListener('change', (e) => {
      const layer = this.getSelectedLayer();
      if (!layer) return;
      const newHeight = parseInt(e.target.value);
      if (this.lockRatio) {
        layer.width = newHeight * this.aspectRatio;
        document.getElementById('layerWidth').value = Math.round(layer.width);
      }
      layer.height = newHeight;
      this.redraw();
    });

    // 회전 슬라이더
    document.getElementById('layerRotation').addEventListener('input', (e) => {
      const layer = this.getSelectedLayer();
      if (!layer) return;
      layer.rotation = parseInt(e.target.value);
      document.getElementById('rotationValue').textContent = e.target.value + '°';
      this.redraw();
    });

    // 개별 그림자 설정
    document.getElementById('layerShadowEnabled').addEventListener('change', (e) => {
      const layer = this.getSelectedLayer();
      if (!layer) return;
      layer.shadow.enabled = e.target.checked;
      this.redraw();
    });

    document.getElementById('layerShadowBlur').addEventListener('input', (e) => {
      const layer = this.getSelectedLayer();
      if (!layer) return;
      layer.shadow.blur = parseInt(e.target.value);
      document.getElementById('layerShadowBlurValue').textContent = e.target.value;
      this.redraw();
    });

    document.getElementById('layerShadowOpacity').addEventListener('input', (e) => {
      const layer = this.getSelectedLayer();
      if (!layer) return;
      layer.shadow.opacity = parseInt(e.target.value);
      document.getElementById('layerShadowOpacityValue').textContent = e.target.value + '%';
      this.redraw();
    });

    // ===== 도형 도구 이벤트 =====

    // 도형 버튼 클릭
    document.querySelectorAll('.shape-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const shapeType = btn.dataset.shape;
        const fillColor = document.getElementById('shapeFillColor').value;
        const strokeColor = document.getElementById('shapeStrokeColor').value;
        this.addShapeLayer(shapeType, { fillColor, strokeColor });
      });
    });

    // 도형 레이어 편집 - 채우기 색상
    document.getElementById('layerFillColor').addEventListener('input', (e) => {
      const layer = this.getSelectedLayer();
      if (!layer || layer.type !== 'shape') return;
      layer.fillColor = e.target.value;
      this.updateLayerList();
      this.redraw();
    });

    // 도형 레이어 편집 - 테두리 색상
    document.getElementById('layerStrokeColor').addEventListener('input', (e) => {
      const layer = this.getSelectedLayer();
      if (!layer || layer.type !== 'shape') return;
      layer.strokeColor = e.target.value;
      this.redraw();
    });

    // 도형 레이어 편집 - 선 두께
    document.getElementById('layerStrokeWidth').addEventListener('input', (e) => {
      const layer = this.getSelectedLayer();
      if (!layer || layer.type !== 'shape') return;
      layer.strokeWidth = parseInt(e.target.value);
      this.redraw();
    });

    // 레이어 액션 버튼
    document.getElementById('moveLayerUp').addEventListener('click', () => {
      if (this.selectedLayerId) {
        this.moveLayerUp(this.selectedLayerId);
        this.updateLayerList();
        this.redraw();
      }
    });

    document.getElementById('moveLayerDown').addEventListener('click', () => {
      if (this.selectedLayerId) {
        this.moveLayerDown(this.selectedLayerId);
        this.updateLayerList();
        this.redraw();
      }
    });

    document.getElementById('duplicateLayer').addEventListener('click', () => {
      const layer = this.getSelectedLayer();
      if (!layer) return;
      const newLayer = this.addLayer(layer.image, layer.type, layer.name + ' 복사');
      newLayer.x = layer.x + 20;
      newLayer.y = layer.y + 20;
      newLayer.width = layer.width;
      newLayer.height = layer.height;
      newLayer.rotation = layer.rotation;
      newLayer.shadow = { ...layer.shadow };
      this.updateLayerList();
      this.redraw();
    });

    document.getElementById('deleteLayer').addEventListener('click', () => {
      if (this.selectedLayerId) {
        this.removeLayer(this.selectedLayerId);
        this.updateLayerList();
        this.updateEditPanel();
        this.redraw();
      }
    });

    // 레이어 잠금 토글
    document.getElementById('lockLayer').addEventListener('click', () => {
      if (this.selectedLayerId) {
        this.toggleLayerLock(this.selectedLayerId);
      }
    });

    // 정렬 버튼
    document.getElementById('alignHCenter').addEventListener('click', () => {
      if (this.selectedLayerId) {
        this.alignHorizontalCenter();
      }
    });

    document.getElementById('alignVCenter').addEventListener('click', () => {
      if (this.selectedLayerId) {
        this.alignVerticalCenter();
      }
    });

    document.getElementById('alignCanvasCenter').addEventListener('click', () => {
      if (this.selectedLayerId) {
        this.alignToCanvasCenter();
      }
    });
  }

  async handleProductUpload(files) {
    const statusEl = document.getElementById('processingStatus');
    const statusText = document.getElementById('processingText');

    statusEl.classList.remove('hidden');
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      statusText.textContent = `이미지 로딩 중... (${i + 1}/${files.length})`;

      try {
        // 배경 제거 없이 원본 이미지 그대로 사용
        const dataUrl = await this.fileToDataUrl(file);
        const img = await this.loadImage(dataUrl);

        // 레이어로 추가
        this.addLayer(img, 'product', `제품 ${this.layers.length + 1}`);
        this.updateLayerList();
        this.updateEditPanel();
        this.redraw();
        successCount++;
      } catch (error) {
        console.error('이미지 로딩 실패:', error);
        failCount++;
        showToast(`이미지 처리 실패: ${file.name}`, 'error');
      }
    }

    statusEl.classList.add('hidden');

    // 결과 알림
    if (successCount > 0) {
      showToast(`${successCount}개 이미지가 추가되었습니다.`, 'success');
    }
    if (failCount > 0 && successCount === 0) {
      showToast('모든 이미지 처리에 실패했습니다.', 'error');
    }
  }

  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // 선택된 레이어가 있으면 핸들 확인
    const layer = this.getSelectedLayer();
    if (layer && layer.visible) {
      const handleSize = 12;
      const handles = this.getResizeHandles(layer);

      for (let i = 0; i < handles.length; i++) {
        const h = handles[i];
        if (x >= h.x - handleSize / 2 && x <= h.x + handleSize / 2 &&
          y >= h.y - handleSize / 2 && y <= h.y + handleSize / 2) {
          this.isResizing = true;
          this.resizeHandle = i;
          this.resizeStart = { x, y, width: layer.width, height: layer.height, layerX: layer.x, layerY: layer.y };
          this.canvas.style.cursor = this.getHandleCursor(i);
          return;
        }
      }
    }

    // 클릭된 레이어 찾기 (역순으로 - 위에 있는 것 먼저)
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const layer = this.layers[i];
      if (!layer.visible) continue;
      if (x >= layer.x && x <= layer.x + layer.width && y >= layer.y && y <= layer.y + layer.height) {
        this.selectedLayerId = layer.id;
        // 잠금된 레이어는 드래그 불가
        if (!layer.locked) {
          this.isDragging = true;
          this.dragOffset = { x: x - layer.x, y: y - layer.y };
          this.canvas.style.cursor = 'grabbing';
        }
        this.updateLayerList();
        this.updateEditPanel();
        this.redraw();
        return;
      }
    }

    this.selectedLayerId = null;
    this.updateLayerList();
    this.updateEditPanel();
    this.redraw();
  }

  getResizeHandles(layer) {
    return [
      { x: layer.x, y: layer.y },                                    // 0: 좌상단
      { x: layer.x + layer.width / 2, y: layer.y },                  // 1: 상단 중앙
      { x: layer.x + layer.width, y: layer.y },                      // 2: 우상단
      { x: layer.x + layer.width, y: layer.y + layer.height / 2 },   // 3: 우측 중앙
      { x: layer.x + layer.width, y: layer.y + layer.height },       // 4: 우하단
      { x: layer.x + layer.width / 2, y: layer.y + layer.height },   // 5: 하단 중앙
      { x: layer.x, y: layer.y + layer.height },                     // 6: 좌하단
      { x: layer.x, y: layer.y + layer.height / 2 }                  // 7: 좌측 중앙
    ];
  }

  getHandleCursor(index) {
    const cursors = ['nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize',
      'nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize'];
    return cursors[index];
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // 리사이징 중
    if (this.isResizing && this.selectedLayerId !== null) {
      const layer = this.getSelectedLayer();
      if (!layer) return;

      const dx = x - this.resizeStart.x;
      const dy = y - this.resizeStart.y;
      const minSize = 20;

      switch (this.resizeHandle) {
        case 0: // 좌상단
          layer.width = Math.max(minSize, this.resizeStart.width - dx);
          layer.height = Math.max(minSize, this.resizeStart.height - dy);
          layer.x = this.resizeStart.layerX + (this.resizeStart.width - layer.width);
          layer.y = this.resizeStart.layerY + (this.resizeStart.height - layer.height);
          break;
        case 1: // 상단 중앙
          layer.height = Math.max(minSize, this.resizeStart.height - dy);
          layer.y = this.resizeStart.layerY + (this.resizeStart.height - layer.height);
          break;
        case 2: // 우상단
          layer.width = Math.max(minSize, this.resizeStart.width + dx);
          layer.height = Math.max(minSize, this.resizeStart.height - dy);
          layer.y = this.resizeStart.layerY + (this.resizeStart.height - layer.height);
          break;
        case 3: // 우측 중앙
          layer.width = Math.max(minSize, this.resizeStart.width + dx);
          break;
        case 4: // 우하단
          layer.width = Math.max(minSize, this.resizeStart.width + dx);
          layer.height = Math.max(minSize, this.resizeStart.height + dy);
          break;
        case 5: // 하단 중앙
          layer.height = Math.max(minSize, this.resizeStart.height + dy);
          break;
        case 6: // 좌하단
          layer.width = Math.max(minSize, this.resizeStart.width - dx);
          layer.height = Math.max(minSize, this.resizeStart.height + dy);
          layer.x = this.resizeStart.layerX + (this.resizeStart.width - layer.width);
          break;
        case 7: // 좌측 중앙
          layer.width = Math.max(minSize, this.resizeStart.width - dx);
          layer.x = this.resizeStart.layerX + (this.resizeStart.width - layer.width);
          break;
      }

      this.updateEditPanel();
      this.redraw();
      return;
    }

    // 드래그 이동 중
    if (this.isDragging && this.selectedLayerId !== null) {
      const layer = this.getSelectedLayer();
      if (layer) {
        layer.x = x - this.dragOffset.x;
        layer.y = y - this.dragOffset.y;
      }
      this.redraw();
      return;
    }

    // 마우스 오버 시 커서 변경
    const layer = this.getSelectedLayer();
    if (layer && layer.visible) {
      const handleSize = 12;
      const handles = this.getResizeHandles(layer);

      for (let i = 0; i < handles.length; i++) {
        const h = handles[i];
        if (x >= h.x - handleSize / 2 && x <= h.x + handleSize / 2 &&
          y >= h.y - handleSize / 2 && y <= h.y + handleSize / 2) {
          this.canvas.style.cursor = this.getHandleCursor(i);
          return;
        }
      }
    }

    this.canvas.style.cursor = 'default';
  }

  onMouseUp() {
    // 드래그나 리사이즈가 끝났으면 히스토리 저장
    if (this.isDragging || this.isResizing) {
      this.saveHistory();
    }
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
    this.canvas.style.cursor = 'default';
  }

  // Delete 키로 선택된 레이어 삭제
  deleteSelectedLayer() {
    if (this.selectedLayerId !== null) {
      this.removeLayer(this.selectedLayerId);
      this.updateLayerList();
      this.updateEditPanel();
      this.redraw();
    }
  }

  // 우클릭 컨텍스트 메뉴 (색상 변경)
  onRightClick(e) {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // 클릭된 레이어 찾기
    let clickedLayer = null;
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const layer = this.layers[i];
      if (!layer.visible) continue;
      if (x >= layer.x && x <= layer.x + layer.width && y >= layer.y && y <= layer.y + layer.height) {
        clickedLayer = layer;
        break;
      }
    }

    if (!clickedLayer) return;

    // 선택
    this.selectedLayerId = clickedLayer.id;
    this.updateLayerList();
    this.updateEditPanel();
    this.redraw();

    // 기존 컨텍스트 메뉴 제거
    const existingMenu = document.getElementById('layerContextMenu');
    if (existingMenu) existingMenu.remove();

    // 컨텍스트 메뉴 생성
    const menu = document.createElement('div');
    menu.id = 'layerContextMenu';
    menu.style.cssText = `
      position: fixed;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      background: #2a2a36;
      border-radius: 8px;
      padding: 8px 0;
      min-width: 180px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      z-index: 10000;
      font-size: 14px;
    `;

    // 도형인 경우 색상 변경 옵션 추가
    if (clickedLayer.type === 'shape') {
      menu.innerHTML = `
        <div class="ctx-item" data-action="fill">
          <span>🎨 채우기 색상 변경</span>
          <input type="color" id="ctxFillColor" value="${clickedLayer.fillColor || '#6B5CE7'}" />
        </div>
        <div class="ctx-item" data-action="stroke">
          <span>✏️ 테두리 색상 변경</span>
          <input type="color" id="ctxStrokeColor" value="${clickedLayer.strokeColor || '#333333'}" />
        </div>
        <hr style="border: none; border-top: 1px solid #444; margin: 6px 0;">
        <div class="ctx-item" data-action="delete">🗑 삭제</div>
      `;
    } else if (clickedLayer.type === 'text') {
      menu.innerHTML = `
        <div class="ctx-item" data-action="textColor">
          <span>🎨 텍스트 색상 변경</span>
          <input type="color" id="ctxTextColor" value="${clickedLayer.color || '#000000'}" />
        </div>
        <hr style="border: none; border-top: 1px solid #444; margin: 6px 0;">
        <div class="ctx-item" data-action="delete">🗑 삭제</div>
      `;
    } else {
      menu.innerHTML = `
        <div class="ctx-item" data-action="delete">🗑 삭제</div>
      `;
    }

    // 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      .ctx-item {
        padding: 8px 16px;
        color: #fff;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .ctx-item:hover { background: rgba(107, 92, 231, 0.3); }
      .ctx-item input[type="color"] {
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
    `;
    menu.appendChild(style);
    document.body.appendChild(menu);

    // 이벤트 핸들러
    const fillColorInput = menu.querySelector('#ctxFillColor');
    const strokeColorInput = menu.querySelector('#ctxStrokeColor');
    const textColorInput = menu.querySelector('#ctxTextColor');

    if (fillColorInput) {
      fillColorInput.addEventListener('input', (ev) => {
        clickedLayer.fillColor = ev.target.value;
        this.updateLayerList();
        this.redraw();
      });
    }
    if (strokeColorInput) {
      strokeColorInput.addEventListener('input', (ev) => {
        clickedLayer.strokeColor = ev.target.value;
        this.redraw();
      });
    }
    if (textColorInput) {
      textColorInput.addEventListener('input', (ev) => {
        clickedLayer.color = ev.target.value;
        this.redraw();
      });
    }

    // 삭제 클릭
    menu.querySelectorAll('.ctx-item[data-action="delete"]').forEach(item => {
      item.addEventListener('click', () => {
        this.deleteSelectedLayer();
        menu.remove();
      });
    });

    // 바깥 클릭 시 메뉴 닫기
    const closeMenu = (ev) => {
      if (!menu.contains(ev.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 10);
  }

  // ===== Undo/Redo 시스템 =====

  saveHistory() {
    // 현재 상태를 히스토리에 저장
    const state = JSON.stringify(this.layers.map(layer => ({
      ...layer,
      image: layer.image ? layer.image.src : null
    })));

    // 현재 인덱스 이후의 히스토리 삭제 (새로운 분기)
    this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
    this.historyStack.push(state);

    // 최대 히스토리 유지
    if (this.historyStack.length > this.maxHistory) {
      this.historyStack.shift();
    } else {
      this.historyIndex++;
    }
  }

  async undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      await this.restoreHistory(this.historyIndex);
      console.log('↩️ Undo');
    }
  }

  async redo() {
    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyIndex++;
      await this.restoreHistory(this.historyIndex);
      console.log('↪️ Redo');
    }
  }

  async restoreHistory(index) {
    const state = JSON.parse(this.historyStack[index]);
    this.layers = [];

    for (const layerData of state) {
      const layer = { ...layerData };
      if (layerData.image && typeof layerData.image === 'string') {
        layer.image = await this.loadImage(layerData.image);
      }
      this.layers.push(layer);
    }

    this.selectedLayerId = null;
    this.updateLayerList();
    this.updateEditPanel();
    this.redraw();
  }

  // ===== 복사/붙여넣기 =====

  copyLayer() {
    const layer = this.getSelectedLayer();
    if (layer) {
      this.clipboard = JSON.stringify({
        ...layer,
        image: layer.image ? layer.image.src : null
      });
      console.log('📋 레이어 복사됨');
    }
  }

  async pasteLayer() {
    if (!this.clipboard) return;

    const layerData = JSON.parse(this.clipboard);
    const id = ++this.layerIdCounter;

    const newLayer = {
      ...layerData,
      id,
      name: `${layerData.name} (복사)`,
      x: layerData.x + 20,
      y: layerData.y + 20
    };

    if (layerData.image && typeof layerData.image === 'string') {
      newLayer.image = await this.loadImage(layerData.image);
    }

    this.layers.push(newLayer);
    this.selectedLayerId = id;
    this.saveHistory();
    this.updateLayerList();
    this.updateEditPanel();
    this.redraw();
    console.log('📋 레이어 붙여넣기됨');
  }

  // ===== 레이어 잠금 =====

  toggleLayerLock(id) {
    const layer = this.layers.find(l => l.id === id);
    if (layer) {
      layer.locked = !layer.locked;
      // 잠금 버튼 아이콘 업데이트
      const lockBtn = document.getElementById('lockLayer');
      if (lockBtn) {
        lockBtn.textContent = layer.locked ? '🔒' : '🔓';
        lockBtn.title = layer.locked ? '잠금 해제' : '잠금';
      }
      this.updateLayerList();
      this.redraw();
      console.log(layer.locked ? '🔒 레이어 잠금' : '🔓 레이어 잠금 해제');
    }
  }

  // ===== 정렬 도구 =====

  alignHorizontalCenter() {
    const layer = this.getSelectedLayer();
    if (layer && !layer.locked) {
      layer.x = (this.canvasSize.width - layer.width) / 2;
      this.saveHistory();
      this.redraw();
    }
  }

  alignVerticalCenter() {
    const layer = this.getSelectedLayer();
    if (layer && !layer.locked) {
      layer.y = (this.canvasSize.height - layer.height) / 2;
      this.saveHistory();
      this.redraw();
    }
  }

  alignToCanvasCenter() {
    const layer = this.getSelectedLayer();
    if (layer && !layer.locked) {
      layer.x = (this.canvasSize.width - layer.width) / 2;
      layer.y = (this.canvasSize.height - layer.height) / 2;
      this.saveHistory();
      this.redraw();
    }
  }

  redraw() {
    const { ctx, canvas } = this;
    const { width, height } = this.canvasSize;

    // 배경 그리기
    if (this.background.type === 'image' && this.background.customImage) {
      const img = this.background.customImage;
      const scale = Math.max(width / img.width, height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (width - w) / 2;
      const y = (height - h) / 2;
      ctx.drawImage(img, x, y, w, h);
    } else if (this.background.preset) {
      if (this.background.preset.gradient) {
        // 그라데이션
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        const colors = this.background.preset.gradient.match(/#[A-Fa-f0-9]{6}/g);
        if (colors && colors.length >= 2) {
          gradient.addColorStop(0, colors[0]);
          gradient.addColorStop(1, colors[1]);
        }
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = this.background.preset.color || '#FFFFFF';
      }
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    // 레이어 그리기
    this.layers.forEach(layer => {
      if (!layer.visible) return;

      ctx.save();

      // 중심점 기준 회전
      const centerX = layer.x + layer.width / 2;
      const centerY = layer.y + layer.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(layer.rotation * Math.PI / 180);
      ctx.translate(-centerX, -centerY);

      // 개별 그림자 적용
      if (layer.shadow && layer.shadow.enabled) {
        ctx.shadowColor = `rgba(0, 0, 0, ${layer.shadow.opacity / 100})`;
        ctx.shadowBlur = layer.shadow.blur;
        ctx.shadowOffsetX = layer.shadow.offsetX;
        ctx.shadowOffsetY = layer.shadow.offsetY;
      }

      // 타입에 따라 렌더링
      if (layer.type === 'text') {
        // 텍스트 레이어
        ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
        ctx.fillStyle = layer.color;
        ctx.textBaseline = 'top';
        ctx.fillText(layer.text, layer.x, layer.y);

        // 텍스트 크기 측정하여 레이어 크기 업데이트
        const metrics = ctx.measureText(layer.text);
        layer.width = metrics.width;
        layer.height = layer.fontSize * 1.2;
      } else if (layer.type === 'shape') {
        // 도형 레이어
        this.drawShape(ctx, layer);
      } else if (layer.image) {
        // 이미지 레이어
        ctx.drawImage(layer.image, layer.x, layer.y, layer.width, layer.height);
      }

      ctx.restore();
    });

    // 선택된 레이어 핸들 그리기 (회전 후)
    const selectedLayer = this.getSelectedLayer();
    if (selectedLayer && selectedLayer.visible) {
      ctx.save();

      const layer = selectedLayer;
      const centerX = layer.x + layer.width / 2;
      const centerY = layer.y + layer.height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(layer.rotation * Math.PI / 180);
      ctx.translate(-centerX, -centerY);

      // 테두리
      ctx.strokeStyle = '#6B5CE7';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);

      // 크기 조절 핸들 (8개)
      const handleSize = 8;
      ctx.fillStyle = '#6B5CE7';
      const handles = [
        { x: layer.x - handleSize / 2, y: layer.y - handleSize / 2 },
        { x: layer.x + layer.width / 2 - handleSize / 2, y: layer.y - handleSize / 2 },
        { x: layer.x + layer.width - handleSize / 2, y: layer.y - handleSize / 2 },
        { x: layer.x + layer.width - handleSize / 2, y: layer.y + layer.height / 2 - handleSize / 2 },
        { x: layer.x + layer.width - handleSize / 2, y: layer.y + layer.height - handleSize / 2 },
        { x: layer.x + layer.width / 2 - handleSize / 2, y: layer.y + layer.height - handleSize / 2 },
        { x: layer.x - handleSize / 2, y: layer.y + layer.height - handleSize / 2 },
        { x: layer.x - handleSize / 2, y: layer.y + layer.height / 2 - handleSize / 2 }
      ];
      handles.forEach(h => ctx.fillRect(h.x, h.y, handleSize, handleSize));

      // 회전 핸들 (상단 중앙)
      ctx.beginPath();
      ctx.arc(layer.x + layer.width / 2, layer.y - 25, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#10B981';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 회전 핸들 연결선
      ctx.beginPath();
      ctx.moveTo(layer.x + layer.width / 2, layer.y);
      ctx.lineTo(layer.x + layer.width / 2, layer.y - 19);
      ctx.strokeStyle = '#6B5CE7';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  }

  download() {
    const link = document.createElement('a');
    link.download = `thumbnail_${Date.now()}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }

  clear() {
    this.layers = [];
    this.selectedLayerId = null;
    this.layerIdCounter = 0;
    this.text = { title: '', subtitle: '', fontFamily: 'Jalnan2, Noto Sans KR, sans-serif' };
    this.background = { type: 'preset', preset: backgroundPresets[0], customImage: null };

    document.getElementById('newTextInput').value = '';
    this.updateLayerList();
    this.updateEditPanel();

    document.querySelectorAll('.bg-option').forEach((o, i) => {
      o.classList.toggle('active', i === 0);
    });

    this.redraw();
  }

  fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // ===== 레이어 관리 메서드 =====

  addLayer(image, type = 'product', name = null) {
    const id = ++this.layerIdCounter;
    const scale = Math.min(200 / image.width, 200 / image.height);
    const layer = {
      id,
      type,
      name: name || `레이어 ${id}`,
      image,
      x: 100 + (this.layers.length % 3) * 220,
      y: 150 + Math.floor(this.layers.length / 3) * 200,
      width: image.width * scale,
      height: image.height * scale,
      rotation: 0,
      visible: true,
      shadow: {
        enabled: true,
        blur: 20,
        offsetX: 5,
        offsetY: 10,
        opacity: 15
      }
    };
    this.layers.push(layer);
    this.selectedLayerId = id;
    return layer;
  }

  addTextLayer(text, options = {}) {
    const id = ++this.layerIdCounter;
    const layer = {
      id,
      type: 'text',
      name: `텍스트 ${id}`,
      text: text,
      x: options.x || 100,
      y: options.y || 150,
      width: 300,
      height: 60,
      rotation: 0,
      visible: true,
      fontFamily: options.fontFamily || 'Jalnan2, sans-serif',
      fontSize: options.fontSize || 48,
      fontWeight: options.fontWeight || 'bold',
      color: options.color || '#333333',
      shadow: {
        enabled: true,
        blur: 4,
        offsetX: 2,
        offsetY: 2,
        opacity: 20
      }
    };
    this.layers.push(layer);
    this.selectedLayerId = id;
    return layer;
  }

  // ===== 도형 레이어 메서드 =====

  addShapeLayer(shapeType, options = {}) {
    const id = ++this.layerIdCounter;
    const shapeNames = {
      rectangle: '사각형', circle: '원', star: '별',
      line: '선', triangle: '삼각형', arrow: '화살표'
    };
    const layer = {
      id,
      type: 'shape',
      shapeType,
      name: `${shapeNames[shapeType] || shapeType} ${id}`,
      x: 100 + (this.layers.length % 3) * 120,
      y: 150 + Math.floor(this.layers.length / 3) * 120,
      width: options.width || 100,
      height: options.height || 100,
      rotation: 0,
      visible: true,
      fillColor: options.fillColor || '#6B5CE7',
      strokeColor: options.strokeColor || '#333333',
      strokeWidth: options.strokeWidth || 2,
      points: options.points || 5, // 별 꼭지점 수
      shadow: {
        enabled: false,
        blur: 10,
        offsetX: 3,
        offsetY: 5,
        opacity: 15
      }
    };
    this.layers.push(layer);
    this.selectedLayerId = id;
    this.updateLayerList();
    this.updateEditPanel();
    this.redraw();
    return layer;
  }

  drawShape(ctx, layer) {
    const { x, y, width, height, shapeType, fillColor, strokeColor, strokeWidth } = layer;

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    switch (shapeType) {
      case 'rectangle':
        ctx.fillRect(x, y, width, height);
        if (strokeWidth > 0) ctx.strokeRect(x, y, width, height);
        break;

      case 'circle':
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        if (strokeWidth > 0) ctx.stroke();
        break;

      case 'star':
        this.drawStar(ctx, x + width / 2, y + height / 2, layer.points, width / 2, width / 4);
        ctx.fill();
        if (strokeWidth > 0) ctx.stroke();
        break;

      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.closePath();
        ctx.fill();
        if (strokeWidth > 0) ctx.stroke();
        break;

      case 'line':
        ctx.beginPath();
        ctx.moveTo(x, y + height / 2);
        ctx.lineTo(x + width, y + height / 2);
        ctx.lineWidth = Math.max(strokeWidth, 3);
        ctx.strokeStyle = fillColor;
        ctx.stroke();
        break;

      case 'arrow':
        const arrowHeadSize = Math.min(width, height) * 0.3;
        ctx.beginPath();
        // 화살표 몸통
        ctx.moveTo(x, y + height / 2);
        ctx.lineTo(x + width - arrowHeadSize, y + height / 2);
        ctx.lineWidth = Math.max(strokeWidth, 3);
        ctx.strokeStyle = fillColor;
        ctx.stroke();
        // 화살표 머리
        ctx.beginPath();
        ctx.moveTo(x + width, y + height / 2);
        ctx.lineTo(x + width - arrowHeadSize, y + height / 2 - arrowHeadSize / 2);
        ctx.lineTo(x + width - arrowHeadSize, y + height / 2 + arrowHeadSize / 2);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        break;
    }
  }

  drawStar(ctx, cx, cy, points, outerRadius, innerRadius) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  getLayerById(id) {
    return this.layers.find(l => l.id === id);
  }

  getSelectedLayer() {
    return this.getLayerById(this.selectedLayerId);
  }

  getLayerIndex(id) {
    return this.layers.findIndex(l => l.id === id);
  }

  removeLayer(id) {
    const index = this.getLayerIndex(id);
    if (index !== -1) {
      this.layers.splice(index, 1);
      if (this.selectedLayerId === id) {
        this.selectedLayerId = this.layers.length > 0 ? this.layers[this.layers.length - 1].id : null;
      }
    }
  }

  moveLayerUp(id) {
    const index = this.getLayerIndex(id);
    if (index < this.layers.length - 1) {
      [this.layers[index], this.layers[index + 1]] = [this.layers[index + 1], this.layers[index]];
    }
  }

  moveLayerDown(id) {
    const index = this.getLayerIndex(id);
    if (index > 0) {
      [this.layers[index], this.layers[index - 1]] = [this.layers[index - 1], this.layers[index]];
    }
  }

  updateLayerList() {
    const listEl = document.getElementById('layerList');
    if (!listEl) return;

    if (this.layers.length === 0) {
      listEl.innerHTML = '<div class="layer-empty">레이어가 없습니다</div>';
      return;
    }

    // 레이어 역순 표시 (위에 있는 것이 먼저)
    const getLayerThumb = (layer) => {
      if (layer.type === 'shape') {
        const shapeIcons = { rectangle: '■', circle: '●', star: '★', line: '━', triangle: '▲', arrow: '→' };
        return `<div class="layer-icon" style="background:${layer.fillColor}">${shapeIcons[layer.shapeType] || '◆'}</div>`;
      } else if (layer.type === 'text') {
        return `<div class="layer-icon text-icon" style="color:${layer.color}">T</div>`;
      } else if (layer.image) {
        return `<img class="layer-thumb" src="${layer.image.src}" alt="${layer.name}" />`;
      }
      return '<div class="layer-icon">?</div>';
    };

    const getLayerTypeName = (layer) => {
      if (layer.type === 'shape') return '도형';
      if (layer.type === 'text') return '텍스트';
      if (layer.type === 'product') return '제품';
      return layer.type;
    };

    listEl.innerHTML = [...this.layers].reverse().map(layer => `
      <div class="layer-item ${this.selectedLayerId === layer.id ? 'selected' : ''}" data-id="${layer.id}">
        ${getLayerThumb(layer)}
        <div class="layer-info">
          <div class="layer-name">${layer.name}</div>
          <div class="layer-type">${getLayerTypeName(layer)}</div>
        </div>
        <div class="layer-actions">
          <button class="layer-btn ${!layer.visible ? 'hidden-layer' : ''}" data-toggle="${layer.id}" title="표시/숨김">👁</button>
          <button class="layer-btn" data-up="${layer.id}" title="위로">↑</button>
          <button class="layer-btn" data-down="${layer.id}" title="아래로">↓</button>
          <button class="layer-btn" data-remove="${layer.id}" title="삭제">🗑</button>
        </div>
      </div>
    `).join('');

    this.bindLayerEvents();
  }

  bindLayerEvents() {
    const listEl = document.getElementById('layerList');
    if (!listEl) return;

    // 레이어 선택
    listEl.querySelectorAll('.layer-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.layer-btn')) return;
        this.selectedLayerId = parseInt(item.dataset.id);
        this.updateLayerList();
        this.updateEditPanel();
        this.redraw();
      });
    });

    // 표시/숨김 토글
    listEl.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const layer = this.getLayerById(parseInt(btn.dataset.toggle));
        if (layer) {
          layer.visible = !layer.visible;
          this.updateLayerList();
          this.redraw();
        }
      });
    });

    // 위로/아래로
    listEl.querySelectorAll('[data-up]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.moveLayerUp(parseInt(btn.dataset.up));
        this.updateLayerList();
        this.redraw();
      });
    });

    listEl.querySelectorAll('[data-down]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.moveLayerDown(parseInt(btn.dataset.down));
        this.updateLayerList();
        this.redraw();
      });
    });

    // 삭제
    listEl.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeLayer(parseInt(btn.dataset.remove));
        this.updateLayerList();
        this.updateEditPanel();
        this.redraw();
      });
    });
  }

  updateEditPanel() {
    const layer = this.getSelectedLayer();
    const sectionEl = document.getElementById('selectedLayerSection');
    const noSelectionEl = document.getElementById('noSelectionMsg');

    if (!layer) {
      sectionEl.style.display = 'none';
      noSelectionEl.style.display = 'block';
      return;
    }

    sectionEl.style.display = 'block';
    noSelectionEl.style.display = 'none';

    // 레이어 정보 업데이트
    document.getElementById('selectedLayerName').textContent = layer.name;
    document.getElementById('layerWidth').value = Math.round(layer.width);
    document.getElementById('layerHeight').value = Math.round(layer.height);
    this.aspectRatio = layer.width / layer.height;

    // 회전
    document.getElementById('layerRotation').value = layer.rotation;
    document.getElementById('rotationValue').textContent = layer.rotation + '°';

    // 텍스트 레이어 설정 표시/숨김
    const textControls = document.getElementById('textLayerControls');
    if (layer.type === 'text') {
      textControls.style.display = 'block';
      document.getElementById('layerTextContent').value = layer.text;
      document.getElementById('layerFontFamily').value = layer.fontFamily;
      document.getElementById('layerFontSize').value = layer.fontSize;
      document.getElementById('layerTextColor').value = layer.color;
      document.getElementById('layerFontWeight').value = layer.fontWeight;
    } else {
      textControls.style.display = 'none';
    }

    // 도형 레이어 설정 표시/숨김
    const shapeControls = document.getElementById('shapeEditControls');
    if (layer.type === 'shape') {
      shapeControls.style.display = 'block';
      document.getElementById('layerFillColor').value = layer.fillColor;
      document.getElementById('layerStrokeColor').value = layer.strokeColor;
      document.getElementById('layerStrokeWidth').value = layer.strokeWidth;
    } else {
      shapeControls.style.display = 'none';
    }

    // 개별 그림자
    document.getElementById('layerShadowEnabled').checked = layer.shadow.enabled;
    document.getElementById('layerShadowBlur').value = layer.shadow.blur;
    document.getElementById('layerShadowBlurValue').textContent = layer.shadow.blur;
    document.getElementById('layerShadowOpacity').value = layer.shadow.opacity;
    document.getElementById('layerShadowOpacityValue').textContent = layer.shadow.opacity + '%';

    // 잠금 버튼 상태 업데이트
    const lockBtn = document.getElementById('lockLayer');
    if (lockBtn) {
      lockBtn.textContent = layer.locked ? '🔒' : '🔓';
      lockBtn.title = layer.locked ? '잠금 해제' : '잠금';
    }
  }
}

export default ThumbnailGenerator;
