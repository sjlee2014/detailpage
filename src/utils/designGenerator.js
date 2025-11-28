/**
 * AI 기반 디자인 생성기
 * Gemini API를 사용하여 완전한 HTML/CSS 디자인 생성
 */

import { generateContentWithImage, generateContent, extractTextFromImage } from './geminiClient.js';
import { getExampleCounts } from './exampleManager.js';

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

   // 2. style 속성 내에서 문제가 되는 CSS 제거
   sanitized = sanitized.replace(/style="([^"]*)"/g, (match, styleContent) => {
      let cleaned = styleContent;

      // gradient 완전 제거
      cleaned = cleaned.replace(/background:\s*linear-gradient\([^;)]*\)[^;]*/gi, '');
      cleaned = cleaned.replace(/background:\s*radial-gradient\([^;)]*\)[^;]*/gi, '');
      cleaned = cleaned.replace(/background-image:\s*linear-gradient\([^;)]*\)[^;]*/gi, '');
      cleaned = cleaned.replace(/background-image:\s*radial-gradient\([^;)]*\)[^;]*/gi, '');

      // 그림자 제거
      cleaned = cleaned.replace(/text-shadow:[^;]*;?/gi, '');
      cleaned = cleaned.replace(/box-shadow:\s*inset[^;]*;?/gi, ''); // inset만 제거

      // 필터 제거
      cleaned = cleaned.replace(/filter:[^;]*;?/gi, '');
      cleaned = cleaned.replace(/backdrop-filter:[^;]*;?/gi, '');

      // 복잡한 transform 제거 (rotate, skew)
      cleaned = cleaned.replace(/transform:[^;]*(?:rotate|skew)[^;]*;?/gi, '');

      // clip-path 제거
      cleaned = cleaned.replace(/clip-path:[^;]*;?/gi, '');

      // mix-blend-mode 제거
      cleaned = cleaned.replace(/mix-blend-mode:[^;]*;?/gi, '');

      // 불필요한 세미콜론 정리
      cleaned = cleaned.replace(/;+/g, ';').replace(/;\s*$/, '');

      return `style="${cleaned}"`;
   });

   console.log('✅ CSS 정제 완료 (HEX→RGB, 문제 속성 제거)');
   return sanitized;
}

/**
 * HTML 코드 블록 추출 및 정제
 */
function extractHTML(text) {
   const htmlBlockMatch = text.match(/```html\s*([\s\S]*?)```/);
   if (htmlBlockMatch) {
      return htmlBlockMatch[1].trim();
   }

   const divMatch = text.match(/(<div[\s\S]*<\/div>)/);
   if (divMatch) {
      return divMatch[1].trim();
   }

   return text.trim();
}

/**
 * Few-shot Learning 예시 섹션 생성
 */
function buildFewShotSection() {
   const counts = getExampleCounts();

   if (counts.total === 0) {
      return '';
   }

   return `
【Few-shot Learning 우수 사례 예시 (디자인 패턴만 참고)】
등록된 우수 사례: 미니멀 ${counts.minimal}개, 풍부한 ${counts.rich}개

⚠️ 중요: 이 예시들은 디자인 패턴 학습용입니다.
- 예시의 레이아웃 구조, 섹션 배치, 여백 사용법을 학습하세요
- 예시의 타이포그래피 스타일, 색상 조합을 참고하세요
- 예시 이미지를 HTML에 직접 포함하지 마세요 ({{PRODUCT_IMAGE_N}} 플레이스홀더만 사용)
- 예시의 콘텐츠를 복사하지 말고, 제공된 제품 정보로 새롭게 작성하세요
   `.trim();
}

/**
 * 🆕 모든 이미지에서 텍스트 추출 (OCR 선처리)
 */
async function extractTextsFromImages(productImages) {
   console.log('📝 이미지 OCR 시작...');
   const imageTexts = [];

   for (let i = 0; i < productImages.length; i++) {
      try {
         const text = await extractTextFromImage(productImages[i]);
         imageTexts.push(text || '');
         console.log(`✅ 이미지 ${i}: "${text || '(텍스트 없음)'}"`);
      } catch (error) {
         console.error(`❌ 이미지 ${i} OCR 실패:`, error);
         imageTexts.push('');
      }
   }

   return imageTexts;
}

/**
 * AI 디자인 생성 프롬프트 구성
 */
function buildDesignPrompt(productInfo, imageAnalysis, styleExamples, imageCount, imageTexts, styleAnalysis) {
   const { productName, description } = productInfo;
   const { category, colors, features, mood } = imageAnalysis;

   const fewShotSection = buildFewShotSection();

   // 🆕 이미지 텍스트 정보 생성
   let imageTextSection = '';
   if (imageTexts && imageTexts.length > 0) {
      const validTexts = imageTexts.filter(t => t && t.trim().length > 0);
      if (validTexts.length > 0) {
         imageTextSection = `
📸 제품 이미지 내 텍스트 정보:
${imageTexts.map((text, idx) => text ? `- 이미지 ${idx}: "${text}"` : '').filter(t => t).join('\n')}

⚠️ 중요: 위의 텍스트를 HTML에서 **정확히 순서대로** 사용하세요!
- 이미지 0에 "정약용"이 있다면, 그 이미지 아래 텍스트도 "정약용"
- 순서를 절대 바꾸지 마세요
- 다른 이름으로 대체하지 마세요
`;
      }
   }

   return `당신은 15년 경력의 e-커머스 상세페이지 디자인 전문가입니다.

제품 정보:
제품명: ${productName}
설명: ${description}
이미지 개수: ${imageCount}장
카테고리: ${category}

${imageTextSection}

${fewShotSection}

필수 디자인 구조:
1. 제품 헤더 섹션
2. 메인 비주얼 영역
3. 신뢰도 지표 섹션
4. 핵심 특징 섹션
5. 상세 설명 섹션
6. CTA 버튼

디자인 원칙:
- 본문 텍스트: color는 #1a1a1a 부터 #333333 사이 (진한 검정)
- 회색 텍스트 절대 금지 (#999, #aaa, #ccc 사용 금지)
- 적절한 여백: 섹션 간 60-80px
- 가독성: line-height 1.6-1.8

🎨 제목 색상 규칙 (중요!):
- 📍 큰 제목 (h1, h2 스타일): 제품 이미지에서 추출한 **강조색** 사용
  - ⚠️ **rgb 형식 필수!** hex(#3b82f6) 대신 rgb(59, 130, 246) 사용
  - 예: color: rgb(37, 99, 235) ✅  (color: #2563eb ❌)
  - 예: color: rgb(8, 145, 178) ✅  (color: #0891b2 ❌)
  - 제품 이미지의 주요 색상을 분석해서 어울리는 색 선택
  - 생동감 있고 시선을 끄는 색상 (채도 높은 색)
- 📍 중간 제목 (h3 스타일): 본문보다 약간 진하거나 강조색의 연한 버전
- 📍 본문 텍스트: 진한 검정 rgb(26, 26, 26) ~ rgb(51, 51, 51)

색상 선택 가이드:
- 제품 이미지에 파란색 → 제목을 진한 파란색으로: rgb(37, 99, 235)
- 제품 이미지에 초록색 → 제목을 진한 초록색으로: rgb(5, 150, 105)
- 제품 이미지에 여러 색상 → 가장 돋보이는 색을 제목에 사용
- ⚠️ 너무 밝거나 연한 색은 금지 (가독성 확보)

📐 텍스트 정렬 및 가독성 (필수):
- 모든 제목과 본문은 **중앙 정렬 (text-align: center)** 기본
- 카드/박스 내부 텍스트도 중앙 정렬
- 왼쪽 정렬은 긴 문단에만 제한적으로 사용

⚠️ 이미지 사용 규칙 (중요):
- 제품 이미지만 사용: {{PRODUCT_IMAGE_0}}, {{PRODUCT_IMAGE_1}}, ... {{PRODUCT_IMAGE_${imageCount - 1}}}
- 다른 이미지 URL이나 경로를 절대 사용하지 마세요

🎨 시각적 다양성 (필수):
- 단조로운 단색 디자인 금지
- 섹션별 차별화된 배경색 또는 그라디언트 사용
- 강조색 활용:
  - **큰 제목/헤더**: 생동감 있는 강조색 필수 (rgb 형식으로!)
  - CTA 버튼: 강조색 배경
  - 아이콘/뱃지: 강조색 포인트
- 카드, 박스, 구분선 등으로 시각적 계층 구조 명확히

⚠️ 색상 형식 규칙 (매우 중요!):
- ✅ 올바른 형식: color: rgb(37, 99, 235)
- ❌ 잘못된 형식: color: #2563eb

색상 예시 (rgb 형식):
- 진한 하늘색: rgb(37, 99, 235), rgb(59, 130, 246)
- 청록색: rgb(8, 145, 178), rgb(6, 182, 212)
- 남색: rgb(79, 70, 229), rgb(99, 102, 241)
- 보라색: rgb(124, 58, 237), rgb(139, 92, 246)
- 녹색: rgb(5, 150, 105), rgb(16, 185, 129)

✅ 콘텐츠 일관성 (매우 중요!):
- 이미지 텍스트 정보를 **정확히** 사용
- 순서와 이름을 **절대** 바꾸지 마세요
- 이미지와 텍스트는 **완벽히 일치**해야 함

기술 요구사항:
1. 크기: 800px 고정 너비
2. **모든 CSS는 인라인 스타일로 작성** (class 금지)
3. div로 시작하는 HTML (html, head, meta 태그 금지)
4. 안전한 HTML만 사용

⚠️⚠️⚠️ CSS 안전성 규칙 (매우 중요! 이미지 다운로드 호환성) ⚠️⚠️⚠️

**절대 금지 CSS 속성 (이미지 변환 시 깨짐/누락 발생):**
❌ text-shadow (글씨 번짐, 배경 생성 버그)
❌ box-shadow: inset ... (내부 그림자 - 렌더링 실패)
❌ filter, backdrop-filter (색상 왜곡)
❌ mix-blend-mode (색상 섞임)
❌ clip-path (잘림 현상)
❌ transform: rotate/skew (왜곡)
❌ ::before, ::after (pseudo 요소 - 인라인 스타일로 불가능하므로 금지)
❌ **gradient 배경 완전 금지!** (linear-gradient, radial-gradient 모두 금지)
  - ❌ background: linear-gradient(...) - 색상 왜곡 발생!
  - ❌ background: radial-gradient(...) - 색상 왜곡 발생!
  - ✅ background-color: rgb(...) 만 사용!
❌ opacity 0.X (투명도 - 렌더링 문제, 0 또는 1만 허용)
❌ 복잡한 border (점선/파선 금지, 실선만)

**사용 가능한 안전한 CSS:**
✅ background-color: rgb(R, G, B) - **단색 배경만!** (gradient 금지!)
✅ color: rgb(R, G, B) - 텍스트 색상 (hex 금지! rgb만!)
✅ font-size, font-weight, font-family
✅ padding, margin
✅ border: Npx solid rgb(...) - 실선 테두리만
✅ border-radius: Npx - 둥근 모서리
✅ width, height, max-width
✅ display: flex, block, inline-block
✅ align-items, justify-content
✅ text-align: center/left/right
✅ box-shadow: Xpx Ypx Blur rgb(R,G,B,alpha) - 외부 그림자만, 단순하게!

**색상 형식 규칙:**
- ✅ rgb(59, 130, 246) - RGB 형식 (투명도 없음)
- ✅ rgba(59, 130, 246, 0.5) - RGBA 형식 (투명도 있음)
- ❌ #3b82f6 - HEX 형식 절대 금지!
- ❌ hsl(...) - HSL 형식 금지

**제목 색상 (큰 제목 h1, h2):**
- color: rgb(37, 99, 235) - 진한 파란색 ✅
- color: rgb(8, 145, 178) - 청록색 ✅
- color: rgb(79, 70, 229) - 남색 ✅
- color: rgb(5, 150, 105) - 녹색 ✅
- color: rgb(220, 38, 38) - 빨간색 ✅

**본문 텍스트:**
- color: rgb(26, 26, 26) - 거의 검정 ✅
- color: rgb(51, 51, 51) - 진한 회색 ✅

**배경 (단색만!):**
- background-color: rgb(255, 255, 255) - 흰색 ✅
- background-color: rgb(249, 250, 251) - 연한 회색 ✅
- background-color: rgb(243, 244, 246) - 회색 ✅
- background-color: rgb(240, 246, 255) - 연한 하늘색 ✅
- **섹션 구분은 다른 배경색으로!** (gradient 대신 단색 변화)

**올바른 예시:**
✅ <h1 style="color: rgb(37, 99, 235); font-size: 44px; font-weight: 900; margin: 0 0 16px 0;">제목</h1>
✅ <div style="background-color: rgb(249, 250, 251); padding: 24px; border-radius: 12px; margin: 16px 0;">내용</div>
✅ <div style="background-color: rgb(243, 244, 246); padding: 32px;">섹션 1</div>
✅ <div style="background-color: rgb(255, 255, 255); padding: 32px;">섹션 2</div>
✅ <div style="border: 2px solid rgb(229, 231, 235); border-radius: 8px; padding: 16px;">카드</div>
✅ <p style="color: rgb(107, 114, 128); font-size: 14px; margin: 8px 0;">설명 텍스트</p>

**잘못된 예시:**
❌ <h1 style="color: #2563eb; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">제목</h1>
❌ <div style="box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">내용</div>
❌ <div style="filter: blur(10px);">블러</div>
❌ <div style="background: linear-gradient(180deg, rgb(240, 246, 255), rgb(255, 255, 255));">gradient 금지!</div>
❌ <div style="background: linear-gradient(45deg, rgb(255,0,0), rgb(0,255,0));">gradient 금지!</div>

순수 HTML 코드만 반환하세요.
`.trim();
}

/**
 * AI가 전체 디자인을 생성 (OCR 선처리 + Vision 모델)
 */
export async function generateAIDesign(productInfo, productImages, styleExamples = [], imageAnalysis = null, styleAnalysis = null) {
   try {
      if (!imageAnalysis) {
         imageAnalysis = {
            category: '일반 제품',
            colors: ['#93c5fd', '#6ee7b7', '#fda4af'],
            features: ['고품질', '실용적', '스타일리시'],
            mood: '모던',
         };
      }

      const images = Array.isArray(productImages) ? productImages : [productImages];
      const imageCount = images.length;

      // 🆕 1단계: 모든 이미지에서 텍스트 추출 (OCR)
      const imageTexts = await extractTextsFromImages(images);

      // 2단계: 프롬프트 생성 (OCR 결과 포함)
      const basePrompt = buildDesignPrompt(productInfo, imageAnalysis, styleExamples, imageCount, imageTexts, styleAnalysis);

      const visionPrompt = `${basePrompt}

📸 제품 이미지 분석:
첨부된 제품 이미지를 직접 확인하고 분석하세요:
- 실제 제품의 색상, 질감, 분위기를 파악
- 이미지에서 추출한 색상을 디자인에 활용
- 제품의 스타일과 어울리는 디자인 구성

이 제품 이미지의 실제 시각적 특성을 기반으로 디자인하세요.`;

      // 3단계: AI HTML 생성
      let html;

      if (images.length > 0) {
         console.log('🎨 Vision 모델 활성화: AI가 제품 이미지를 직접 분석합니다...');
         html = await generateContentWithImage(visionPrompt, images[0]);
      } else if (styleExamples && styleExamples.length > 0) {
         html = await generateContentWithImage(basePrompt, styleExamples[0].image);
      } else {
         html = await generateContent(basePrompt);
      }

      let cleanHTML = extractHTML(html);

      // 4단계: 이미지 플레이스홀더 교체
      images.forEach((imgData, index) => {
         const placeholder = new RegExp(`\\{\\{PRODUCT_IMAGE_${index}\\}\\}`, 'g');
         cleanHTML = cleanHTML.replace(placeholder, imgData);
      });

      cleanHTML = cleanHTML.replace(/\{\{PRODUCT_IMAGE\}\}/g, images[0]);

      // ✅ CSS 정제: html2canvas 호환성 보장
      cleanHTML = sanitizeCSS(cleanHTML);
      console.log('✅ 생성 완료 (OCR + CSS 정제)');

      return cleanHTML;
   } catch (error) {
      console.error('AI 디자인 생성 실패:', error);
      throw new Error(`디자인 생성 실패: ${error.message}`);
   }
}

/**
 * AI 카피라이팅 생성
 */
export async function generateAICopywriting(productName, description, imageAnalysis) {
   const prompt = `제품명: ${productName}
설명: ${description}
카테고리: ${imageAnalysis.category}

JSON만 반환하세요.`;

   try {
      const response = await generateContent(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
         return JSON.parse(jsonMatch[0]);
      }

      return {
         mainCopy: `${productName}로 시작하는 특별한 경험`,
         subCopy: description,
         features: [
            { icon: '⭐', title: '프리미엄 품질', text: '엄선된 최고급 원료' },
            { icon: '💝', title: '정성 가득', text: '마음을 담아 준비했습니다' },
            { icon: '🚚', title: '빠른 배송', text: '신속하게 전달합니다' },
         ],
         detailedDescription: `${productName}은(는) ${description}`,
         recommendation: '일상의 작은 사치를 경험해보세요',
      };
   } catch (error) {
      console.error('카피라이팅 생성 오류:', error);
      throw error;
   }
}
