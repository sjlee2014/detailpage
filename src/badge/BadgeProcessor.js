/**
 * Badge Processor - 뱃지 이미지 처리 모듈 (간소화 버전)
 * 
 * 기능:
 * 1. 스마트 원형 감지 - 이미지에서 원형 콘텐츠 자동 감지
 * 2. 배경 자동 제거 - 흰색/회색 배경 및 기존 그림자 제거
 * 3. 일관된 뱃지 효과 - 돔, 그림자, 하이라이트 적용
 * 
 * 출력물:
 * 1. 인쇄용 (뱃지 기계용, 7.5cm) - 재단선 포함
 * 2. 상세페이지용 (뱃지 효과 적용)
 */

// Constants
const BADGE_SIZE = 886; // 7.5cm at 300dpi (for print)

class BadgeProcessor {
    constructor() {
        this.originalImage = null;
        this.extractedImage = null;
        this.initEventListeners();
    }

    initEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');
        const downloadPrint = document.getElementById('downloadPrint');
        const downloadWeb = document.getElementById('downloadWeb');
        const downloadAll = document.getElementById('downloadAll');
        const resetBtn = document.getElementById('resetBtn');

        // Upload area click
        uploadArea.addEventListener('click', () => imageInput.click());

        // File input change
        imageInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.handleImageUpload(e.target.files[0]);
            }
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files[0]) {
                this.handleImageUpload(e.dataTransfer.files[0]);
            }
        });

        // Download buttons
        downloadPrint.addEventListener('click', () => this.downloadCanvas('printCanvas', '뱃지_인쇄용_7.5cm.png'));
        downloadWeb.addEventListener('click', () => this.downloadCanvas('webCanvas', '뱃지_상세페이지용.png'));
        downloadAll.addEventListener('click', () => this.downloadAllAsZip());

        // Reset button
        resetBtn.addEventListener('click', () => this.reset());
    }

    handleImageUpload(file) {
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.smartExtractAndProcess(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    /**
     * 스마트 추출 및 처리
     */
    smartExtractAndProcess(img) {
        // 분석용 캔버스 생성
        const analysisCanvas = document.createElement('canvas');
        const analysisCtx = analysisCanvas.getContext('2d');

        const analysisSize = 400;
        analysisCanvas.width = analysisSize;
        analysisCanvas.height = analysisSize;

        const scale = Math.max(analysisSize / img.width, analysisSize / img.height);
        const scaledW = img.width * scale;
        const scaledH = img.height * scale;
        const offsetX = (analysisSize - scaledW) / 2;
        const offsetY = (analysisSize - scaledH) / 2;

        analysisCtx.fillStyle = 'white';
        analysisCtx.fillRect(0, 0, analysisSize, analysisSize);
        analysisCtx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

        // 원형 영역 감지
        const circleInfo = this.detectCircle(analysisCtx, analysisSize);

        // 추출된 이미지 생성
        this.extractedImage = this.extractCircularContent(img, circleInfo);

        // Show preview section
        document.getElementById('previewSection').style.display = 'block';
        document.querySelector('.upload-section').style.display = 'none';

        // Process both versions
        this.createPrintVersion(this.extractedImage);
        this.createWebVersion(this.extractedImage);
    }

    /**
     * 원형 영역 감지 알고리즘
     */
    detectCircle(ctx, size) {
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        // 배경색 감지 (모서리 샘플링)
        const corners = [
            { x: 5, y: 5 },
            { x: size - 5, y: 5 },
            { x: 5, y: size - 5 },
            { x: size - 5, y: size - 5 }
        ];

        let bgR = 0, bgG = 0, bgB = 0;
        corners.forEach(corner => {
            const idx = (corner.y * size + corner.x) * 4;
            bgR += data[idx];
            bgG += data[idx + 1];
            bgB += data[idx + 2];
        });
        bgR /= 4; bgG /= 4; bgB /= 4;

        // 배경과 다른 픽셀 찾기
        const contentPixels = [];
        const bgThreshold = 40;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = (y * size + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);

                if (diff > bgThreshold) {
                    contentPixels.push({ x, y });
                }
            }
        }

        if (contentPixels.length < 100) {
            return {
                centerX: 0.5,
                centerY: 0.5,
                radius: 0.5,
                hasCircle: false
            };
        }

        // 바운딩 박스 계산
        let minX = size, maxX = 0, minY = size, maxY = 0;
        contentPixels.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        });

        // 원형 피팅
        const centerX = (minX + maxX) / 2 / size;
        const centerY = (minY + maxY) / 2 / size;
        const width = (maxX - minX) / size;
        const height = (maxY - minY) / size;
        const radius = Math.max(width, height) / 2;

        const aspectRatio = width / height;
        const isCircular = aspectRatio > 0.85 && aspectRatio < 1.15;

        return {
            centerX,
            centerY,
            radius: radius * 1.05,
            hasCircle: isCircular
        };
    }

    /**
     * 원형 콘텐츠 추출
     */
    extractCircularContent(img, circleInfo) {
        const extractCanvas = document.createElement('canvas');
        const extractCtx = extractCanvas.getContext('2d');

        const outputSize = BADGE_SIZE;
        extractCanvas.width = outputSize;
        extractCanvas.height = outputSize;

        extractCtx.fillStyle = 'white';
        extractCtx.fillRect(0, 0, outputSize, outputSize);

        if (circleInfo.hasCircle) {
            const srcCenterX = circleInfo.centerX * img.width;
            const srcCenterY = circleInfo.centerY * img.height;
            const srcRadius = circleInfo.radius * Math.max(img.width, img.height);

            const srcX = srcCenterX - srcRadius;
            const srcY = srcCenterY - srcRadius;
            const srcSize = srcRadius * 2;

            extractCtx.save();
            extractCtx.beginPath();
            extractCtx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
            extractCtx.clip();

            extractCtx.drawImage(
                img,
                srcX, srcY, srcSize, srcSize,
                0, 0, outputSize, outputSize
            );

            extractCtx.restore();
        } else {
            extractCtx.save();
            extractCtx.beginPath();
            extractCtx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
            extractCtx.clip();

            const scale = Math.max(outputSize / img.width, outputSize / img.height);
            const scaledW = img.width * scale;
            const scaledH = img.height * scale;
            const offsetX = (outputSize - scaledW) / 2;
            const offsetY = (outputSize - scaledH) / 2;

            extractCtx.drawImage(img, offsetX, offsetY, scaledW, scaledH);
            extractCtx.restore();
        }

        return extractCanvas;
    }

    /**
     * 인쇄용 (뱃지 기계용) - 플랫, 재단선 포함
     */
    createPrintVersion(sourceImg) {
        const canvas = document.getElementById('printCanvas');
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, BADGE_SIZE, BADGE_SIZE);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, BADGE_SIZE, BADGE_SIZE);

        // Create circular clip
        ctx.save();
        ctx.beginPath();
        ctx.arc(BADGE_SIZE / 2, BADGE_SIZE / 2, BADGE_SIZE / 2, 0, Math.PI * 2);
        ctx.clip();

        // Draw image
        ctx.drawImage(sourceImg, 0, 0, BADGE_SIZE, BADGE_SIZE);

        ctx.restore();

        // Draw cut line (재단선)
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.arc(BADGE_SIZE / 2, BADGE_SIZE / 2, BADGE_SIZE / 2 - 1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * 상세페이지용 - 뱃지 효과 (돔, 그림자, 하이라이트)
     */
    createWebVersion(sourceImg) {
        const canvas = document.getElementById('webCanvas');
        const ctx = canvas.getContext('2d');
        const size = BADGE_SIZE;
        const centerX = size / 2;
        const centerY = size / 2;
        const badgeRadius = size / 2 - 35;

        canvas.width = size;
        canvas.height = size;
        ctx.clearRect(0, 0, size, size);

        // 1. 드롭 쉐도우
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX, centerY, badgeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. 이미지 클리핑
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, badgeRadius, 0, Math.PI * 2);
        ctx.clip();

        const margin = 35;
        ctx.drawImage(sourceImg, margin, margin, size - margin * 2, size - margin * 2);
        ctx.restore();

        // 3. 돔 효과
        const domeGradient = ctx.createRadialGradient(
            centerX, centerY - badgeRadius * 0.3, 0,
            centerX, centerY, badgeRadius
        );
        domeGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        domeGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
        domeGradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.03)');
        domeGradient.addColorStop(0.95, 'rgba(0, 0, 0, 0.08)');
        domeGradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, badgeRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = domeGradient;
        ctx.fillRect(0, 0, size, size);
        ctx.restore();

        // 4. 상단 하이라이트
        const highlightGradient = ctx.createLinearGradient(
            centerX, centerY - badgeRadius,
            centerX, centerY + badgeRadius * 0.3
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        highlightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.15)');
        highlightGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.05)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, badgeRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = highlightGradient;
        ctx.fillRect(0, 0, size, size);
        ctx.restore();

        // 5. 하단 그림자
        const bottomShadow = ctx.createLinearGradient(
            centerX, centerY + badgeRadius * 0.5,
            centerX, centerY + badgeRadius
        );
        bottomShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
        bottomShadow.addColorStop(0.5, 'rgba(0, 0, 0, 0.05)');
        bottomShadow.addColorStop(1, 'rgba(0, 0, 0, 0.12)');

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, badgeRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = bottomShadow;
        ctx.fillRect(0, 0, size, size);
        ctx.restore();

        // 6. 테두리
        ctx.beginPath();
        ctx.arc(centerX, centerY, badgeRadius - 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    /**
     * Canvas를 PNG로 다운로드
     */
    downloadCanvas(canvasId, filename) {
        const canvas = document.getElementById(canvasId);
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    /**
     * 전체를 ZIP으로 다운로드
     */
    async downloadAllAsZip() {
        const zip = new JSZip();

        const canvases = [
            { id: 'printCanvas', name: '뱃지_인쇄용_7.5cm.png' },
            { id: 'webCanvas', name: '뱃지_상세페이지용.png' }
        ];

        for (const { id, name } of canvases) {
            const canvas = document.getElementById(id);
            const dataUrl = canvas.toDataURL('image/png');
            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
            zip.file(name, base64Data, { base64: true });
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.download = 'badge_set.zip';
        link.href = URL.createObjectURL(content);
        link.click();
    }

    /**
     * 리셋
     */
    reset() {
        this.originalImage = null;
        this.extractedImage = null;
        document.getElementById('previewSection').style.display = 'none';
        document.querySelector('.upload-section').style.display = 'block';
        document.getElementById('imageInput').value = '';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new BadgeProcessor();
});
