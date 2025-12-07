/**
 * AI 카피라이팅 유틸리티 - Slot Filling Architecture
 * Gemini API를 사용하여 제품 상세페이지용 카피를 생성합니다.
 * 
 * 출력 형식: JSON (headline, subCopy, features, painPoint)
 */

import { generateContent } from './geminiClient.js';

/**
 * Few-shot 프롬프트 예시 (잘 팔리는 문구)
 */
const FEW_SHOT_EXAMPLES = `
예시 1:
- 상황: 프리미엄 수제 마카롱 판매
- 헤드라인: "한 입에 파리를 담다"
- 서브카피: "프랑스 정통 레시피로 완성한, 오늘 구운 마카롱"
- 페인포인트: "고민하는 사이, 오늘의 마카롱은 품절됩니다"

예시 2:
- 상황: 어린이 교육 교구 판매
- 헤드라인: "선생님들이 먼저 찾는 이유"
- 서브카피: "아이의 호기심을 깨우는 15분의 마법"
- 페인포인트: "지금 시작하면, 아이가 달라집니다"

예시 3:
- 상황: 핸드메이드 가죽 지갑
- 헤드라인: "10년 후에도 당신 곁에"
- 서브카피: "장인이 하나하나 손으로 바느질한 풀그레인 레더"
- 페인포인트: "싸구려는 질립니다. 진짜가 필요할 때"
`.trim();

/**
 * Gemini를 통해 상세페이지 카피 생성
 * @param {string} productName - 제품명
 * @param {string} description - 제품 설명
 * @returns {Promise<Object>} 카피라이팅 JSON 객체
 */
export async function generateCopywriting(productName, description) {
  if (!productName || !description) {
    throw new Error('제품명과 설명을 모두 입력해주세요');
  }

  const prompt = `
당신은 쿠팡, 네이버 스마트스토어에서 수천만 원 매출을 내는 상세페이지 전문 카피라이터입니다.
아래 제품 정보를 바탕으로 "사고 싶게 만드는" 감성적인 카피를 작성하세요.

${FEW_SHOT_EXAMPLES}

---

이제 다음 제품의 카피를 작성하세요:

제품명: ${productName}
제품 설명: ${description}

**작성 규칙:**
1. **헤드라인**: 한 줄로 마음을 사로잡는 임팩트 있는 문구 (15자 이내 권장)
2. **서브카피**: 헤드라인을 보완하는 부드러운 설명 (30자 이내)
3. **특징 3가지**: 제품의 핵심 셀링포인트. 각각 이모지, 타이틀(10자 이내), 설명(20자 이내)
4. **페인포인트 해결**: 고객의 고민을 자극하고 행동을 유도하는 문구 (25자 이내)

**반드시 아래 JSON 형식으로만 응답하세요:**

\`\`\`json
{
  "headline": "헤드라인 문구",
  "subCopy": "서브 카피 문구",
  "features": [
    { "icon": "이모지", "title": "특징 제목", "desc": "특징 설명" },
    { "icon": "이모지", "title": "특징 제목", "desc": "특징 설명" },
    { "icon": "이모지", "title": "특징 제목", "desc": "특징 설명" }
  ],
  "painPoint": "페인포인트 해결 문구"
}
\`\`\`

JSON만 반환하세요. 다른 설명은 하지 마세요.
  `.trim();

  try {
    console.log('✍️ AI 카피라이팅 생성 중...');
    const response = await generateContent(prompt);

    // JSON 추출
    const jsonMatch = response.match(/```json\s*([\s\S]*?)```/) || response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const result = JSON.parse(jsonStr.trim());

      // 필수 필드 검증
      if (!result.headline || !result.subCopy || !result.features || !result.painPoint) {
        throw new Error('필수 필드가 누락되었습니다');
      }

      // features 배열 검증 및 보정
      if (!Array.isArray(result.features) || result.features.length < 3) {
        result.features = ensureThreeFeatures(result.features || []);
      }

      console.log('✅ AI 카피라이팅 생성 완료:', result.headline);
      return result;
    }

    throw new Error('JSON 파싱 실패');

  } catch (error) {
    console.error('❌ 카피라이팅 생성 실패:', error.message);

    // 폴백: 기본 카피 반환
    return getDefaultCopywriting(productName, description);
  }
}

/**
 * 특징 배열이 3개 미만일 때 기본값으로 채움
 */
function ensureThreeFeatures(features) {
  const defaults = [
    { icon: '⭐', title: '프리미엄 품질', desc: '엄선된 최상급 원료만 사용' },
    { icon: '💝', title: '정성 가득', desc: '하나하나 마음을 담아 제작' },
    { icon: '🚚', title: '빠른 배송', desc: '주문 후 빠르게 전달해드려요' }
  ];

  const result = [...features];
  for (let i = result.length; i < 3; i++) {
    result.push(defaults[i]);
  }

  return result.slice(0, 3);
}

/**
 * API 실패 시 기본 카피라이팅 반환
 */
function getDefaultCopywriting(productName, description) {
  console.warn('⚠️ 기본 카피라이팅 사용');

  return {
    headline: `${productName}, 특별함을 선물하세요`,
    subCopy: description.length > 30 ? description.substring(0, 30) + '...' : description,
    features: [
      { icon: '⭐', title: '프리미엄 품질', desc: '엄선된 최상급 원료만 사용' },
      { icon: '💝', title: '정성 가득', desc: '하나하나 마음을 담아 제작' },
      { icon: '🚚', title: '빠른 배송', desc: '주문 후 빠르게 전달해드려요' }
    ],
    painPoint: '지금 결정하세요. 특별함은 기다려주지 않아요.'
  };
}
