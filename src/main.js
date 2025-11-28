import './style.css';
import { generateCopywriting } from './utils/copywriter.js';
import { generateAndDownload } from './utils/imageGenerator.js';
import { renderTemplate } from './templates/index.js';

// Gemini AI imports
import { analyzeProductImage, analyzeStyleImage, testConnection } from './utils/geminiClient.js';
import { generateAIDesign, generateAICopywriting } from './utils/designGenerator.js';
import { makeSafeHTML } from './utils/htmlSanitizer.js';
import { getExamples, saveExample, deleteExample } from './utils/styleManager.js';

// 전역 상태
const state = {
  productImages: [], // 배열로 변경
  productImageData: [], // 배열로 변경 (base64)
  productName: '',
  productDesc: '',
  selectedTemplate: 'cute',
  generatedData: null,
  aiMode: true,
  imageAnalysis: null,
  styleAnalysis: null, // 스타일 분석 결과 추가
  styleExamples: [],
};

// DOM 요소
const elements = {
  fileUploadArea: document.getElementById('fileUploadArea'),
  fileInput: document.getElementById('fileInput'),
  clearImagesBtn: document.getElementById('clearImagesBtn'), // 🆕 이미지 삭제 버튼
  imagePreview: document.getElementById('imagePreview'),
  productName: document.getElementById('productName'),
  productDesc: document.getElementById('productDesc'),
  nameCounter: document.getElementById('nameCounter'),
  descCounter: document.getElementById('descCounter'),
  generateBtn: document.getElementById('generateBtn'),
  btnText: document.getElementById('btnText'),
  downloadBtn: document.getElementById('downloadBtn'),
  regenerateBtn: document.getElementById('regenerateBtn'), // 🆕 재생성 버튼
  previewArea: document.getElementById('previewArea'),
  alertArea: document.getElementById('alertArea'),
  templateRenderArea: document.getElementById('templateRenderArea'),

  // AI 관련
  ruleModeBtn: document.getElementById('ruleModeBtn'),
  aiModeBtn: document.getElementById('aiModeBtn'),
  modeDescription: document.getElementById('modeDescription'),
  styleExamplesSection: document.getElementById('styleExamplesSection'),
  templateSection: document.getElementById('templateSection'),
  styleUploadArea: document.getElementById('styleUploadArea'),
  styleInput: document.getElementById('styleInput'),
  exampleGallery: document.getElementById('exampleGallery'),
  styleAnalysisResult: document.getElementById('styleAnalysisResult'),
  styleTags: document.getElementById('styleTags'),
};

// ========== 초기화 ==========

async function initializeApp() {
  console.log('🎨 AI 상세페이지 생성기 로드 완료!');

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    showAlert('⚠️ .env 파일에 VITE_GEMINI_API_KEY를 설정해주세요', 'error');
    return;
  }

  try {
    const result = await testConnection();
    if (result.success) {
      console.log(`✅ Gemini API 연결 성공 (${result.model})`);
    } else {
      showAlert(`API 연결 실패: ${result.message}`, 'error');
    }
  } catch (error) {
    console.error('API 테스트 오류:', error);
  }

  loadStyleExamples();
  loadFormData(); // 🆕 저장된 폼 데이터 불러오기
}

// ========== 🆕 LocalStorage 저장/불러오기 ==========

function saveFormData() {
  localStorage.setItem('productName', state.productName);
  localStorage.setItem('productDesc', state.productDesc);
  console.log('💾 폼 데이터 저장됨');
}

function loadFormData() {
  const savedName = localStorage.getItem('productName');
  const savedDesc = localStorage.getItem('productDesc');

  if (savedName) {
    elements.productName.value = savedName;
    state.productName = savedName;
    updateCharCount(elements.productName, elements.nameCounter);
  }

  if (savedDesc) {
    elements.productDesc.value = savedDesc;
    state.productDesc = savedDesc;
    updateCharCount(elements.productDesc, elements.descCounter);
  }

  if (savedName || savedDesc) {
    console.log('✅ 이전 입력 데이터 복원됨');
  }

  validateForm();
}

// ========== 모드 전환 ==========

elements.ruleModeBtn.addEventListener('click', () => {
  state.aiMode = false;
  elements.ruleModeBtn.classList.add('active');
  elements.aiModeBtn.classList.remove('active');
  elements.modeDescription.textContent = '미리 정의된 템플릿을 사용합니다';
  elements.styleExamplesSection.classList.add('hidden');
  elements.templateSection.classList.remove('hidden');
});

elements.aiModeBtn.addEventListener('click', () => {
  state.aiMode = true;
  elements.aiModeBtn.classList.add('active');
  elements.ruleModeBtn.classList.remove('active');
  elements.modeDescription.textContent = 'AI가 전체 디자인을 창의적으로 생성합니다';
  elements.styleExamplesSection.classList.remove('hidden');
  elements.templateSection.classList.add('hidden');
});

// ========== 스타일 예시 관리 ==========

function loadStyleExamples() {
  state.styleExamples = getExamples();
  renderExampleGallery();
}

function renderExampleGallery() {
  const gallery = elements.exampleGallery;

  if (state.styleExamples.length === 0) {
    gallery.innerHTML = '<p class="example-count">업로드된 예시가 없습니다</p>';
    elements.styleAnalysisResult.classList.add('hidden');
    return;
  }

  gallery.innerHTML = state.styleExamples.map(ex => `
    <div class="example-item" data-id="${ex.id}">
      <img src="${ex.image}" alt="예시 ${ex.id}" />
      <button class="example-delete" data-id="${ex.id}">×</button>
    </div>
  `).join('');

  gallery.innerHTML += `<p class="example-count">${state.styleExamples.length} / 5</p>`;

  document.querySelectorAll('.example-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      deleteExample(id);
      loadStyleExamples();
      showAlert('예시가 삭제되었습니다', 'success');
    });
  });
}

elements.styleUploadArea.addEventListener('click', () => {
  elements.styleInput.click();
});

elements.styleInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);

  if (files.length === 0) return;

  let uploadedCount = 0;

  // 첫 번째 파일로 스타일 분석 수행
  if (files.length > 0) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target.result;
      showAlert('AI가 스타일을 학습하고 있습니다... 🧠', 'info');

      try {
        const analysis = await analyzeStyleImage(imageData);
        if (analysis) {
          state.styleAnalysis = analysis;
          renderStyleAnalysis(analysis);
          showAlert('스타일 학습 완료! ✨', 'success');
        }
      } catch (error) {
        console.error('스타일 분석 실패:', error);
      }
    };
    reader.readAsDataURL(files[0]);
  }

  files.forEach(file => {
    if (state.styleExamples.length >= 5) {
      if (uploadedCount === 0) showAlert('최대 5개까지만 업로드할 수 있습니다', 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showAlert('이미지 파일만 업로드 가능합니다', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      saveExample(e.target.result);
      loadStyleExamples();
      uploadedCount++;
    };
    reader.readAsDataURL(file);
  });
});

function renderStyleAnalysis(analysis) {
  const container = elements.styleTags;
  elements.styleAnalysisResult.classList.remove('hidden');

  // 심층 분석 데이터인 경우 (Design System Spec)
  if (analysis.concept) {
    const { concept, colors, typography } = analysis;

    let html = `
      <div class="style-tag">✨ ${concept.mood}</div>
    `;

    if (concept.keywords) {
      html += concept.keywords.map(k => `<div class="style-tag">#${k}</div>`).join('');
    }

    // 색상 팔레트 표시
    if (colors) {
      const colorKeys = ['primary', 'secondary', 'background', 'accent'];
      colorKeys.forEach(key => {
        if (colors[key] && colors[key].includes('#')) {
          const hexMatch = colors[key].match(/#[0-9A-Fa-f]{6}/);
          const hex = hexMatch ? hexMatch[0] : '#ccc';
          html += `<div class="style-tag color-tag" style="--tag-color: ${hex}" title="${key}: ${colors[key]}">${key}</div>`;
        }
      });
    }

    container.innerHTML = html;
    return;
  }

  // 구형 데이터 호환
  const { mood, colorPalette, keywords } = analysis;

  let html = `
    <div class="style-tag">✨ ${mood}</div>
  `;

  if (colorPalette) {
    html += colorPalette.map(color => `
      <div class="style-tag color-tag" style="--tag-color: ${color}">${color}</div>
    `).join('');
  }

  if (keywords) {
    html += keywords.map(keyword => `
      <div class="style-tag">#${keyword}</div>
    `).join('');
  }

  container.innerHTML = html;
}

// ========== 파일 업로드 (다중 지원) ==========

elements.fileUploadArea.addEventListener('click', () => {
  elements.fileInput.click();
});

elements.fileUploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  elements.fileUploadArea.classList.add('dragover');
});

elements.fileUploadArea.addEventListener('dragleave', () => {
  elements.fileUploadArea.classList.remove('dragover');
});

elements.fileUploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  elements.fileUploadArea.classList.remove('dragover');

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFileSelect(files);
  }
});

elements.fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileSelect(e.target.files);
  }
});

async function handleFileSelect(files) {
  const fileArray = Array.from(files);
  const validFiles = fileArray.filter(file => file.type.startsWith('image/'));

  if (validFiles.length === 0) {
    showAlert('이미지 파일만 업로드 가능합니다', 'error');
    return;
  }

  // 상태 초기화
  state.productImages = validFiles;
  state.productImageData = [];

  // 모든 파일 읽기
  const readPromises = validFiles.map(file => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  });

  state.productImageData = await Promise.all(readPromises);

  // 미리보기 렌더링
  renderImagePreview();

  // 업로드 영역 업데이트
  elements.fileUploadArea.innerHTML = `
    <div class="upload-icon">✅</div>
    <p class="upload-text">${validFiles.length}개 이미지 업로드 완료!</p>
    <p class="upload-hint">추가하거나 변경하려면 클릭하세요</p>
  `;

  // AI 분석 (첫 번째 이미지만 분석)
  if (state.aiMode && state.productImageData.length > 0) {
    try {
      showAlert('AI가 대표 이미지를 분석하고 있습니다...', 'info');
      state.imageAnalysis = await analyzeProductImage(state.productImageData[0]);
      console.log('이미지 분석 결과:', state.imageAnalysis);
      showAlert('이미지 분석 완료! ✨', 'success');
    } catch (error) {
      console.error('이미지 분석 실패:', error);
      showAlert('이미지 분석에 실패했습니다. 기본값을 사용합니다.', 'error');
    }
  }

  validateForm();
}

function renderImagePreview() {
  if (state.productImageData.length === 0) {
    elements.imagePreview.classList.add('hidden');
    elements.clearImagesBtn.classList.add('hidden'); // 🆕 버튼 숨김
    return;
  }

  elements.imagePreview.classList.remove('hidden');
  elements.clearImagesBtn.classList.remove('hidden'); // 🆕 버튼 표시

  if (state.productImageData.length === 1) {
    // 단일 이미지 + 삭제 버튼
    elements.imagePreview.innerHTML = `
      <div class="preview-item" style="position: relative;">
        <img src="${state.productImageData[0]}" alt="제품 이미지" />
        <button class="delete-image-btn" data-index="0" title="이미지 삭제">
          ✕
        </button>
      </div>
    `;
  } else {
    // 다중 이미지 그리드 + 각각 삭제 버튼
    const gridHtml = state.productImageData.map((src, index) => `
      <div class="preview-item" style="position: relative;">
        <img src="${src}" alt="제품 이미지 ${index + 1}" />
        <button class="delete-image-btn" data-index="${index}" title="이미지 삭제">
          ✕
        </button>
      </div>
    `).join('');

    elements.imagePreview.innerHTML = `
      <div class="image-preview-grid">
        ${gridHtml}
        <div class="preview-count">총 ${state.productImageData.length}장</div>
      </div>
    `;
  }

  // 🆕 개별 삭제 버튼 이벤트 리스너 추가
  document.querySelectorAll('.delete-image-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      deleteImageAtIndex(index);
    });
  });
}

// 🆕 개별 이미지 삭제 함수
function deleteImageAtIndex(index) {
  if (index < 0 || index >= state.productImageData.length) return;

  // 배열에서 해당 인덱스 제거
  state.productImages.splice(index, 1);
  state.productImageData.splice(index, 1);

  console.log(`🗑️ 이미지 ${index + 1} 삭제됨 (남은 이미지: ${state.productImageData.length}개)`);

  // 이미지가 모두 삭제되면 분석 결과도 초기화
  if (state.productImageData.length === 0) {
    state.imageAnalysis = null;
  }

  // 미리보기 다시 렌더링
  renderImagePreview();
  validateForm();

  showAlert(`이미지가 삭제되었습니다. (남은 이미지: ${state.productImageData.length}개)`, 'success');
}

// ========== 입력 필드 ==========

elements.productName.addEventListener('input', (e) => {
  state.productName = e.target.value;
  updateCharCount(e.target, elements.nameCounter);
  saveFormData(); // 🆕 입력 시 자동 저장
  validateForm();
});

elements.productDesc.addEventListener('input', (e) => {
  state.productDesc = e.target.value;
  updateCharCount(e.target, elements.descCounter);
  saveFormData(); // 🆕 입력 시 자동 저장
  validateForm();
});

// ========== 🆕 이미지 전체 삭제 버튼 ==========

elements.clearImagesBtn.addEventListener('click', () => {
  if (state.productImageData.length === 0) return;

  if (confirm('업로드된 이미지를 모두 삭제하시겠습니까?')) {
    state.productImages = [];
    state.productImageData = [];
    state.imageAnalysis = null;

    elements.imagePreview.innerHTML = '';
    elements.imagePreview.classList.add('hidden');
    elements.clearImagesBtn.classList.add('hidden');
    elements.fileInput.value = ''; // 파일 입력 초기화

    validateForm();
    showAlert('이미지가 모두 삭제되었습니다.', 'success');
    console.log('🗑️ 이미지 전체 삭제 완료');
  }
});

// ========== 템플릿 선택 ==========

document.querySelectorAll('.template-option').forEach(option => {
  option.addEventListener('click', () => {
    document.querySelectorAll('.template-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    option.classList.add('selected');
    state.selectedTemplate = option.dataset.template;
  });
});

function validateForm() {
  const isValid =
    state.productImageData.length > 0 &&
    state.productName.trim().length > 0 &&
    state.productDesc.trim().length > 0;

  elements.generateBtn.disabled = !isValid;

  return isValid;
}

// ========== 생성 버튼 ==========

elements.generateBtn.addEventListener('click', async () => {
  if (!validateForm()) {
    showAlert('모든 필드를 입력해주세요', 'error');
    return;
  }

  try {
    setLoading(true);

    if (state.aiMode) {
      await generateWithAI();
    } else {
      await generateWithRules();
    }

    elements.downloadBtn.classList.remove('hidden');
    elements.previewArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    console.error('생성 실패:', error);
    showAlert(error.message || '생성에 실패했습니다. 다시 시도해주세요.', 'error');
  } finally {
    setLoading(false);
  }
});

// AI로 생성
async function generateWithAI() {
  showAlert('AI가 창의적인 디자인을 생성하고 있습니다... (검수 포함, 15-20초 소요)', 'info');

  const productInfo = {
    productName: state.productName,
    description: state.productDesc,
  };

  // AI 디자인 생성 (다중 이미지 전달)
  const html = await generateAIDesign(
    productInfo,
    state.productImageData, // 배열 전달
    state.styleExamples,
    state.imageAnalysis,
    state.styleAnalysis // 스타일 분석 결과 전달
  );

  const safeHTML = makeSafeHTML(html);
  elements.previewArea.innerHTML = safeHTML;

  // 🔍 디버깅: 생성된 HTML 출력 (제목 부분 확인용)
  console.log('='.repeat(80));
  console.log('🔍 생성된 HTML (처음 3000자):');
  console.log('='.repeat(80));
  console.log(safeHTML.substring(0, 3000));
  console.log('='.repeat(80));

  state.generatedData = {
    html: safeHTML,
    productName: state.productName,
  };

  // 🆕 재생성 버튼 표시
  elements.regenerateBtn.classList.remove('hidden');

  showAlert('AI 디자인이 생성되었습니다! 🎉', 'success');
}

// 규칙 기반으로 생성 (첫 번째 이미지만 사용)
async function generateWithRules() {
  showAlert('상세페이지를 생성하고 있습니다...', 'info');

  const copywriting = generateCopywriting(state.productName, state.productDesc);
  state.generatedData = copywriting;

  const html = renderTemplate(
    state.selectedTemplate,
    copywriting,
    state.productImageData[0], // 첫 번째 이미지만 전달
    false
  );

  elements.previewArea.innerHTML = html;

  // 🆕 재생성 버튼 표시
  elements.regenerateBtn.classList.remove('hidden');

  showAlert('상세페이지가 생성되었습니다! 🎉', 'success');
}

// ========== 다운로드 버튼 ==========

elements.downloadBtn.addEventListener('click', async () => {
  if (!state.generatedData) {
    showAlert('먼저 상세페이지를 생성해주세요', 'error');
    return;
  }

  try {
    // 이미 화면에 렌더링된 previewArea를 그대로 캡처
    const targetElement = elements.previewArea;

    if (!targetElement) {
      showAlert('미리보기 영역을 찾을 수 없습니다', 'error');
      return;
    }

    console.log('다운로드 시작 - Element:', targetElement.tagName, 'Size:', targetElement.offsetWidth, 'x', targetElement.offsetHeight);
    console.log('내용 확인:', targetElement.innerHTML.substring(0, 100));

    await generateAndDownload(targetElement, state.productName, {
      format: 'jpg',
      onStart: () => {
        setLoading(true, '이미지를 생성하는 중...');
      },
      onSuccess: (filename) => {
        showAlert(`${filename}.jpg 파일이 다운로드되었습니다! 💾`, 'success');
      },
      onError: (error) => {
        console.error('상세 에러:', error);
        showAlert(`다운로드 실패: ${error.message}`, 'error');
      },
    });

  } catch (error) {
    console.error('다운로드 프로세스 실패:', error);
    showAlert('다운로드에 실패했습니다. 다시 시도해주세요.', 'error');
  } finally {
    setLoading(false);
  }
});

// ========== 🆕 재생성 버튼 ==========

elements.regenerateBtn.addEventListener('click', async () => {
  try {
    console.log('🔄 재생성 시작 - 현재 설정 사용');

    // 유효성 검사
    if (!state.productName || !state.productDesc || state.productImageData.length === 0) {
      showAlert('제품 정보가 없습니다. 다시 입력해주세요.', 'error');
      return;
    }

    setLoading(true, '같은 설정으로 재생성 중...');

    // 현재 모드에 따라 재생성
    if (state.aiMode) {
      await generateWithAI();
    } else {
      await generateWithRules();
    }

    // 다운로드 버튼 표시
    elements.downloadBtn.classList.remove('hidden');

    // 스크롤
    elements.previewArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (error) {
    console.error('재생성 실패:', error);
    showAlert(error.message || '재생성에 실패했습니다. 다시 시도해주세요.', 'error');
  } finally {
    setLoading(false);
  }
});

// ========== 유틸리티 함수 ==========

function setLoading(isLoading, text = '생성 중...') {
  if (isLoading) {
    elements.generateBtn.disabled = true;
    elements.downloadBtn.disabled = true;
    elements.btnText.innerHTML = `<span class="spinner"></span> ${text}`;
  } else {
    elements.generateBtn.disabled = !validateForm();
    elements.downloadBtn.disabled = false;
    elements.btnText.textContent = '상세페이지 생성하기';
  }
}

// 🆕 글자 수 카운터 업데이트 헬퍼
function updateCharCount(inputElement, counterElement) {
  const length = inputElement.value.length;
  const maxLength = inputElement.maxLength;

  counterElement.textContent = length;

  // 80% 넘으면 경고
  if (length >= maxLength * 0.8) {
    counterElement.parentElement.classList.add('warning');
  } else {
    counterElement.parentElement.classList.remove('warning');
  }
}

function showAlert(message, type = 'info') {
  const alertClass = `alert-${type}`;
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  };

  const alert = document.createElement('div');
  alert.className = `alert ${alertClass} fade-in`;
  alert.innerHTML = `
    <span>${icons[type] || 'ℹ️'}</span>
    <span>${message}</span>
  `;

  elements.alertArea.innerHTML = '';
  elements.alertArea.appendChild(alert);

  const timeout = type === 'error' ? 5000 : 3000;
  setTimeout(() => {
    alert.remove();
  }, timeout);
}

initializeApp();
