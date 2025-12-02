/**
 * Template 2: Center Hero (중앙 정렬)
 * 깔끔하고 모던한 느낌 - 중앙 제품명 + 주변 원형 이미지 배치
 */

export function generateCenterHero(params) {
  const { productName, tagline, images, colors, decoration } = params;

  // 배경색 기본값 설정
  const bgColor = colors.bgColor || 'rgb(245, 250, 255)';
  const accentColor = colors.accentColor || 'rgb(33, 150, 243)';

  // 제품명을 단어별로 분할하여 색상 적용
  const words = productName.split(' ');
  const coloredTitle = words.map((word, i) =>
    `<span style="color: ${colors.titleColors[i % colors.titleColors.length]};">${word}</span>`
  ).join(' ');

  // 이미지를 원형으로 배치 (최대 6개)
  const imageElements = images.slice(0, 6).map((img, i) => {
    const angle = (360 / Math.min(images.length, 6)) * i;
    const radius = 220;
    const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
    const y = Math.sin((angle - 90) * Math.PI / 180) * radius;

    return `
      <div style="
        position: absolute;
        left: calc(50% + ${x}px);
        top: calc(50% + ${y}px);
        transform: translate(-50%, -50%);
      ">
        <img src="${img}" alt="제품 이미지 ${i + 1}" style="
          width: 140px;
          height: 140px;
          border-radius: 50%;
          object-fit: cover;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          border: 4px solid white;
        " />
      </div>
    `;
  }).join('');

  // 장식 요소
  let decorationHTML = '';
  if (decoration === 'geometric') {
    decorationHTML = `
      <div style="position: absolute; top: 50px; left: 50px; width: 100px; height: 100px; 
                  border: 3px solid ${accentColor}; opacity: 0.3; transform: rotate(45deg);"></div>
      <div style="position: absolute; bottom: 50px; right: 50px; width: 80px; height: 80px; 
                  border: 3px solid ${accentColor}; opacity: 0.3; border-radius: 50%;"></div>
    `;
  }

  return `
    <div style="
      width: 100%; 
      min-height: 650px; 
      background: ${bgColor};
      border-bottom: 5px solid ${accentColor};
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 80px 60px;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    ">
      ${decorationHTML}
      
      <!-- 중앙 원형 배경 -->
      <div style="
        position: absolute;
        width: 400px;
        height: 400px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        z-index: 1;
      "></div>
      
      <!-- 이미지들 (원형 배치) -->
      <div style="position: relative; width: 600px; height: 600px; z-index: 2;">
        ${imageElements}
      </div>
      
      <!-- 중앙 텍스트 -->
      <div style="
        position: absolute;
        text-align: center;
        z-index: 3;
      ">
        <div style="
          font-size: 64px; 
          font-weight: 900; 
          line-height: 1.2; 
          margin-bottom: 16px;
          font-family: 'Noto Sans KR', sans-serif;
        ">
          ${coloredTitle}
        </div>
        <p style="
          font-size: 18px; 
          color: rgb(60, 60, 60); 
          line-height: 1.6;
          max-width: 400px;
          margin: 0 auto;
        ">
          ${tagline}
        </p>
      </div>
    </div>
  `;
}
