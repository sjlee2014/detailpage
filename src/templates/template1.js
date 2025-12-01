/**
 * 템플릿 1: 귀여운 일러스트 스타일
 * 업로드된 샘플 이미지 스타일을 참고한 템플릿
 */

/**
 * 템플릿 렌더링
 * @param {Object} data - 제품 데이터 및 카피라이팅
 * @param {string} productImage - 제품 이미지 base64 또는 URL
 * @returns {string} HTML 문자열
 */
export function renderCuteTemplate(data, productImage) {
  const {
    productName,
    mainCopy,
    subCopy,
    features,
    detailedDescription,
    recommendation,
  } = data;

  return `
    <div class="template-cute" style="
      width: 800px;
      background: linear-gradient(180deg, #e0f2fe 0%, #ddd6fe 50%, #fce7f3 100%);
      font-family: 'Noto Sans KR', sans-serif;
      padding: 0;
      position: relative;
    ">
      <!-- 상단 웨이브 장식 -->
      <div style="
        width: 100%;
        height: 80px;
        background: linear-gradient(135deg, #93c5fd, #6ee7b7);
        border-radius: 0 0 50% 50%;
        position: relative;
      "></div>
      
      <!-- 메인 타이틀 섹션 -->
      <div style="
        text-align: center;
        padding: 40px 60px 30px;
      ">
        <h1 style="
          font-size: 42px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 20px 0;
          line-height: 1.3;
        ">${productName}</h1>
        
        <p style="
          font-size: 22px;
          color: #475569;
          margin: 0;
          font-weight: 500;
          line-height: 1.5;
        ">${mainCopy}</p>
      </div>
      
      <!-- 제품 이미지 섹션 -->
      <div style="
        display: flex;
        justify-content: center;
        padding: 30px 60px;
      ">
        <div style="
          width: 400px;
          height: 400px;
          border-radius: 50%;
          overflow: hidden;
          border: 12px solid white;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          background: white;
        ">
          <img src="${productImage}" alt="${productName}" style="
            width: 100%;
            height: 100%;
            object-fit: cover;
          " />
        </div>
      </div>
      
      <!-- 서브 카피 -->
      <div style="
        text-align: center;
        padding: 20px 60px 40px;
      ">
        <p style="
          font-size: 20px;
          color: #64748b;
          margin: 0;
          line-height: 1.6;
        ">${subCopy}</p>
      </div>
      
      <!-- 구분선 (손그림 느낌) -->
      <div style="
        width: 600px;
        height: 3px;
        background: linear-gradient(90deg, transparent, #cbd5e1, transparent);
        margin: 0 auto 40px;
        border-radius: 10px;
      "></div>
      
      <!-- 특징 섹션 -->
      <div style="
        padding: 20px 60px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
      ">
        ${features.map(feature => `
          <div style="
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            text-align: center;
          ">
            <div style="
              font-size: 48px;
              margin-bottom: 12px;
            ">${feature.icon}</div>
            <h3 style="
              font-size: 20px;
              font-weight: 600;
              color: #1e293b;
              margin: 0 0 8px 0;
            ">${feature.title}</h3>
            <p style="
              font-size: 15px;
              color: #64748b;
              margin: 0;
              line-height: 1.5;
            ">${feature.text}</p>
          </div>
        `).join('')}
      </div>
      
      <!-- 구분선 -->
      <div style="
        width: 600px;
        height: 3px;
        background: linear-gradient(90deg, transparent, #cbd5e1, transparent);
        margin: 40px auto;
        border-radius: 10px;
      "></div>
      
      <!-- 상세 설명 섹션 -->
      <div style="
        background: white;
        border-radius: 30px;
        padding: 50px 60px;
        margin: 0 60px 40px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      ">
        <h2 style="
          font-size: 28px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 24px 0;
          text-align: center;
        ">상품 상세 정보</h2>
        
        <p style="
          font-size: 18px;
          color: #475569;
          line-height: 1.8;
          margin: 0 0 24px 0;
          text-align: center;
        ">${detailedDescription}</p>
        
        <div style="
          background: linear-gradient(135deg, #fef3c7, #fde047);
          border-radius: 16px;
          padding: 20px 30px;
          text-align: center;
          margin-top: 30px;
        ">
          <p style="
            font-size: 18px;
            font-weight: 600;
            color: #854d0e;
            margin: 0;
          ">💡 ${recommendation}</p>
        </div>
      </div>
      
      <!-- 주의사항 섹션 -->
      <div style="
        background: #fff3cd;
        border-left: 5px solid #ffc107;
        border-radius: 12px;
        padding: 30px 40px;
        margin: 40px 60px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      ">
        <h3 style="
          font-size: 22px;
          font-weight: 600;
          color: #856404;
          margin: 0 0 16px 0;
        ">⚠️ ${data.cautionTitle || '주의사항'}</h3>
        <p style="
          font-size: 16px;
          color: #856404;
          line-height: 1.6;
          margin: 0;
          white-space: pre-line;
        ">${data.caution || '상품을 사용하기 전에 제품 라벨 및 사용 설명서를 반드시 확인하세요.\\n알레르기가 있으신 분은 성분을 꼭 확인해 주세요.'}</p>
      </div>
      
      <!-- 하단 웨이브 장식 -->
      <div style="
        width: 100%;
        height: 80px;
        background: linear-gradient(135deg, #a78bfa, #ec4899);
        border-radius: 50% 50% 0 0;
        margin-top: 40px;
      "></div>
      
      <!-- 브랜드 로고 영역 -->
      <div style="
        text-align: center;
        padding: 40px 60px 50px;
        background: #f1f5f9;
      ">
        <img src="/brand-logo.png" alt="Monggle Shop" style="
          max-width: 300px;
          height: auto;
        " />
      </div>
    </div>
  `;
}

/**
 * 템플릿 미리보기용 축소 버전
 */
export function renderCuteTemplatePreview(data, productImage) {
  // 실제 템플릿과 동일하지만 크기를 조정
  const fullTemplate = renderCuteTemplate(data, productImage);

  return `
    <div style="transform: scale(0.4); transform-origin: top center;">
      ${fullTemplate}
    </div>
  `;
}
