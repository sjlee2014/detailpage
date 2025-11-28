/**
 * AI 카피라이팅 유틸리티
 * 입력된 짧은 설명을 바탕으로 상세하고 감성적인 텍스트를 생성합니다.
 */

/**
 * 키워드 추출 및 분석
 */
function analyzeKeywords(text) {
  const keywords = {
    quality: ['신선', '최상급', '프리미엄', '고급', '엄선', '특별', '국내산', '유기농', '천연', '순수'],
    taste: ['맛있', '달콤', '고소', '부드러', '아삭', '촉촉', '진한', '깊은'],
    health: ['건강', '영양', '비타민', '무농약', '안전', '웰빙'],
    emotion: ['행복', '따뜻', '사랑', '정성', '마음'],
  };
  
  const found = {
    quality: [],
    taste: [],
    health: [],
    emotion: [],
  };
  
  Object.keys(keywords).forEach(category => {
    keywords[category].forEach(word => {
      if (text.includes(word)) {
        found[category].push(word);
      }
    });
  });
  
  return found;
}

/**
 * 메인 카피 생성
 */
function generateMainCopy(productName, description) {
  const templates = [
    `매일의 특별함을 선사하는 ${productName}`,
    `${productName}로 시작하는 행복한 하루`,
    `당신을 위한 프리미엄 ${productName}`,
    `감동을 전하는 ${productName}`,
    `특별한 순간을 위한 ${productName}`,
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * 서브 카피 생성
 */
function generateSubCopy(productName, description, keywords) {
  const hasQuality = keywords.quality.length > 0;
  const hasHealth = keywords.health.length > 0;
  
  if (hasHealth) {
    return `건강을 생각하는 똑똑한 선택, 매일 신선함을 느껴보세요`;
  } else if (hasQuality) {
    return `엄선된 최상급 품질로 특별한 경험을 선사합니다`;
  } else {
    return `일상에 작은 행복을 더해줄 ${productName}`;
  }
}

/**
 * 특징 포인트 생성 (3-4개)
 */
function generateFeatures(productName, description, keywords) {
  const baseFeatures = [];
  
  // 키워드 기반 특징 추가
  if (keywords.quality.length > 0) {
    baseFeatures.push({
      icon: '⭐',
      title: '프리미엄 품질',
      text: '엄선된 최상급 원료만을 사용합니다'
    });
  }
  
  if (keywords.health.length > 0) {
    baseFeatures.push({
      icon: '🌿',
      title: '건강한 선택',
      text: '영양과 안전을 최우선으로 합니다'
    });
  }
  
  if (keywords.taste.length > 0) {
    baseFeatures.push({
      icon: '😋',
      title: '풍부한 맛',
      text: '한 입 베어물면 퍼지는 깊은 풍미'
    });
  }
  
  // 기본 특징 추가
  baseFeatures.push({
    icon: '💝',
    title: '정성 가득',
    text: '마음을 담아 정성스럽게 준비했습니다'
  });
  
  baseFeatures.push({
    icon: '🚚',
    title: '신속 배송',
    text: '신선함을 유지하여 빠르게 배송합니다'
  });
  
  // 최대 4개만 반환
  return baseFeatures.slice(0, 4);
}

/**
 * 상세 설명 확장
 */
function generateDetailedDescription(productName, description, keywords) {
  const intro = `${productName}은(는) ${description}`;
  
  const hasQuality = keywords.quality.length > 0;
  const hasTaste = keywords.taste.length > 0;
  const hasHealth = keywords.health.length > 0;
  
  let details = [intro];
  
  if (hasQuality) {
    details.push('최상급 품질 기준을 통과한 엄선된 제품만을 고객님께 전달해드립니다.');
  }
  
  if (hasTaste) {
    details.push('한 입 베어물면 입안 가득 퍼지는 풍부한 맛과 향을 경험하실 수 있습니다.');
  }
  
  if (hasHealth) {
    details.push('가족의 건강을 생각하는 마음으로 안전하고 영양가 높은 제품을 선별했습니다.');
  }
  
  details.push('일상에 작은 행복과 특별함을 선사할 이 제품을 지금 만나보세요.');
  
  return details.join(' ');
}

/**
 * 추천 포인트 생성
 */
function generateRecommendation(productName, description, keywords) {
  const recommendations = [
    '가족 모두가 함께 즐길 수 있는 제품입니다',
    '매일 먹어도 질리지 않는 맛과 품질',
    '선물로도 손색없는 프리미엄 제품',
    '한번 맛보면 계속 찾게 되는 특별함',
    '일상의 작은 사치를 경험해보세요',
  ];
  
  return recommendations[Math.floor(Math.random() * recommendations.length)];
}

/**
 * 전체 카피라이팅 생성
 */
export function generateCopywriting(productName, description) {
  if (!productName || !description) {
    throw new Error('제품명과 설명을 모두 입력해주세요');
  }
  
  const keywords = analyzeKeywords(description);
  
  return {
    mainCopy: generateMainCopy(productName, description),
    subCopy: generateSubCopy(productName, description, keywords),
    features: generateFeatures(productName, description, keywords),
    detailedDescription: generateDetailedDescription(productName, description, keywords),
    recommendation: generateRecommendation(productName, description, keywords),
    productName,
    originalDescription: description,
  };
}
