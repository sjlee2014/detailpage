/**
 * Gemini API 클라이언트
 * Google Gemini AI API 연동을 위한 유틸리티
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// API 키 확인
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error('⚠️ Gemini API 키가 설정되지 않았습니다. .env 파일을 확인하세요.');
}

// Gemini AI 초기화
let genAI = null;
let model = null;
let currentModelName = 'gemini-2.5-pro-preview-03-25'; // 🥇 Gemini 2.5 Pro (한국어 OCR 최강!)

/**
 * Gemini API 초기화
 */
export function initGemini(modelName = 'gemini-2.5-pro-preview-03-25') {
    if (!API_KEY) {
        throw new Error('API 키가 설정되지 않았습니다. .env 파일에 VITE_GEMINI_API_KEY를 추가하세요.');
    }

    try {
        genAI = new GoogleGenerativeAI(API_KEY);
        model = genAI.getGenerativeModel({ model: modelName });
        currentModelName = modelName;

        console.log(`✅ Gemini API 초기화 완료 (모델: ${modelName})`);
        return model;
    } catch (error) {
        console.error('Gemini 초기화 중 오류:', error);
        throw error;
    }
}

/**
 * 사용 가능한 모델 목록 조회 (디버깅용)
 */
export async function listAvailableModels() {
    if (!API_KEY) return [];

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.models) {
            console.log('📋 사용 가능한 모델 목록:', data.models.map(m => m.name));
            return data.models.map(m => m.name.replace('models/', ''));
        } else {
            console.error('모델 목록 조회 실패:', data);
            return [];
        }
    } catch (error) {
        console.error('모델 목록 요청 중 오류:', error);
        return [];
    }
}

/**
 * 사용 가능한 모델 찾기 및 연결 테스트
 */
export async function testConnection() {
    console.log('🔄 API 연결 및 모델 탐색 중...');

    // 1. 먼저 사용 가능한 모델 목록을 조회
    const availableModels = await listAvailableModels();

    let modelsToTry = [
        'gemini-2.5-pro-preview-03-25',  // 🥇 최신 최강 모델 (한국어 OCR 최고)
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash',
        'gemini-1.5-flash-002',
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-1.0-pro'
    ];

    // 조회된 모델이 있으면 그것을 우선 시도
    if (availableModels.length > 0) {
        console.log('✨ 조회된 모델로 테스트를 진행합니다:', availableModels);
        // generateContent를 지원하는 모델만 필터링
        const validModels = availableModels.filter(m =>
            (m.includes('gemini') || m.includes('flash') || m.includes('pro')) &&
            !m.includes('vision')
        );

        if (validModels.length > 0) {
            modelsToTry = [...validModels, ...modelsToTry];
            modelsToTry = [...new Set(modelsToTry)]; // 중복 제거
        }
    }

    for (const modelName of modelsToTry) {
        try {
            console.log(`Testing model: ${modelName}...`);
            const testModel = initGemini(modelName);
            const result = await testModel.generateContent('Hello');
            const response = await result.response;
            const text = response.text();

            console.log(`✅ 성공! 사용 가능한 모델: ${modelName}`);
            return { success: true, message: `연결 성공 (${modelName})`, model: modelName };
        } catch (error) {
            console.warn(`⚠️ 모델 ${modelName} 실패:`, error.message);
            // 계속 다음 모델 시도
        }
    }

    return { success: false, message: '사용 가능한 모델을 찾을 수 없습니다.' };
}

/**
 * 텍스트 생성 (기본)
 */
export async function generateContent(prompt) {
    try {
        if (!model) {
            initGemini();
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('텍스트 생성 실패:', error);

        // 404 에러인 경우 모델 재설정 시도
        if (error.message.includes('404') || error.message.includes('not found')) {
            console.log('⚠️ 모델을 찾을 수 없음, 연결 테스트를 통해 유효한 모델을 다시 찾습니다...');
            const connectionResult = await testConnection();
            if (connectionResult.success) {
                // 성공한 모델로 재시도
                return generateContent(prompt);
            }
        }

        throw new Error(`AI 생성 실패: ${error.message}`);
    }
}

/**
 * 이미지와 함께 콘텐츠 생성 (Vision API)
 */
export async function generateContentWithImage(prompt, imageData) {
    try {
        if (!model) {
            initGemini();
        }

        // base64 데이터에서 헤더 제거
        const base64Data = imageData.includes(',')
            ? imageData.split(',')[1]
            : imageData;

        // MIME 타입 추출
        let mimeType = 'image/jpeg';
        if (imageData.startsWith('data:')) {
            const matches = imageData.match(/data:([^;]+);/);
            if (matches && matches[1]) {
                mimeType = matches[1];
            }
        }

        const imageParts = [
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            },
        ];

        // 현재 모델이 비전 기능을 지원하는지 확인 (gemini-pro는 지원 안함)
        let targetModel = model;
        if (currentModelName === 'gemini-pro' || currentModelName === 'gemini-1.0-pro') {
            // 구형 텍스트 모델인 경우 비전 모델로 전환
            console.log('📷 비전 전용 모델로 전환 시도...');
            targetModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
        }

        const result = await targetModel.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('이미지 분석 실패:', error);
        throw new Error(`이미지 분석 실패: ${error.message}`);
    }
}

/**
 * 안전한 콘텐츠 생성 (에러 처리 포함)
 */
export async function safeGenerate(prompt, options = {}) {
    const {
        maxRetries = 2,
        timeout = 30000,
        onProgress = null,
    } = options;

    let lastError = null;

    for (let i = 0; i < maxRetries; i++) {
        try {
            if (onProgress) {
                onProgress(`생성 시도 중... (${i + 1}/${maxRetries})`);
            }

            // 타임아웃 설정
            const generatePromise = generateContent(prompt);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('시간 초과')), timeout)
            );

            const result = await Promise.race([generatePromise, timeoutPromise]);
            return result;
        } catch (error) {
            lastError = error;

            if (error.message.includes('quota') || error.message.includes('429')) {
                throw new Error('API 사용량 초과. 잠시 후 다시 시도해주세요.');
            }

            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    throw lastError || new Error('생성 실패');
}

/**
 * 제품 이미지 분석
 */
export async function analyzeProductImage(imageData) {
    const prompt = `
이 제품 이미지를 분석하여 다음 정보를 JSON 형식으로 반환해주세요:

{
  "category": "제품 카테고리 (예: 식품, 전자제품, 패션 등)",
  "colors": ["주요 색상1", "주요 색상2", "주요 색상3"],
  "features": ["특징1", "특징2", "특징3"],
  "mood": "전반적인 분위기 (예: 귀여운, 고급스러운, 심플한 등)",
  "recommendedStyle": "추천 디자인 스타일"
}

JSON만 반환하세요.
  `.trim();

    try {
        const response = await generateContentWithImage(prompt, imageData);

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return {
            category: '일반 제품',
            colors: ['#93c5fd', '#6ee7b7', '#fda4af'],
            features: ['고품질', '실용적', '스타일리시'],
            mood: '모던',
            recommendedStyle: '미니멀'
        };
    } catch (error) {
        console.error('이미지 분석 오류:', error);
        return {
            category: '일반 제품',
            colors: ['#93c5fd', '#6ee7b7', '#fda4af'],
            features: ['고품질', '실용적', '스타일리시'],
            mood: '모던',
            recommendedStyle: '미니멀'
        };
    }
}

/**
 * 🆕 이미지에서 텍스트 추출 (OCR)
 */
export async function extractTextFromImage(imageData) {
    const prompt = `
이 이미지에서 보이는 모든 텍스트를 추출해주세요.

규칙:
- 한국어 텍스트를 정확히 읽어주세요
- 여러 텍스트가 있다면 모두 추출
- 텍스트만 반환 (설명 없이)
- 텍스트가 없으면 "없음" 반환

형식:
텍스트1
텍스트2
...
    `.trim();

    try {
        const response = await generateContentWithImage(prompt, imageData);
        const text = response.trim();

        if (text && text !== '없음' && text.length > 0) {
            console.log('📝 OCR 추출 텍스트:', text);
            return text;
        }

        return null;
    } catch (error) {
        console.error('OCR 추출 실패:', error);
        return null;
    }
}

/**
 * 스타일 이미지 심층 분석 (Deep Style DNA)
 */
export async function analyzeStyleImage(imageData) {
    const prompt = `
당신은 수석 UI/UX 디자이너입니다. 이 디자인 이미지를 픽셀 단위로 분석하여 "디자인 시스템 명세서(Design System Spec)"를 작성해주세요.
다음 항목들을 상세하게 분석하여 JSON 형식으로 반환하세요:

{
  "concept": {
    "mood": "전반적인 분위기 (예: 미니멀하지만 따뜻한, 미래지향적이고 차가운)",
    "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
  },
  "colors": {
    "primary": "주조색 (Hex 코드 및 역할 설명)",
    "secondary": "보조색 (Hex 코드 및 역할 설명)",
    "background": "배경색 (Hex 코드)",
    "text": "주요 텍스트 색상 (Hex 코드)",
    "accent": "강조색 (Hex 코드)"
  },
  "typography": {
    "headings": "헤드라인 스타일 (폰트 종류, 굵기, 자간, 대소문자 여부 등 상세 묘사)",
    "body": "본문 스타일 (가독성, 줄간격, 폰트 느낌)",
    "scale": "폰트 크기 대비 (예: 제목과 본문의 크기 차이가 큼/작음)"
  },
  "layout": {
    "structure": "전체적인 구조 (예: 1단 컬럼 중심, 지그재그 배치, 카드형 그리드)",
    "spacing": "여백 사용 (예: 매우 넓은 여백으로 고급스러움 강조, 촘촘한 정보 밀도)",
    "alignment": "정렬 방식 (중앙 정렬 중심, 좌측 정렬 등)"
  },
  "components": {
    "buttons": "버튼 스타일 (모서리 둥글기, 그림자 유무, 그라데이션, 테두리 스타일)",
    "cards": "카드/컨테이너 스타일 (배경색, 테두리, 그림자, 모서리)",
    "images": "이미지 처리 방식 (모서리 둥글기, 필터 적용, 테두리 유무)"
  }
}

JSON만 반환하세요. 설명은 필요 없습니다.
  `.trim();

    try {
        const response = await generateContentWithImage(prompt, imageData);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null;
    } catch (error) {
        console.error('스타일 심층 분석 실패:', error);
        return null;
    }
}

// 초기화
if (API_KEY) {
    try {
        initGemini();
    } catch (e) {
        console.error(e);
    }
}
