/**
 * 썸네일 템플릿 모음
 * 5개의 다양한 레이아웃 템플릿 export
 */

export { generateHeroSplit } from './heroSplit.js';
export { generateCenterHero } from './centerHero.js';
export { generateVerticalStack } from './verticalStack.js';
export { generateDiagonalDynamic } from './diagonalDynamic.js';
export { generateMinimalElegance } from './minimalElegance.js';
export { generateLayeredArch } from './layeredArch.js';

/**
 * 템플릿 메타데이터
 */
export const TEMPLATE_META = {
    heroSplit: {
        name: 'Hero Split',
        description: '좌우 분할 - 대담한 타이포그래피',
        suitableFor: ['패션', '굿즈', '액세서리', '문구', '장난감']
    },
    centerHero: {
        name: 'Center Hero',
        description: '중앙 정렬 - 깔끔하고 모던',
        suitableFor: ['전자제품', '뷰티', '프리미엄', '화장품', '향수']
    },
    verticalStack: {
        name: 'Vertical Stack',
        description: '상하 분할 - 그리드 레이아웃',
        suitableFor: ['식품', '세트상품', '다양한색상', '의류', '잡화']
    },
    diagonalDynamic: {
        name: 'Diagonal Dynamic',
        description: '대각선 - 역동적이고 젊은',
        suitableFor: ['스포츠', '활동적', '젊은타겟', '게임', '취미']
    },
    minimalElegance: {
        name: 'Minimal Elegance',
        description: '미니멀 - 고급스럽고 세련',
        suitableFor: ['럭셔리', '프리미엄', '미니멀', '고급', '예술']
    },
    layeredArch: {
        name: 'Layered Arch',
        description: '아치형 창문 - 고급스러운 감성 (고퀄리티)',
        suitableFor: ['감성', '굿즈', '예술', '인테리어', '프리미엄']
    }
};
