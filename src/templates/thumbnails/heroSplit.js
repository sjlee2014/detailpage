/**
 * Template 1: Hero Split (좌우 분할)
 * 사용자 제공 스타일 - 대담한 타이포그래피 + 자연스러운 이미지 배치
 */

export function generateHeroSplit(params) {
  const { productName, tagline, images, colors, decoration } = params;

  // 배경색 기본값 설정
  const bgColor = colors.bgColor || 'rgb(250, 250, 250)';
  const accentColor = colors.accentColor || 'rgb(33, 150, 243)';
  const decorationColor = colors.decorationColor || 'rgb(50, 70, 100)';

  // 제품명을 단어별로 분할하여 색상 적용
  const words = productName.split(' ');
  const coloredTitle = words.map((word, i) =>
    `<span style="color: ${colors.titleColors[i % colors.titleColors.length]}; display: inline-block; margin-right: 12px;">${word}</span>`
  ).join('');

  // 장식 요소 생성
  let decorationHTML = '';
  if (decoration === 'clouds') {
    decorationHTML = `
      <div style="position: absolute; top: 40px; right: 100px; width: 120px; height: 60px; 
                  background: rgba(255, 255, 255, 0.4); border-radius: 50px;"></div>
      <div style="position: absolute; top: 60px; right: 140px; width: 80px; height: 40px; 
                  background: rgba(255, 255, 255, 0.3); border-radius: 40px;"></div>
    `;
  } else if (decoration === 'mountains') {
    decorationHTML = `
      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 150px; 
                  background: ${decorationColor}; opacity: 0.3; 
                  clip-path: polygon(0 100%, 20% 40%, 40% 60%, 60% 30%, 80% 50%, 100% 20%, 100% 100%);"></div>
    `;
  } else if (decoration === 'circles') {
    decorationHTML = `
      <div style="position: absolute; top: -80px; right: -80px; width: 250px; height: 250px; 
                  background: ${accentColor}; opacity: 0.15; border-radius: 50%;"></div>
      <div style="position: absolute; bottom: -60px; left: -60px; width: 180px; height: 180px; 
                  background: ${accentColor}; opacity: 0.1; border-radius: 50%;"></div>
    `;
  }

  // 이미지 배치 (최대 4개)
  const imageElements = images.slice(0, 4).map((img, i) => {
    const rotations = [-8, 5, -3, 7];
    const scales = [1, 0.95, 1.05, 0.9];
    return `
      <img src="${img}" alt="제품 이미지 ${i + 1}" style="
        max-width: 180px;
        max-height: 180px;
        transform: rotate(${rotations[i]}deg) scale(${scales[i]});
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
        border-radius: 16px;
        transition: transform 0.3s ease;
        object-fit: contain;
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
      ${decorationHTML}
      
      <!-- 좌측: 텍스트 영역 -->
      <div style="flex: 1; z-index: 2; padding-right: 40px;">
        <div style="
          font-size: 68px; 
          font-weight: 900; 
          line-height: 1.1; 
          margin-bottom: 24px;
          font-family: 'Noto Sans KR', sans-serif;
        ">
          ${coloredTitle}
        </div>
        <p style="
          font-size: 20px; 
          color: rgb(70, 70, 70); 
          line-height: 1.7;
          max-width: 500px;
          font-weight: 400;
        ">
          ${tagline}
        </p>
      </div>
      
      <!-- 우측: 이미지 영역 -->
      <div style="
        flex: 1; 
        display: flex; 
        flex-wrap: wrap;
        justify-content: center; 
        align-items: center; 
        gap: 30px;
        z-index: 2;
      ">
        ${imageElements}
      </div>
    </div>
  `;
}
