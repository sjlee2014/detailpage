/**
 * Template 4: Diagonal Dynamic (대각선 레이아웃)
 * 역동적이고 젊은 느낌 - 대각선 분할 + 동적 이미지 배치
 */

export function generateDiagonalDynamic(params) {
  const { productName, tagline, images, colors, decoration } = params;

  // 배경색 기본값 설정
  const bgColor = colors.bgColor || 'rgb(255, 255, 255)';
  const accentColor = colors.accentColor || 'rgb(255, 100, 100)';
  const diagonalBg = 'rgba(255, 200, 200, 0.3)'; // gradient 대신 단색

  // 제품명을 단어별로 분할하여 색상 적용
  const words = productName.split(' ');
  const coloredTitle = words.map((word, i) =>
    `<span style="color: ${colors.titleColors[i % colors.titleColors.length]};">${word}</span>`
  ).join(' ');

  // 이미지 배치 (최대 4개, 대각선으로)
  const positions = [
    { top: '15%', left: '60%', rotate: -12 },
    { top: '35%', left: '75%', rotate: 8 },
    { top: '55%', left: '65%', rotate: -5 },
    { top: '75%', left: '80%', rotate: 10 }
  ];

  const imageElements = images.slice(0, 4).map((img, i) => {
    const pos = positions[i];
    return `
      <img src="${img}" alt="제품 이미지 ${i + 1}" style="
        position: absolute;
        top: ${pos.top};
        left: ${pos.left};
        transform: translate(-50%, -50%) rotate(${pos.rotate}deg);
        width: 160px;
        height: 160px;
        object-fit: cover;
        border-radius: 20px;
        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
        z-index: 2;
      " />
    `;
  }).join('');

  return `
    <div style="
      width: 100%; 
      min-height: 650px; 
      background: ${bgColor};
      border-bottom: 5px solid ${accentColor};
      display: flex;
      align-items: center;
      padding: 80px 60px;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    ">
      <!-- 대각선 배경 -->
      <div style="
        position: absolute;
        top: -100px;
        right: -100px;
        width: 60%;
        height: 120%;
        background: ${diagonalBg};
        transform: rotate(-15deg);
        z-index: 1;
      "></div>
      
      <!-- 삼각형 장식 -->
      <div style="
        position: absolute;
        bottom: 50px;
        left: 50px;
        width: 0;
        height: 0;
        border-left: 80px solid transparent;
        border-right: 80px solid transparent;
        border-bottom: 140px solid ${accentColor};
        opacity: 0.15;
        z-index: 1;
      "></div>
      
      <!-- 좌측: 텍스트 -->
      <div style="
        flex: 1;
        z-index: 3;
        max-width: 500px;
      ">
        <div style="
          font-size: 70px; 
          font-weight: 900; 
          line-height: 1.1; 
          margin-bottom: 24px;
          font-family: 'Noto Sans KR', sans-serif;
        ">
          ${coloredTitle}
        </div>
        <p style="
          font-size: 20px; 
          color: rgb(60, 60, 60); 
          line-height: 1.7;
        ">
          ${tagline}
        </p>
      </div>
      
      <!-- 우측: 이미지들 (대각선 배치) -->
      <div style="
        flex: 1;
        position: relative;
        height: 100%;
      ">
        ${imageElements}
      </div>
    </div>
  `;
}
