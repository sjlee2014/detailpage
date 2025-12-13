/**
 * 상세페이지 템플릿 V3 - 실제 상세페이지 구조 반영
 * 풍성한 디자인, 빈 섹션 숨김 처리
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
    productImages = [], // 제품 상세 이미지들
    components = [], // 구성품 [{name, qty, icon}]
    steps = [], // 만들기 단계 [{title, description, image}]
    features = [], // 제품 특징/포인트
    notices = [
      '제품 색상은 모니터에 따라 다르게 보일 수 있습니다.',
      '수공예 제품 특성상 약간의 개별 차이가 있을 수 있습니다.',
      '직사광선을 피해 서늘한 곳에 보관해주세요.',
      '3세 미만 어린이의 손에 닿지 않는 곳에 보관하세요.'
    ],
    brandLogo = null,
    primaryColor = '#6B5CE7', // 메인 컬러
    secondaryColor = '#FF6B9D' // 서브 컬러
  } = slots;

  // 빈 값 확인용 헬퍼
  const hasContent = (arr) => arr && arr.length > 0;
  const hasProductImages = hasContent(productImages);
  const hasComponents = hasContent(components);
  const hasSteps = hasContent(steps);
  const hasFeatures = hasContent(features);

  // 동적 섹션 번호 계산
  let sectionNum = 0;
  const featuresNum = hasFeatures ? ++sectionNum : 0;
  const productImagesNum = hasProductImages ? ++sectionNum : 0;
  const componentsNum = hasComponents ? ++sectionNum : 0;
  const stepsNum = hasSteps ? ++sectionNum : 0;

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${productName || '상세페이지'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
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

    /* ===== 섹션 1: 메인 타이틀 배너 (흰 배경 스타일) ===== */
    .hero-banner {
      position: relative;
      background: #ffffff;
      padding: 60px 40px;
      text-align: center;
    }

    .hero-content {
      position: relative;
      z-index: 1;
    }

    .hero-brand {
      display: block;
      margin-bottom: 20px;
    }

    .hero-brand img {
      height: 40px;
      width: auto;
    }

    .hero-title {
      font-family: 'Jalnan2', 'Noto Sans KR', sans-serif;
      font-size: 42px;
      font-weight: 900;
      margin-bottom: 16px;
      line-height: 1.3;
      letter-spacing: -1px;
    }

    .hero-title .highlight {
      color: ${primaryColor};
    }

    .hero-title .normal {
      color: #333;
    }

    .hero-subtitle {
      font-size: 16px;
      color: #666;
      font-weight: 400;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.6;
    }

    /* ===== 메인 히어로 이미지 (상단에 먼저 표시) ===== */
    .hero-image-section {
      position: relative;
      padding: 40px 40px 0;
      background: #ffffff;
    }

    .hero-image-wrapper {
      background: white;
      border-radius: 24px;
      padding: 16px;
      box-shadow: 0 30px 80px rgba(0,0,0,0.15);
    }

    .hero-image-wrapper img {
      width: 100%;
      border-radius: 16px;
      display: block;
    }

    /* 대표 이미지와 상세 이미지 사이 웨이브 구분선 */
    .wave-divider {
      position: relative;
      height: 80px;
      background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
      overflow: hidden;
    }

    .wave-divider::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: white;
      border-radius: 0 0 50% 50%;
    }

    /* ===== 섹션 2: 제품 포인트/특징 ===== */
    .features-section {
      padding: 80px 40px 60px;
      background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .feature-card {
      background: white;
      border-radius: 20px;
      padding: 32px 24px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(107, 92, 231, 0.1);
      border: 2px solid transparent;
      transition: all 0.3s ease;
    }

    .feature-card:hover {
      border-color: ${primaryColor};
      transform: translateY(-5px);
    }

    .feature-icon {
      width: 72px;
      height: 72px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
    }

    .feature-title {
      font-size: 18px;
      font-weight: 700;
      color: #333;
      margin-bottom: 8px;
    }

    .feature-desc {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
    }

    /* ===== 섹션 3: 제품 상세 이미지 ===== */
    .product-images-section {
      padding: 60px 60px;
    }

    .product-image-full {
      width: 100%;
      display: block;
      border-radius: 16px;
    }

    .product-image-container {
      margin-bottom: 24px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .product-image-caption {
      text-align: center;
      padding: 24px 40px;
      font-size: 24px;
      font-weight: 600;
      color: #333;
      line-height: 1.8;
      background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
    }

    /* ===== 섹션 헤더 (공통) ===== */
    .section-header {
      text-align: center;
      margin-bottom: 50px;
      padding: 0 40px;
    }

    .section-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      border-radius: 50%;
      color: white;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .section-title {
      font-family: 'Jalnan2', 'Noto Sans KR', sans-serif;
      font-size: 32px;
      font-weight: 800;
      color: #222;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }

    .section-subtitle {
      font-size: 16px;
      color: #888;
    }

    /* ===== 섹션 4: 구성품 안내 ===== */
    .components-section {
      padding: 80px 40px;
      background: linear-gradient(135deg, #fafbff 0%, #f5f0ff 100%);
    }

    .components-table {
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 50px rgba(0,0,0,0.08);
    }

    .component-row {
      display: flex;
      align-items: center;
      padding: 24px 32px;
      border-bottom: 1px solid #f0f0f0;
      transition: background 0.2s;
    }

    .component-row:last-child {
      border-bottom: none;
    }

    .component-row:hover {
      background: #fafbff;
    }

    .component-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin-right: 20px;
    }

    .component-info {
      flex: 1;
    }

    .component-name {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .component-desc {
      font-size: 14px;
      color: #888;
      margin-top: 4px;
    }

    .component-qty {
      font-size: 16px;
      font-weight: 700;
      color: ${primaryColor};
      background: ${primaryColor}10;
      padding: 8px 20px;
      border-radius: 50px;
    }

    /* ===== 섹션 5: 만들기 순서 ===== */
    .steps-section {
      padding: 80px 40px;
      background: #ffffff;
    }

    .step-card {
      display: flex;
      gap: 40px;
      margin-bottom: 48px;
      padding: 40px;
      background: linear-gradient(135deg, #ffffff, #fafbff);
      border-radius: 28px;
      box-shadow: 0 15px 50px rgba(0,0,0,0.06);
      align-items: center;
    }

    .step-card:nth-child(even) {
      flex-direction: row-reverse;
    }

    .step-image-wrapper {
      flex: 0 0 320px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .step-image-wrapper img {
      width: 100%;
      height: 240px;
      object-fit: cover;
      display: block;
    }

    .step-content {
      flex: 1;
    }

    .step-number-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      color: white;
      padding: 8px 20px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .step-title {
      font-family: 'Jalnan2', 'Noto Sans KR', sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: #222;
      margin-bottom: 16px;
      line-height: 1.4;
    }

    .step-description {
      font-size: 16px;
      color: #555;
      line-height: 1.8;
    }

    .step-tip {
      margin-top: 20px;
      padding: 16px 20px;
      background: ${primaryColor}08;
      border-left: 4px solid ${primaryColor};
      border-radius: 0 12px 12px 0;
      font-size: 14px;
      color: #555;
    }

    .step-tip strong {
      color: ${primaryColor};
    }

    /* ===== 섹션 6: 주의사항 ===== */
    .notice-section {
      padding: 60px 40px;
      background: linear-gradient(135deg, #f8f9fa 0%, #eef0f5 100%);
    }

    .notice-box {
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.05);
    }

    .notice-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 700;
      color: #333;
      margin-bottom: 24px;
    }

    .notice-title .icon {
      width: 36px;
      height: 36px;
      background: #fff3cd;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .notice-list {
      list-style: none;
    }

    .notice-list li {
      position: relative;
      padding: 12px 0 12px 28px;
      font-size: 15px;
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
      font-size: 14px;
    }

    /* ===== 푸터 ===== */
    .page-footer {
      padding: 40px;
      text-align: center;
      background: #fafafa;
      border-top: 1px solid #eee;
    }

    .footer-logo {
      height: 40px;
      margin-bottom: 12px;
    }

    .footer-text {
      font-size: 13px;
      color: #999;
    }

    /* ===== 이미지 플레이스홀더 ===== */
    .image-placeholder {
      background: linear-gradient(135deg, #f0f0f5, #e8e8f0);
      border: 3px dashed #ccc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 16px;
      min-height: 300px;
      border-radius: 16px;
    }

    .image-placeholder .icon {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.5;
    }
  </style>
</head>
<body>
  <div class="detail-page">
    
    <!-- 히어로 이미지 (맨 위에 먼저 표시) -->
    ${heroImage ? `
    <div class="hero-image-section">
      <div class="hero-image-wrapper">
        <img src="${heroImage}" alt="${productName}" />
      </div>
    </div>
    ` : ''}

    <!-- 섹션 1: 히어로 배너 (흰 배경 + 테마색 제목) -->
    ${productName ? `
    <section class="hero-banner">
      <div class="hero-content">
        <div class="hero-brand">
          <img src="/image/프리송컴퍼니 브랜드로고.png" alt="몹글샵" />
        </div>
        <h1 class="hero-title">
          <span class="highlight">${productName.split(' ')[0]}</span>
          <span class="normal"> ${productName.split(' ').slice(1).join(' ')}</span>
        </h1>
        ${subtitle ? `<p class="hero-subtitle">${subtitle}</p>` : ''}
      </div>
    </section>
    ` : ''}

    <!-- 웨이브 구분선 -->
    <div class="wave-divider"></div>

    <!-- 섹션 2: 제품 특징 -->
    ${hasFeatures ? `
    <section class="features-section">
      <div class="features-grid">
        ${features.map(f => `
          <div class="feature-card">
            <div class="feature-icon">${f.icon || '✨'}</div>
            <h3 class="feature-title">${f.title}</h3>
            <p class="feature-desc">${f.desc || ''}</p>
          </div>
        `).join('')}
      </div>
    </section>
    ` : ''}

    <!-- 섹션 3: 제품 상세 이미지들 -->
    ${hasProductImages ? `
    <section class="product-images-section">
      ${productImages.map(item => {
    const imgSrc = typeof item === 'string' ? item : item.image;
    const caption = typeof item === 'object' ? item.caption : '';
    return imgSrc ? `
          <div class="product-image-container">
            <img src="${imgSrc}" alt="제품 상세" class="product-image-full" />
            ${caption ? `<p class="product-image-caption">${caption}</p>` : ''}
          </div>
        ` : '';
  }).join('')}
    </section>
    ` : ''}

    <!-- 섹션: 구성품 안내 -->
    ${hasComponents ? `
    <section class="components-section">
      <div class="section-header">
        <div class="section-number">${componentsNum}</div>
        <h2 class="section-title">구성품 안내</h2>
        <p class="section-subtitle">세트에 포함된 모든 재료와 도구를 확인하세요</p>
      </div>
      <div class="components-table">
        ${components.map(comp => `
          <div class="component-row">
            <div class="component-icon">${comp.icon || '📦'}</div>
            <div class="component-info">
              <div class="component-name">${comp.name}</div>
              ${comp.desc ? `<div class="component-desc">${comp.desc}</div>` : ''}
            </div>
            ${comp.qty ? `<div class="component-qty">${comp.qty}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
    ` : ''}

    <!-- 섹션: 만들기 순서 -->
    ${hasSteps ? `
    <section class="steps-section">
      <div class="section-header">
        <div class="section-number">${stepsNum}</div>
        <h2 class="section-title">만들기 순서</h2>
        <p class="section-subtitle">차근차근 따라하면 누구나 쉽게 완성!</p>
      </div>
      ${steps.map((step, i) => `
        <div class="step-card">
          ${step.image ? `
          <div class="step-image-wrapper">
            <img src="${step.image}" alt="Step ${i + 1}" />
          </div>
          ` : ''}
          <div class="step-content">
            <div class="step-number-badge">
              <span>STEP</span>
              <strong>${String(i + 1).padStart(2, '0')}</strong>
            </div>
            <h3 class="step-title">${step.title}</h3>
            <p class="step-description">${step.description}</p>
            ${step.tip ? `
            <div class="step-tip">
              <strong>💡 TIP:</strong> ${step.tip}
            </div>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </section>
    ` : ''}

    <!-- 섹션 6: 주의사항 -->
    <section class="notice-section">
      <div class="notice-box">
        <h3 class="notice-title">
          <span class="icon">⚠️</span>
          구매 전 꼭 확인해주세요
        </h3>
        <ul class="notice-list">
          ${notices.map(n => `<li>${n}</li>`).join('')}
        </ul>
      </div>
    </section>

    <!-- 푸터 -->
    ${brandLogo ? `
    <footer class="page-footer">
      <img src="${brandLogo}" alt="브랜드 로고" class="footer-logo" />
      <p class="footer-text">© 2024 All Rights Reserved</p>
    </footer>
    ` : ''}

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
    subtitle: '부제목을 입력하세요',
    features: []
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
