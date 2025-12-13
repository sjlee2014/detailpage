/**
 * 상세페이지 템플릿 V4 - 참고 이미지 스타일
 * 손글씨 영문 섹션 제목, 섹션 토글, 그리드 설정 지원
 */

/**
 * 메인 템플릿 생성 함수
 * @param {Object} slots - 슬롯 데이터
 * @returns {string} 완성된 HTML
 */
export function generateDetailPage(slots) {
  const {
    productName = '',
    subtitle = '',
    heroImage = null,
    options = [], // 옵션들 [{image, name}]
    productImages = [], // 상세 이미지들 [{image, caption}]
    components = [], // 구성품 [{name, qty, icon, image}]
    componentDesc = '', // 구성품 공통 설명
    steps = [], // 만들기 단계 [{title, description, image}]
    sizeInfo = { text: '', image: null }, // 사이즈 정보
    notices = [
      '제품 색상은 모니터에 따라 다르게 보일 수 있습니다.',
      '수공예 제품 특성상 약간의 개별 차이가 있을 수 있습니다.'
    ],
    primaryColor = '#6B5CE7',
    secondaryColor = '#FF6B9D',
    // 섹션 토글
    sectionToggles = {
      option: true,
      component: true,
      detail: true,
      size: true,
      steps: true,
      notice: true
    },
    // 그리드 설정
    gridColumns = {
      option: 2,
      component: 3,
      detail: 1
    }
  } = slots;

  // 빈 값 확인용 헬퍼
  const hasContent = (arr) => arr && arr.length > 0;
  const showOption = sectionToggles.option && hasContent(options);
  const showComponent = sectionToggles.component && hasContent(components);
  const showDetail = sectionToggles.detail && hasContent(productImages);
  const showSteps = sectionToggles.steps && hasContent(steps);
  const showSize = sectionToggles.size && (sizeInfo.text || sizeInfo.image);
  const showNotice = sectionToggles.notice && hasContent(notices);

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${productName || '상세페이지'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&family=Pacifico&display=swap" rel="stylesheet">
  <style>
    /* ===== 커스텀 폰트 ===== */
    @font-face {
      font-family: 'Jalnan2';
      src: url('/font/Jalnan2TTF.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }

    /* ===== 기본 리셋 ===== */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Jalnan2', 'Noto Sans KR', -apple-system, sans-serif;
      background: #ffffff;
      color: #333;
      line-height: 1.6;
    }

    .detail-page {
      width: 860px;
      max-width: 100%;
      margin: 0 auto;
      background: #ffffff;
    }

    /* ===== 히어로 이미지 섹션 ===== */
    .hero-image-section {
      padding: 0;
      background: #ffffff;
    }

    .hero-image-wrapper {
      border-radius: 0;
      overflow: hidden;
    }

    .hero-image-wrapper img {
      width: 100%;
      display: block;
    }

    /* ===== 히어로 배너 (제품명) ===== */
    .hero-banner {
      background: #ffffff;
      padding: 40px 40px 30px;
      text-align: center;
    }

    .hero-brand {
      display: block;
      margin-bottom: 16px;
    }

    .hero-brand img {
      height: 80px;
      width: auto;
    }

    .hero-title {
      font-family: 'Jalnan2', 'Noto Sans KR', sans-serif;
      font-size: 36px;
      font-weight: 900;
      margin-bottom: 12px;
      line-height: 1.4;
    }

    .hero-title .highlight {
      color: ${primaryColor};
    }

    .hero-title .normal {
      color: #333;
    }

    .hero-subtitle {
      font-size: 15px;
      color: #666;
      font-weight: 400;
      line-height: 1.7;
    }

    /* ===== 손글씨 스타일 섹션 제목 ===== */
    .section-title-script {
      font-family: 'Pacifico', cursive;
      font-size: 42px;
      color: ${primaryColor};
      text-align: center;
      margin-bottom: 30px;
      font-weight: 400;
    }

    /* ===== Option 섹션 ===== */
    .option-section {
      padding: 50px 40px;
      background: linear-gradient(180deg, #FFF9E6 0%, #ffffff 100%);
    }

    .option-grid {
      display: grid;
      grid-template-columns: repeat(${gridColumns.option || 2}, 1fr);
      gap: 20px;
    }

    .option-card {
      text-align: center;
    }

    .option-image {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      border-radius: 16px;
      margin-bottom: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    }

    .option-name {
      font-size: 16px;
      color: #333;
      font-weight: 600;
    }

    /* ===== Component 섹션 ===== */
    .component-section {
      padding: 50px 40px;
      background: #ffffff;
    }

    .component-grid {
      display: grid;
      grid-template-columns: repeat(${gridColumns.component || 3}, 1fr);
      gap: 20px;
    }

    .component-card {
      text-align: center;
    }

    .component-image {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      border-radius: 50%;
      margin-bottom: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08);
      background: #f5f5f5;
    }

    .component-name {
      font-size: 14px;
      color: #333;
      font-weight: 600;
    }

    .component-qty {
      font-size: 13px;
      color: ${primaryColor};
      font-weight: 500;
      margin-top: 4px;
    }

    /* ===== Detail 섹션 ===== */
    .detail-section {
      padding: 50px 40px;
      background: linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%);
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(${gridColumns.detail || 1}, 1fr);
      gap: 24px;
    }

    .detail-image {
      width: 100%;
      border-radius: 16px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.1);
    }

    .detail-caption {
      text-align: center;
      margin-top: 16px;
      font-size: 15px;
      color: #555;
      line-height: 1.7;
    }

    /* ===== Size 섹션 ===== */
    .size-section {
      padding: 50px 40px;
      background: #ffffff;
      text-align: center;
    }

    .size-content {
      max-width: 500px;
      margin: 0 auto;
    }

    .size-image {
      width: 100%;
      border-radius: 16px;
      margin-bottom: 20px;
    }

    .size-text {
      font-size: 18px;
      color: #333;
      font-weight: 600;
      background: linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15);
      padding: 20px;
      border-radius: 12px;
    }

    /* ===== Steps 섹션 ===== */
    .steps-section {
      padding: 50px 40px;
      background: linear-gradient(180deg, #f0f8ff 0%, #ffffff 100%);
    }

    .step-card {
      display: flex;
      gap: 30px;
      margin-bottom: 40px;
      padding: 30px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.06);
      align-items: center;
    }

    .step-card:nth-child(even) {
      flex-direction: row-reverse;
    }

    .step-image-wrapper {
      flex: 0 0 280px;
      border-radius: 16px;
      overflow: hidden;
    }

    .step-image-wrapper img {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .step-content {
      flex: 1;
    }

    .step-badge {
      display: inline-block;
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      color: white;
      padding: 10px 24px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 16px;
      letter-spacing: 1px;
    }

    .step-title {
      font-size: 24px;
      font-weight: 700;
      color: #222;
      margin-bottom: 12px;
    }

    .step-description {
      font-size: 14px;
      color: #555;
      line-height: 1.7;
    }

    /* ===== Notice 섹션 ===== */
    .notice-section {
      padding: 50px 40px;
      background: #f8f9fa;
    }

    .notice-box {
      background: white;
      border-radius: 16px;
      padding: 30px;
    }

    .notice-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      font-weight: 700;
      color: #333;
      margin-bottom: 20px;
    }

    .notice-list {
      list-style: none;
    }

    .notice-list li {
      position: relative;
      padding: 10px 0 10px 24px;
      font-size: 14px;
      color: #555;
      border-bottom: 1px dashed #e0e0e0;
    }

    .notice-list li:last-child {
      border-bottom: none;
    }

    .notice-list li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: ${primaryColor};
      font-weight: bold;
    }

    /* ===== Footer ===== */
    .page-footer {
      padding: 40px;
      text-align: center;
      background: #fafafa;
    }

    .footer-logo img {
      height: 100px;
    }
  </style>
</head>
<body>
  <div class="detail-page">
    
    <!-- 히어로 이미지 -->
    ${heroImage ? `
    <div class="hero-image-section">
      <div class="hero-image-wrapper">
        <img src="${heroImage}" alt="${productName}" />
      </div>
    </div>
    ` : ''}

    <!-- 히어로 배너 -->
    ${productName ? `
    <section class="hero-banner">
      <h1 class="hero-title">
        <span class="highlight">${productName.split(' ')[0]}</span>
        <span class="normal"> ${productName.split(' ').slice(1).join(' ')}</span>
      </h1>
      ${subtitle ? `<p class="hero-subtitle">${subtitle}</p>` : ''}
    </section>
    ` : ''}

    <!-- Option 섹션 -->
    ${showOption ? `
    <section class="option-section">
      <h2 class="section-title-script">Option</h2>
      <div class="option-grid">
        ${options.map(opt => `
          <div class="option-card">
            ${opt.image ? `<img src="${opt.image}" alt="${opt.name}" class="option-image" />` : ''}
            <div class="option-name">${opt.name || ''}</div>
          </div>
        `).join('')}
      </div>
    </section>
    ` : ''}

    <!-- Component 섹션 -->
    ${showComponent ? `
    <section class="component-section">
      <h2 class="section-title-script">Component</h2>
      ${slots.componentDesc ? `<p style="text-align:center;color:#666;margin-bottom:24px;font-size:15px;">${slots.componentDesc}</p>` : ''}
      <div class="component-grid">
        ${components.map(comp => `
          <div class="component-card">
            ${comp.image ? `<img src="${comp.image}" alt="${comp.name}" class="component-image" />` :
      `<div class="component-image" style="display:flex;align-items:center;justify-content:center;font-size:32px;">${comp.icon || '📦'}</div>`}
            <div class="component-name">${comp.name || ''}</div>
            ${comp.qty ? `<div class="component-qty">${comp.qty}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
    ` : ''}

    <!-- Detail 섹션 -->
    ${showDetail ? `
    <section class="detail-section">
      <h2 class="section-title-script">Detail</h2>
      <div class="detail-grid">
        ${productImages.map(item => {
        const imgSrc = typeof item === 'string' ? item : item.image;
        const caption = typeof item === 'object' ? item.caption : '';
        return imgSrc ? `
          <div class="detail-item">
            <img src="${imgSrc}" alt="상세 이미지" class="detail-image" />
            ${caption ? `<p class="detail-caption">${caption}</p>` : ''}
          </div>
          ` : '';
      }).join('')}
      </div>
    </section>
    ` : ''}

    <!-- Size 섹션 -->
    ${showSize ? `
    <section class="size-section">
      <h2 class="section-title-script">Size</h2>
      <div class="size-content">
        ${sizeInfo.image ? `<img src="${sizeInfo.image}" alt="사이즈" class="size-image" />` : ''}
        ${sizeInfo.text ? `<div class="size-text">${sizeInfo.text}</div>` : ''}
      </div>
    </section>
    ` : ''}

    <!-- Steps 섹션 -->
    ${showSteps ? `
    <section class="steps-section">
      <h2 class="section-title-script">How to Make?</h2>
      ${steps.map((step, i) => `
        <div class="step-card">
          ${step.image ? `
          <div class="step-image-wrapper">
            <img src="${step.image}" alt="Step ${i + 1}" />
          </div>
          ` : ''}
          <div class="step-content">
            <span class="step-badge">STEP ${String(i + 1).padStart(2, '0')}</span>
            <h3 class="step-title">${step.title || ''}</h3>
            <p class="step-description">${step.description || ''}</p>
          </div>
        </div>
      `).join('')}
    </section>
    ` : ''}

    <!-- Notice 섹션 -->
    ${showNotice ? `
    <section class="notice-section">
      <div class="notice-box">
        <h3 class="notice-title">
          <span>⚠️</span>
          구매 전 꼭 확인해주세요
        </h3>
        <ul class="notice-list">
          ${notices.map(n => `<li>${n}</li>`).join('')}
        </ul>
      </div>
    </section>
    ` : ''}

    <!-- Footer -->
    <footer class="page-footer">
      <div class="footer-logo">
        <img src="/brand-logo.png" alt="몽글샵" />
      </div>
    </footer>

  </div>
</body>
</html>
  `.trim();
}

/**
 * 빈 슬롯으로 템플릿 미리보기 생성
 */
export function getEmptyTemplate() {
  return generateDetailPage({
    productName: '제품명을 입력하세요',
    subtitle: '부제목을 입력하세요'
  });
}

/**
 * 테마 프리셋
 */
export const themes = {
  purple: { primary: '#6B5CE7', secondary: '#FF6B9D', name: '퍼플 핑크' },
  blue: { primary: '#4A90D9', secondary: '#67D5FF', name: '스카이 블루' },
  green: { primary: '#2ECC71', secondary: '#A8E063', name: '프레시 그린' },
  orange: { primary: '#FF6B35', secondary: '#FFB347', name: '선셋 오렌지' },
  pink: { primary: '#FF69B4', secondary: '#FFB6C1', name: '로맨틱 핑크' }
};

export default {
  generateDetailPage,
  getEmptyTemplate,
  themes
};
