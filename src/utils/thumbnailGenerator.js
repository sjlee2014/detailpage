/**
 * 썸네일 생성기
 * AI가 제품에 맞는 템플릿을 선택하고 동적 요소를 생성
 */

import { generateContent } from './geminiClient.js';
import * as templates from '../templates/thumbnails/index.js';

/**
 * AI가 제품에 맞는 템플릿 선택
 */
async function selectTemplate(productInfo, imageAnalysis) {
    const { productName, description } = productInfo;
    const { category, mood } = imageAnalysis;

    const prompt = `
당신은 디자인 전문가입니다. 다음 제품에 가장 어울리는 썸네일 템플릿을 선택하세요.

제품 정보:
- 제품명: ${productName}
- 설명: ${description}
- 카테고리: ${category}
- 분위기: ${mood}

템플릿 옵션:
1. heroSplit - 좌우 분할, 대담한 타이포그래피 (패션, 굿즈, 액세서리에 적합)
2. centerHero - 중앙 정렬, 깔끔하고 모던 (전자제품, 뷰티, 프리미엄에 적합)
3. verticalStack - 상하 분할, 그리드 (식품, 세트상품, 다양한 색상에 적합)
4. diagonalDynamic - 대각선, 역동적 (스포츠, 활동적, 젊은 타겟에 적합)
5. minimalElegance - 미니멀, 고급스러움 (럭셔리, 프리미엄, 미니멀에 적합)

**템플릿 이름만** 반환하세요 (예: heroSplit)
  `.trim();

    try {
        const response = await generateContent(prompt);
        const templateName = response.trim().toLowerCase();

        // 유효한 템플릿 이름인지 확인
        const validTemplates = ['herosplit', 'centerhero', 'verticalstack', 'diagonaldynamic', 'minimalelegance'];
        if (validTemplates.includes(templateName)) {
            console.log(`✅ AI가 선택한 템플릿: ${templateName}`);
            return templateName;
        }

        // 기본값: heroSplit
        console.warn('⚠️ AI 응답이 유효하지 않음, 기본 템플릿 사용');
        return 'herosplit';
    } catch (error) {
        console.error('❌ 템플릿 선택 실패:', error);
        return 'herosplit';
    }
}

/**
 * AI가 동적 요소 생성 (색상, 카피, 장식)
 */
async function generateDynamicElements(productInfo, imageAnalysis) {
    const { productName, description } = productInfo;
    const { colors, mood } = imageAnalysis;

    const prompt = `
당신은 디자인 전문가입니다. 다음 제품의 썸네일을 위한 디자인 요소를 생성하세요.

제품 정보:
- 제품명: ${productName}
- 설명: ${description}
- 주요 색상: ${colors.join(', ')}
- 분위기: ${mood}

다음 정보를 JSON 형식으로 반환하세요:
{
  "tagline": "감성적인 한 줄 카피 (15자 이내, 제품의 매력을 강조)",
  "titleColors": ["색상1", "색상2", "색상3"],
  "bgGradient": "linear-gradient(...)",
  "bgColor": "rgb(...)",
  "accentColor": "rgb(...)",
  "decorationColor": "rgb(...)",
  "diagonalBg": "linear-gradient(...)",
  "decoration": "clouds | mountains | circles | geometric | waves"
}

**중요**:
- tagline: 감성적이고 짧게 (예: "자연이 준 선물", "당신의 일상을 채우는")
- titleColors: 제품명을 분할할 색상 (가독성 좋은 진한 색상, rgb 형식)
- bgGradient: 배경 그라디언트 (제품 색상과 조화)
- decoration: 제품 분위기에 맞는 장식 요소 선택

JSON만 반환하세요.
  `.trim();

    try {
        const response = await generateContent(prompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const elements = JSON.parse(jsonMatch[0]);
            console.log('✅ 동적 요소 생성 완료:', elements);
            return elements;
        }

        // 기본값
        return getDefaultElements(colors);
    } catch (error) {
        console.error('❌ 동적 요소 생성 실패:', error);
        return getDefaultElements(colors);
    }
}

/**
 * 기본 동적 요소 (AI 실패 시)
 */
function getDefaultElements(colors) {
    return {
        tagline: "특별한 순간을 위한 선택",
        titleColors: ["rgb(220, 38, 127)", "rgb(33, 150, 243)", "rgb(26, 26, 26)"],
        bgGradient: "linear-gradient(135deg, rgb(245, 245, 245) 0%, rgb(230, 230, 230) 100%)",
        bgColor: "rgb(250, 250, 250)",
        accentColor: "rgb(33, 150, 243)",
        decorationColor: "rgb(50, 70, 100)",
        diagonalBg: "linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(220, 38, 127, 0.1) 100%)",
        decoration: "circles"
    };
}

/**
 * 템플릿 이름 매핑 (AI 응답 → 실제 함수 이름)
 */
const TEMPLATE_MAP = {
    'herosplit': 'generateHeroSplit',
    'centerhero': 'generateCenterHero',
    'verticalstack': 'generateVerticalStack',
    'diagonaldynamic': 'generateDiagonalDynamic',
    'minimalelegance': 'generateMinimalElegance'
};

/**
 * 썸네일 생성 메인 함수
 */
export async function generateThumbnail(productInfo, productImages, imageAnalysis) {
    console.log('🎨 썸네일 생성 시작...');

    try {
        // 1. AI가 템플릿 선택
        const templateName = await selectTemplate(productInfo, imageAnalysis);

        // 2. AI가 동적 요소 생성
        const dynamicElements = await generateDynamicElements(productInfo, imageAnalysis);

        // 3. 템플릿 함수 가져오기 (매핑 테이블 사용)
        const functionName = TEMPLATE_MAP[templateName];
        if (!functionName) {
            console.error(`❌ 템플릿 매핑을 찾을 수 없음: ${templateName}`);
            return null;
        }

        const templateFunction = templates[functionName];
        if (!templateFunction) {
            console.error(`❌ 템플릿 함수를 찾을 수 없음: ${functionName}`);
            return null;
        }

        // 4. 템플릿 렌더링
        const params = {
            productName: productInfo.productName,
            tagline: dynamicElements.tagline,
            images: productImages,
            colors: dynamicElements,
            decoration: dynamicElements.decoration
        };

        const thumbnailHTML = templateFunction(params);
        console.log('✅ 썸네일 생성 완료');

        return thumbnailHTML;
    } catch (error) {
        console.error('❌ 썸네일 생성 실패:', error);
        return null;
    }
}
