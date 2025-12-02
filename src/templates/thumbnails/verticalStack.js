/**
 * Template 3: Vertical Stack (상하 분할)
 * 상단 텍스트 + 하단 이미지 그리드 - 여러 제품을 보여주기 좋음
 */

export function generateVerticalStack(params) {
  const { productName, tagline, images, colors, decoration } = params;

  // 배경색 기본값 설정 (gradient는 sanitizeCSS에서 제거되므로 단색 사용)
  const bgColor = colors.bgColor || 'rgb(255, 248, 240)';
  const accentColor = colors.accentColor || 'rgb(255, 180, 0)';

  // 제품명을 단어별로 분할하여 색상 적용
  const words = productName.split(' ');
  const coloredTitle = words.map((word, i) =>
    `<span style="color: ${colors.titleColors[i % colors.titleColors.length]};">${word}</span>`
  ).join(' ');

  // 이미지 그리드 (최대 6개, 2행 3열)
  const imageElements = images.slice(0, 6).map((img, i) => `
    <div style="
      flex: 0 0 calc(33.333% - 20px);
      max-width: 200px;
    ">
      <img src="${img}" alt="제품 이미지 ${i + 1}" style="
        width: 100%;
        height: 180px;
        object-fit: cover;
        border-radius: 12px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      " />
    </div>
  `).join('');

  // 장식 요소 (파도)
  let decorationHTML = '';
  if (decoration === 'waves') {
    decorationHTML = `
      <svg style="position: absolute; bottom: 350px; left: 0; width: 100%; height: 100px; z-index: 1;" 
           viewBox="0 0 1200 100" preserveAspectRatio="none">
        <path d="M0,50 Q300,20 600,50 T1200,50 L1200,100 L0,100 Z" 
              fill="${accentColor}" opacity="0.1"/>
      </svg>
    `;
  }

  return `
    <div style="
      width: 100%; 
      min-height: 650px; 
      background: ${bgColor};
      display: flex;
      flex-direction: column;
      padding: 60px;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      border-bottom: 5px solid ${accentColor};
    ">
      ${decorationHTML}
      
      <!-- 상단: 텍스트 영역 -->
      <div style="
        text-align: center;
        padding: 40px 0 60px 0;
        z-index: 2;
      ">
        <div style="
          font-size: 72px; 
          font-weight: 900; 
          line-height: 1.1; 
          margin-bottom: 20px;
          font-family: 'Noto Sans KR', sans-serif;
        ">
          ${coloredTitle}
        </div>
        <p style="
          font-size: 20px; 
          color: rgb(70, 70, 70); 
          line-height: 1.7;
          max-width: 600px;
          margin: 0 auto;
        ">
          ${tagline}
        </p>
      </div>
      
      <!-- 하단: 이미지 그리드 -->
      <div style="
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 30px;
        z-index: 2;
      ">
        ${imageElements}
      </div>
    </div>
  `;
}

