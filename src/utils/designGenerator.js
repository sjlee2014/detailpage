/**
 * AI 기반 디자인 생성기 - Slot Filling Architecture
 * 
 * 새 워크플로우:
 * 1. copywriter.js 호출 → 콘텐츠 JSON 수신
 * 2. 제품 이미지에서 메인 컬러 3가지 추출
 * 3. masterTemplate.js의 플레이스홀더에 데이터 치환
 * 4. 최종 HTML 반환
 */

import { generateContentWithImage, generateContent } from './geminiClient.js';
import { generateCopywriting } from './copywriter.js';
import { getMasterTemplate, hexToRgb, defaultColors } from '../templates/masterTemplate.js';
import { generateThumbnail } from './thumbnailGenerator.js';

/**
 * CSS 정제: html2canvas 호환성 보장
 * - HEX 색상을 RGB로 변환
 * - 문제가 되는 CSS 속성 제거
 */
function sanitizeCSS(html) {
   console.log('🔧 CSS 정제 시작...');

   let sanitized = html;

   // 1. HEX 색상을 RGB로 변환 (#RRGGBB → rgb(R, G, B))
   sanitized = sanitized.replace(/#([0-9A-Fa-f]{6})|#([0-9A-Fa-f]{3})/g, (match, hex6, hex3) => {
      let hex = hex6 || hex3;

      // 3자리 hex를 6자리로 확장
      if (hex.length === 3) {
         hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }

      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      return `rgb(${r}, ${g}, ${b})`;
   });

   // 2. linear-gradient를 단색으로 대체 (html2canvas 호환성)
   sanitized = sanitized.replace(/linear-gradient\([^)]+\)/gi, (match) => {
      // 그라데이션의 첫 번째 색상 추출
      const colorMatch = match.match(/rgb\([^)]+\)/);
      return colorMatch ? colorMatch[0] : 'rgb(250, 250, 252)';
   });

   console.log('✅ CSS 정제 완료');
   return sanitized;
}

/**
 * 제품 이미지에서 메인 컬러 3가지 추출
 * @param {string} imageData - Base64 이미지 데이터
 * @returns {Promise<Object>} { primary, secondary, accent } RGB 색상
 */
async function extractColorsFromImage(imageData) {
   console.log('🎨 이미지에서 색상 추출 중...');

   const prompt = `
이 제품 이미지를 분석하여 상세페이지 디자인에 사용할 색상 팔레트를 추천해주세요.

다음 기준으로 3가지 색상을 선택하세요:
1. **Primary (주색상)**: 제품의 가장 인상적인 색상. 버튼, 포인트에 사용.
2. **Secondary (보조색상)**: 배경 섹션에 사용할 중간 톤의 색상.
3. **Accent (강조색상)**: Primary와 대비되는 포인트 색상.

**중요**: 
- 모든 색상은 채도가 적당하고 화면에서 세련되어 보여야 합니다.
- 파스텔톤이나 원색보다는 조금 톤다운된 색상을 추천하세요.

JSON 형식으로만 응답하세요:
\`\`\`json
{
  "primary": "#HEX코드",
  "secondary": "#HEX코드",
  "accent": "#HEX코드"
}
\`\`\`
   `.trim();

   try {
      const response = await generateContentWithImage(prompt, imageData);
      const jsonMatch = response.match(/```json\s*([\s\S]*?)```/) || response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
         const jsonStr = jsonMatch[1] || jsonMatch[0];
         const colors = JSON.parse(jsonStr.trim());

         console.log('✅ 색상 추출 완료:', colors);

         return {
            primary: hexToRgb(colors.primary),
            secondary: hexToRgb(colors.secondary),
            accent: hexToRgb(colors.accent)
         };
      }

      throw new Error('색상 JSON 파싱 실패');
   } catch (error) {
      console.warn('⚠️ 색상 추출 실패, 기본값 사용:', error.message);
      return defaultColors;
   }
}

/**
 * 템플릿에 콘텐츠 슬롯 필링
 * @param {string} template - HTML 템플릿
 * @param {Object} content - 카피라이팅 콘텐츠
 * @param {Object} colors - 색상 팔레트
 * @param {Array} images - 제품 이미지 배열
 * @param {string|null} brandLogo - 브랜드 로고
 * @param {Object} productInfo - 제품 정보
 * @returns {string} 완성된 HTML
 */
function fillTemplateSlots(template, content, colors, images, brandLogo, productInfo) {
   let html = template;

   // 제품 정보 치환
   html = html.replace(/\{\{PRODUCT_NAME\}\}/g, productInfo.productName || '');

   // 카피라이팅 콘텐츠 치환
   html = html.replace(/\{\{HEADLINE\}\}/g, content.headline || '');
   html = html.replace(/\{\{SUB_COPY\}\}/g, content.subCopy || '');
   html = html.replace(/\{\{PAIN_POINT\}\}/g, content.painPoint || '');

   // 특징 콘텐츠 치환
   const features = content.features || [];
   for (let i = 0; i < 3; i++) {
      const feature = features[i] || { icon: '⭐', title: '특별함', desc: '준비 중입니다' };
      html = html.replace(new RegExp(`\\{\\{FEATURE_${i + 1}_ICON\\}\\}`, 'g'), feature.icon);
      html = html.replace(new RegExp(`\\{\\{FEATURE_${i + 1}_TITLE\\}\\}`, 'g'), feature.title);
      html = html.replace(new RegExp(`\\{\\{FEATURE_${i + 1}_DESC\\}\\}`, 'g'), feature.desc);
   }

   // 색상 치환
   html = html.replace(/\{\{PRIMARY_COLOR\}\}/g, colors.primary);
   html = html.replace(/\{\{SECONDARY_COLOR\}\}/g, colors.secondary);
   html = html.replace(/\{\{ACCENT_COLOR\}\}/g, colors.accent);

   // 이미지 플레이스홀더 치환
   for (let i = 0; i < 10; i++) {
      const imgData = images[i] || '';
      html = html.replace(new RegExp(`\\{\\{PRODUCT_IMAGE_${i}\\}\\}`, 'g'), imgData);
   }

   // 브랜드 로고 치환
   if (brandLogo) {
      html = html.replace(/\{\{BRAND_LOGO\}\}/g, brandLogo);
   } else {
      // 로고 없으면 해당 섹션 숨김
      html = html.replace(/\{\{BRAND_LOGO\}\}/g, '');
   }

   return html;
}

/**
 * AI가 전체 디자인을 생성 (Slot Filling Architecture)
 * 
 * @param {Object} productInfo - { productName, description }
 * @param {Array} productImages - 제품 이미지 배열
 * @param {Array} styleExamples - 스타일 예시 (미사용, 호환성 유지)
 * @param {Object} imageAnalysis - 이미지 분석 결과 (미사용, 호환성 유지)
 * @param {Object} styleAnalysis - 스타일 분석 결과 (미사용, 호환성 유지)
 * @param {string} brandLogo - 브랜드 로고 이미지
 * @returns {Promise<string>} 완성된 HTML
 */
export async function generateAIDesign(productInfo, productImages, styleExamples = [], imageAnalysis = null, styleAnalysis = null, brandLogo = null) {
   try {
      console.log('🚀 Slot Filling Architecture 시작...');
      const images = Array.isArray(productImages) ? productImages : [productImages];

      // === 1단계: AI 카피라이팅 생성 ===
      console.log('📝 1단계: AI 카피라이팅 생성...');
      const content = await generateCopywriting(productInfo.productName, productInfo.description);
      console.log('✅ 카피라이팅 완료:', content.headline);

      // === 2단계: 이미지에서 색상 추출 ===
      console.log('🎨 2단계: 색상 추출...');
      let colors = defaultColors;
      if (images.length > 0 && images[0]) {
         colors = await extractColorsFromImage(images[0]);
      }
      console.log('✅ 색상 추출 완료:', colors.primary);

      // === 3단계: 마스터 템플릿 가져오기 ===
      console.log('📄 3단계: 마스터 템플릿 로드...');
      const template = getMasterTemplate();

      // === 4단계: 슬롯 필링 ===
      console.log('🔧 4단계: 슬롯 필링...');
      let html = fillTemplateSlots(template, content, colors, images, brandLogo, productInfo);

      // === 5단계: 썸네일 생성 및 삽입 ===
      console.log('🎨 5단계: 썸네일 생성...');
      try {
         const thumbnail = await generateThumbnail(productInfo, images, imageAnalysis || {
            category: '일반 제품',
            colors: [colors.primary],
            features: [],
            mood: '모던'
         });

         if (thumbnail) {
            html = `
<div style="width: 100%; margin: 0; padding: 0; box-sizing: border-box;">
  ${thumbnail}
  ${html}
</div>
            `.trim();
            console.log('✅ 썸네일 삽입 완료');
         }
      } catch (thumbnailError) {
         console.warn('⚠️ 썸네일 생성 실패, 스킵:', thumbnailError.message);
      }

      // === 6단계: CSS 정제 ===
      console.log('🔧 6단계: CSS 정제...');
      html = sanitizeCSS(html);

      console.log('🎉 Slot Filling Architecture 완료!');
      return html;

   } catch (error) {
      console.error('❌ AI 디자인 생성 실패:', error);
      throw new Error(`디자인 생성 실패: ${error.message}`);
   }
}

/**
 * AI 카피라이팅 생성 (레거시 호환용)
 * 이제 copywriter.js의 generateCopywriting을 직접 사용하세요.
 */
export async function generateAICopywriting(productName, description, imageAnalysis) {
   console.warn('⚠️ generateAICopywriting은 deprecated입니다. copywriter.js의 generateCopywriting을 사용하세요.');
   return generateCopywriting(productName, description);
}
