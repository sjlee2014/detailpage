/**
 * Ollama 로컬 AI 클라이언트
 * LLaMA 3.2 Vision 모델 사용
 */

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const MODEL_NAME = 'llama3.2-vision:latest';

/**
 * Ollama 서버 상태 확인
 */
export async function checkOllamaStatus() {
    try {
        const response = await fetch('http://localhost:11434/api/tags');
        if (response.ok) {
            const data = await response.json();
            const hasModel = data.models?.some(m => m.name.includes('llama3.2'));
            return { available: true, hasModel };
        }
        return { available: false, hasModel: false };
    } catch (error) {
        return { available: false, hasModel: false, error: error.message };
    }
}

/**
 * Ollama로 텍스트 생성
 */
export async function generateWithOllama(prompt, options = {}) {
    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: MODEL_NAME,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    ...options
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }

        const data = await response.json();
        return { success: true, text: data.response };
    } catch (error) {
        console.error('Ollama error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * 구성품 추천 생성
 */
export async function generateComponents(productName) {
    const prompt = `당신은 DIY 공예 키트 전문가입니다.

제품명: "${productName}"

이 DIY 공예 키트에 포함될 구성품 목록을 5-8개 추천해주세요.
반드시 아래 JSON 형식으로만 응답하세요. 다른 설명 없이 JSON만 출력하세요.

[
  {"icon": "📦", "name": "구성품 이름", "qty": "수량"},
  {"icon": "🎨", "name": "구성품 이름", "qty": "수량"}
]

아이콘은 이 중에서 선택: 📦 🎨 ✂️ 🧵 📐 🖌️ 💎 🪡 🎀 ⭐`;

    const result = await generateWithOllama(prompt);

    if (result.success) {
        try {
            // JSON 파싱 시도
            const jsonMatch = result.text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const components = JSON.parse(jsonMatch[0]);
                return { success: true, components };
            }
        } catch (e) {
            console.error('JSON parse error:', e);
        }
    }

    // 실패 시 기본값 반환
    return {
        success: false,
        components: [
            { icon: '📦', name: '기본 재료', qty: '1세트' },
            { icon: '✂️', name: '가위', qty: '1개' },
            { icon: '🖌️', name: '붓', qty: '1개' }
        ],
        error: result.error || 'AI 응답 파싱 실패'
    };
}

/**
 * 만들기 단계 추천 생성
 */
export async function generateSteps(productName) {
    const prompt = `당신은 DIY 공예 전문 강사입니다.

제품명: "${productName}"

이 DIY 공예품의 만들기 순서를 4-6단계로 작성해주세요.
반드시 아래 JSON 형식으로만 응답하세요. 다른 설명 없이 JSON만 출력하세요.

[
  {"title": "단계 제목", "description": "상세 설명 (2-3문장)"},
  {"title": "단계 제목", "description": "상세 설명 (2-3문장)"}
]`;

    const result = await generateWithOllama(prompt);

    if (result.success) {
        try {
            const jsonMatch = result.text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const steps = JSON.parse(jsonMatch[0]);
                return { success: true, steps };
            }
        } catch (e) {
            console.error('JSON parse error:', e);
        }
    }

    // 실패 시 기본값 반환
    return {
        success: false,
        steps: [
            { title: '재료 준비하기', description: '모든 재료와 도구를 준비합니다.' },
            { title: '기본 작업', description: '설명서를 따라 기본 작업을 진행합니다.' },
            { title: '조립하기', description: '각 부품을 순서대로 조립합니다.' },
            { title: '마무리', description: '완성된 작품을 정리하고 마무리합니다.' }
        ],
        error: result.error || 'AI 응답 파싱 실패'
    };
}

export default {
    checkOllamaStatus,
    generateWithOllama,
    generateComponents,
    generateSteps
};
