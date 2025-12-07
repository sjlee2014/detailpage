/**
 * Master Template - Slot Filling Architecture
 * Apple/Toss 스타일의 세련된 상세페이지 템플릿
 * AI는 이 구조를 변경하지 않고, 플레이스홀더만 채웁니다.
 */

/**
 * 마스터 템플릿 반환
 * @returns {string} 플레이스홀더가 포함된 HTML 문자열
 * 
 * 플레이스홀더 목록:
 * - {{HEADLINE}}: 메인 헤드라인
 * - {{SUB_COPY}}: 서브 카피
 * - {{PRODUCT_IMAGE_0}}, {{PRODUCT_IMAGE_1}}, ...: 제품 이미지
 * - {{FEATURE_1_ICON}}, {{FEATURE_1_TITLE}}, {{FEATURE_1_DESC}}: 특징 1
 * - {{FEATURE_2_ICON}}, {{FEATURE_2_TITLE}}, {{FEATURE_2_DESC}}: 특징 2
 * - {{FEATURE_3_ICON}}, {{FEATURE_3_TITLE}}, {{FEATURE_3_DESC}}: 특징 3
 * - {{PAIN_POINT}}: 고객 페인포인트 해결 문구
 * - {{PRIMARY_COLOR}}: 메인 포인트 색상 (rgb 형식)
 * - {{SECONDARY_COLOR}}: 보조 색상 (rgb 형식)
 * - {{ACCENT_COLOR}}: 강조 색상 (rgb 형식)
 * - {{BRAND_LOGO}}: 브랜드 로고 (선택)
 * - {{PRODUCT_NAME}}: 제품명
 */
export function getMasterTemplate() {
  return `
<div style="width: 100%; max-width: 860px; margin: 0 auto; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: rgb(255, 255, 255); color: rgb(33, 33, 33); line-height: 1.6;">

  <!-- Hero Section -->
  <section style="padding: 80px 40px; text-align: center; background-color: rgb(250, 250, 252);">
    <h1 style="font-size: 42px; font-weight: 700; margin: 0 0 20px 0; color: rgb(17, 17, 17); letter-spacing: -0.5px; line-height: 1.3;">
      {{HEADLINE}}
    </h1>
    <p style="font-size: 20px; font-weight: 400; color: rgb(102, 102, 102); margin: 0 0 48px 0; max-width: 600px; margin-left: auto; margin-right: auto;">
      {{SUB_COPY}}
    </p>
    <div style="width: 100%; max-width: 700px; margin: 0 auto; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);">
      <img src="{{PRODUCT_IMAGE_0}}" alt="제품 메인 이미지" style="width: 100%; height: auto; display: block;" />
    </div>
  </section>

  <!-- Feature Cards Section -->
  <section style="padding: 80px 40px; background-color: rgb(255, 255, 255);">
    <div style="text-align: center; margin-bottom: 56px;">
      <span style="display: inline-block; background-color: {{PRIMARY_COLOR}}; color: rgb(255, 255, 255); padding: 10px 24px; border-radius: 100px; font-size: 14px; font-weight: 600; letter-spacing: 0.5px;">
        POINT
      </span>
      <h2 style="font-size: 32px; font-weight: 700; margin: 24px 0 0 0; color: rgb(17, 17, 17);">
        이런 점이 특별해요
      </h2>
    </div>
    
    <div style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: center;">
      <!-- Feature Card 1 -->
      <div style="flex: 1; min-width: 240px; max-width: 340px; background-color: rgb(250, 250, 252); border-radius: 20px; padding: 36px 28px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">{{FEATURE_1_ICON}}</div>
        <h3 style="font-size: 20px; font-weight: 600; margin: 0 0 12px 0; color: rgb(17, 17, 17);">{{FEATURE_1_TITLE}}</h3>
        <p style="font-size: 15px; color: rgb(102, 102, 102); margin: 0; line-height: 1.6;">{{FEATURE_1_DESC}}</p>
      </div>
      
      <!-- Feature Card 2 -->
      <div style="flex: 1; min-width: 240px; max-width: 340px; background-color: rgb(250, 250, 252); border-radius: 20px; padding: 36px 28px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">{{FEATURE_2_ICON}}</div>
        <h3 style="font-size: 20px; font-weight: 600; margin: 0 0 12px 0; color: rgb(17, 17, 17);">{{FEATURE_2_TITLE}}</h3>
        <p style="font-size: 15px; color: rgb(102, 102, 102); margin: 0; line-height: 1.6;">{{FEATURE_2_DESC}}</p>
      </div>
      
      <!-- Feature Card 3 -->
      <div style="flex: 1; min-width: 240px; max-width: 340px; background-color: rgb(250, 250, 252); border-radius: 20px; padding: 36px 28px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">{{FEATURE_3_ICON}}</div>
        <h3 style="font-size: 20px; font-weight: 600; margin: 0 0 12px 0; color: rgb(17, 17, 17);">{{FEATURE_3_TITLE}}</h3>
        <p style="font-size: 15px; color: rgb(102, 102, 102); margin: 0; line-height: 1.6;">{{FEATURE_3_DESC}}</p>
      </div>
    </div>
  </section>

  <!-- Full Width Image Section 1 -->
  <section style="padding: 0; background-color: rgb(255, 255, 255);">
    <img src="{{PRODUCT_IMAGE_0}}" alt="제품 상세" style="width: 100%; height: auto; display: block;" />
  </section>

  <!-- Pain Point Section -->
  <section style="padding: 80px 40px; background-color: {{SECONDARY_COLOR}}; text-align: center;">
    <div style="max-width: 600px; margin: 0 auto;">
      <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); color: rgb(255, 255, 255); padding: 8px 20px; border-radius: 100px; font-size: 13px; font-weight: 600; margin-bottom: 20px;">
        WHY
      </span>
      <h2 style="font-size: 28px; font-weight: 700; color: rgb(255, 255, 255); margin: 0 0 16px 0; line-height: 1.4;">
        {{PAIN_POINT}}
      </h2>
    </div>
  </section>

  <!-- Product Detail Section with Large Image -->
  <section style="padding: 80px 40px; background-color: rgb(255, 255, 255);">
    <div style="text-align: center; margin-bottom: 48px;">
      <span style="display: inline-block; background-color: {{ACCENT_COLOR}}; color: rgb(255, 255, 255); padding: 10px 24px; border-radius: 100px; font-size: 14px; font-weight: 600;">
        DETAIL
      </span>
      <h2 style="font-size: 32px; font-weight: 700; margin: 24px 0 0 0; color: rgb(17, 17, 17);">
        자세히 살펴보세요
      </h2>
    </div>
    
    <!-- Large Detail Image -->
    <div style="width: 100%; max-width: 700px; margin: 0 auto 32px auto; border-radius: 16px; overflow: hidden;">
      <img src="{{PRODUCT_IMAGE_1}}" alt="제품 상세 1" style="width: 100%; height: auto; display: block;" onerror="this.parentElement.style.display='none'" />
    </div>
    
    <!-- Grid Images -->
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: 700px; margin: 0 auto;">
      <div style="border-radius: 16px; overflow: hidden;">
        <img src="{{PRODUCT_IMAGE_2}}" alt="제품 상세 2" style="width: 100%; height: auto; display: block;" onerror="this.parentElement.style.display='none'" />
      </div>
      <div style="border-radius: 16px; overflow: hidden;">
        <img src="{{PRODUCT_IMAGE_3}}" alt="제품 상세 3" style="width: 100%; height: auto; display: block;" onerror="this.parentElement.style.display='none'" />
      </div>
    </div>
  </section>

  <!-- Trust Section -->
  <section style="padding: 60px 40px; background-color: rgb(250, 250, 252);">
    <div style="max-width: 600px; margin: 0 auto; text-align: center;">
      <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 32px 0; color: rgb(17, 17, 17);">
        왜 {{PRODUCT_NAME}}일까요?
      </h2>
      <div style="display: flex; justify-content: center; gap: 40px; flex-wrap: wrap;">
        <div style="text-align: center;">
          <div style="font-size: 36px; font-weight: 700; color: {{PRIMARY_COLOR}}; margin-bottom: 8px;">100%</div>
          <div style="font-size: 14px; color: rgb(102, 102, 102);">만족 보장</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 36px; font-weight: 700; color: {{PRIMARY_COLOR}}; margin-bottom: 8px;">5,000+</div>
          <div style="font-size: 14px; color: rgb(102, 102, 102);">누적 판매</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 36px; font-weight: 700; color: {{PRIMARY_COLOR}}; margin-bottom: 8px;">4.9</div>
          <div style="font-size: 14px; color: rgb(102, 102, 102);">평균 평점</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Another Product Image -->
  <section style="padding: 0; background-color: rgb(255, 255, 255);">
    <img src="{{PRODUCT_IMAGE_4}}" alt="제품 추가 이미지" style="width: 100%; height: auto; display: block;" onerror="this.parentElement.style.display='none'" />
  </section>

  <!-- CTA Section -->
  <section style="padding: 80px 40px; background-color: {{PRIMARY_COLOR}}; text-align: center;">
    <h2 style="font-size: 28px; font-weight: 700; color: rgb(255, 255, 255); margin: 0 0 16px 0;">
      지금 바로 만나보세요
    </h2>
    <p style="font-size: 16px; color: rgba(255, 255, 255, 0.8); margin: 0;">
      특별한 경험이 기다리고 있습니다
    </p>
  </section>

  <!-- Notice Section -->
  <section style="padding: 48px 40px; background-color: rgb(45, 45, 48); color: rgb(200, 200, 200);">
    <div style="max-width: 600px; margin: 0 auto;">
      <h3 style="font-size: 16px; font-weight: 600; color: rgb(255, 255, 255); margin: 0 0 20px 0;">
        📌 구매 전 확인해주세요
      </h3>
      <ul style="margin: 0; padding: 0 0 0 20px; font-size: 14px; line-height: 1.8;">
        <li>모니터 설정에 따라 색상이 다르게 보일 수 있습니다.</li>
        <li>제품 특성상 교환/환불이 제한될 수 있습니다.</li>
        <li>자세한 내용은 상세 정보를 확인해주세요.</li>
        <li>배송은 영업일 기준 2-3일 소요됩니다.</li>
      </ul>
    </div>
  </section>

  <!-- Brand Logo Section (Optional) -->
  <section style="padding: 60px 40px; background-color: rgb(250, 250, 252); text-align: center;">
    <img src="{{BRAND_LOGO}}" alt="브랜드 로고" style="max-width: 180px; height: auto;" onerror="this.parentElement.style.display='none'" />
  </section>

</div>
  `.trim();
}

/**
 * 색상 Hex를 RGB로 변환
 * @param {string} hex - Hex 색상 코드 (예: #FF5733)
 * @returns {string} RGB 형식 (예: rgb(255, 87, 51))
 */
export function hexToRgb(hex) {
  // # 제거
  const cleanHex = hex.replace('#', '');

  // 3자리 hex를 6자리로 확장
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;

  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * 기본 색상 팔레트 (이미지 분석 실패 시 사용)
 */
export const defaultColors = {
  primary: 'rgb(79, 70, 229)',    // 인디고
  secondary: 'rgb(99, 102, 241)', // 라이트 인디고
  accent: 'rgb(236, 72, 153)'     // 핑크
};
