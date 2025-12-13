/**
 * 템플릿 생성기 + 썸네일 생성기 진입점
 * 탭으로 통합
 */
import TemplatePageGenerator from './components/TemplatePageGenerator.js';
import ThumbnailGenerator from './components/ThumbnailGenerator.js';

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 상세페이지 생성기 초기화
    const detailGenerator = new TemplatePageGenerator('tab-detail-page');
    console.log('🎨 Template Page Generator initialized');

    // 썸네일 생성기는 탭 전환 시 초기화 (레이지 로딩)
    let thumbnailGenerator = null;

    // 탭 전환 이벤트
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            // 탭 버튼 활성화
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // 탭 컨텐츠 표시
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`tab-${tabId}`).classList.add('active');

            // 썸네일 탭 첫 진입 시 초기화
            if (tabId === 'thumbnail' && !thumbnailGenerator) {
                thumbnailGenerator = new ThumbnailGenerator('tab-thumbnail');
                console.log('🖼️ Thumbnail Generator initialized');
            }
        });
    });
});
