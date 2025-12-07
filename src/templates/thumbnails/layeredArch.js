/**
 * Template: Layered Arch
 * 고급스러운 아치형 창문 효과와 우아한 타이포그래피
 */

export function generateLayeredArch(params) {
    const { productName, tagline, images, colors, decoration } = params;

    // 색상 팔레트
    const bgColor = colors.bgColor || 'rgb(245, 240, 235)'; // 따뜻한 크림/베이지
    const accentColor = colors.accentColor || 'rgb(80, 70, 60)'; // 짙은 브라운/차콜
    const titleColor = colors.titleColors?.[0] || 'rgb(30, 30, 30)';

    // 메인 이미지
    const mainImage = images[0] || '';

    return `
    <div style="
      width: 100%;
      min-height: 800px;
      background: ${bgColor};
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      overflow: hidden;
      font-family: 'Noto Sans KR', sans-serif;
    ">
      
      <!-- 상단 뱃지 -->
      <div style="
        margin-top: 60px;
        background: ${accentColor};
        color: white;
        padding: 8px 24px;
        border-radius: 50px;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 1px;
        z-index: 10;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      ">
        PREMIUM COLLECTION
      </div>

      <!-- 타이틀 섹션 -->
      <div style="
        text-align: center;
        margin-top: 30px;
        margin-bottom: 40px;
        z-index: 10;
      ">
        <p style="
          font-size: 18px;
          color: rgba(0,0,0,0.6);
          margin-bottom: 10px;
          font-weight: 500;
        ">${tagline}</p>
        <h1 style="
          font-size: 56px;
          font-weight: 800;
          color: ${titleColor};
          line-height: 1.2;
          margin: 0;
          letter-spacing: -1px;
          text-shadow: 0 2px 0 rgba(255,255,255,0.5);
        ">${productName}</h1>
      </div>

      <!-- 아치형 이미지 프레임 -->
      <div style="
        width: 420px;
        height: 560px;
        background: white;
        border-radius: 210px 210px 20px 20px;
        padding: 15px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        z-index: 5;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
      ">
        <!-- 내부 이미지 -->
        <div style="
          width: 100%;
          height: 100%;
          border-radius: 200px 200px 10px 10px;
          overflow: hidden;
          position: relative;
        ">
          <img src="${mainImage}" style="
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
          " />
          
          <!-- 유리 질감 오버레이 (선택적) -->
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0) 100%);
            pointer-events: none;
          "></div>
        </div>

        <!-- 장식용 비즈/참 (가상 요소) -->
        <div style="
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 60px;
          background: ${accentColor};
          z-index: 20;
        "></div>
        <div style="
          position: absolute;
          top: -28px;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${colors.decorationColor || 'gold'};
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          z-index: 21;
        "></div>
      </div>

      <!-- 하단 설명 바 -->
      <div style="
        position: absolute;
        bottom: 60px;
        background: rgba(255,255,255,0.8);
        backdrop-filter: blur(10px);
        padding: 15px 40px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        z-index: 10;
        display: flex;
        gap: 10px;
        align-items: center;
      ">
        <span style="font-size: 16px; font-weight: 600; color: ${accentColor};">Art Like Life</span>
        <span style="width: 1px; height: 16px; background: #ddd;"></span>
        <span style="font-size: 14px; color: #666;">일상의 예술을 만나보세요</span>
      </div>

      <!-- 배경 장식 (그림자/빛) -->
      <div style="
        position: absolute;
        top: -100px;
        left: -100px;
        width: 600px;
        height: 600px;
        background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
        opacity: 0.6;
        pointer-events: none;
      "></div>
    </div>
  `;
}
