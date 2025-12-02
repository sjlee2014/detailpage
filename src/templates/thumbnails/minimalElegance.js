/**
 * Template 5: Minimal Elegance (미니멀 우아함)
 * 고급스럽고 세련된 느낌 - 여백 많은 중앙 정렬 + 단일 제품 이미지
 */

export function generateMinimalElegance(params) {
  const { productName, tagline, images, colors, decoration } = params;

  // 배경색 기본값 설정
  const bgColor = colors.bgColor || 'rgb(255, 255, 255)';
  const accentColor = colors.accentColor || 'rgb(200, 200, 200)';

  // 제품명을 단어별로 분할하여 색상 적용
  const words = productName.split(' ');
  const coloredTitle = words.map((word, i) =>
    `<span style="color: ${colors.titleColors[i % colors.titleColors.length]};">${word}</span>`
  ).join(' ');

  // 메인 이미지 (첫 번째 이미지만 사용)
  const mainImage = images[0] || '';

  return `
    <div style="
      width: 100%; 
      min-height: 650px; 
      background: ${bgColor};
      border-bottom: 3px solid ${accentColor};
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 100px 80px;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    ">
      <!-- 은은한 라인 장식 -->
      <div style="
        position: absolute;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        width: 100px;
        height: 3px;
        background: ${accentColor};
        opacity: 0.3;
      "></div>
      
      <div style="
        position: absolute;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        width: 100px;
        height: 3px;
        background: ${accentColor};
        opacity: 0.3;
      "></div>
      
      <!-- 텍스트 -->
      <div style="
        text-align: center;
        margin-bottom: 50px;
        max-width: 600px;
      ">
        <div style="
          font-size: 64px; 
          font-weight: 300; 
          line-height: 1.2; 
          margin-bottom: 20px;
          font-family: 'Noto Sans KR', sans-serif;
          letter-spacing: -1px;
        ">
          ${coloredTitle}
        </div>
        <p style="
          font-size: 18px; 
          color: rgb(100, 100, 100); 
          line-height: 1.8;
          font-weight: 300;
        ">
          ${tagline}
        </p>
      </div>
      
      <!-- 메인 이미지 -->
      <div style="
        position: relative;
      ">
        <img src="${mainImage}" alt="제품 이미지" style="
          max-width: 400px;
          max-height: 400px;
          object-fit: contain;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
          border-radius: 8px;
        " />
        
        <!-- 이미지 주변 은은한 테두리 -->
        <div style="
          position: absolute;
          top: -15px;
          left: -15px;
          right: -15px;
          bottom: -15px;
          border: 1px solid ${accentColor};
          opacity: 0.2;
          border-radius: 12px;
        "></div>
      </div>
    </div>
  `;
}
