/**
 * Badge Processor - 뱃지 이미지 처리 모듈
 * 색칠본 이미지로 3가지 출력물 생성:
 * 1. 인쇄용 (뱃지 기계용, 7.5cm)
 * 2. 색칠본 (상세페이지용 컬러)
 * 3. 비색칠본 (상세페이지용 라인아트)
 */

// Constants
const BADGE_SIZE = 886; // 7.5cm at 300dpi (for print)
const WEB_SIZE = 600; // Web display size
const BADGE_DIAMETER_CM = 7.5;

class BadgeProcessor {
    constructor() {
        this.originalImage = null;
        this.initEventListeners();
    }

    initEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');
        const downloadLineArt = document.getElementById('downloadLineArt');
        const downloadColored = document.getElementById('downloadColored');
        const downloadPrint = document.getElementById('downloadPrint');
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
        downloadLineArt.addEventListener('click', () => this.downloadCanvas('lineArtCanvas', '뱃지_인쇄용_7.5cm.png'));
        downloadColored.addEventListener('click', () => this.downloadCanvas('coloredCanvas', '뱃지_색칠본_상세페이지용.png'));
        downloadPrint.addEventListener('click', () => this.downloadCanvas('printCanvas', '뱃지_비색칠본_상세페이지용.png'));
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
                this.processImage(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    processImage(img) {
        // Show preview section
        document.getElementById('previewSection').style.display = 'block';
        document.querySelector('.upload-section').style.display = 'none';

        // Process all three versions
        this.createPrintLineArt(img);     // 인쇄용 (비색칠본, 886px)
        this.createColoredForWeb(img);    // 색칠본 (상세페이지용)
        this.createLineArtForWeb(img);    // 비색칠본 (상세페이지용)
    }

    /**
     * 인쇄용 템플릿 생성 (7.5cm, 뱃지 기계용)
     * - 비색칠본 (라인아트)
     * - 정확한 886px 사이즈
     * - 재단선 포함
     */
    createPrintLineArt(img) {
        const canvas = document.getElementById('lineArtCanvas');
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, BADGE_SIZE, BADGE_SIZE);

        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, BADGE_SIZE, BADGE_SIZE);

        // Create circular clip for the badge area
        ctx.save();
        ctx.beginPath();
        ctx.arc(BADGE_SIZE / 2, BADGE_SIZE / 2, BADGE_SIZE / 2, 0, Math.PI * 2);
        ctx.clip();

        // Draw image - fill entire circle
        const scale = Math.max(BADGE_SIZE / img.width, BADGE_SIZE / img.height);
        const x = (BADGE_SIZE - img.width * scale) / 2;
        const y = (BADGE_SIZE - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        ctx.restore();

        // Convert to line art (grayscale + threshold)
        const imageData = ctx.getImageData(0, 0, BADGE_SIZE, BADGE_SIZE);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const threshold = 180;
            const value = gray > threshold ? 255 : (gray < 60 ? 0 : gray * 1.3);
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
        }

        ctx.putImageData(imageData, 0, 0);

        // Draw cut line (재단선) - dashed circle at the edge
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.arc(BADGE_SIZE / 2, BADGE_SIZE / 2, BADGE_SIZE / 2 - 1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * 색칠본 (상세페이지용) - 컬러 이미지
     * 투명 배경에 원형 뱃지만 출력
     */
    createColoredForWeb(img) {
        const canvas = document.getElementById('coloredCanvas');
        const ctx = canvas.getContext('2d');
        const size = WEB_SIZE;
        const badgeRadius = size / 2 - 10; // 뱃지 크기 (여백 최소화)

        // Resize canvas for web
        canvas.width = size;
        canvas.height = size;

        // Clear canvas (transparent)
        ctx.clearRect(0, 0, size, size);

        // Draw circular clip
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, badgeRadius, 0, Math.PI * 2);
        ctx.clip();

        // Draw image to fill the entire badge circle
        const scale = Math.max((badgeRadius * 2) / img.width, (badgeRadius * 2) / img.height);
        const imgW = img.width * scale;
        const imgH = img.height * scale;
        const x = (size - imgW) / 2;
        const y = (size - imgH) / 2;
        ctx.drawImage(img, x, y, imgW, imgH);

        ctx.restore();

        // Draw badge border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, badgeRadius - 1, 0, Math.PI * 2);
        ctx.stroke();
    }

    /**
     * 비색칠본 (상세페이지용) - 라인아트
     * 투명 배경에 원형 뱃지만 출력
     */
    createLineArtForWeb(img) {
        const canvas = document.getElementById('printCanvas');
        const ctx = canvas.getContext('2d');
        const size = WEB_SIZE;
        const badgeRadius = size / 2 - 10; // 색칠본과 동일한 크기

        // Resize canvas for web
        canvas.width = size;
        canvas.height = size;

        // Clear canvas (transparent)
        ctx.clearRect(0, 0, size, size);

        // Fill white circle for line art background
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, badgeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw circular clip
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, badgeRadius, 0, Math.PI * 2);
        ctx.clip();

        // Draw image to fill the entire badge circle
        const scale = Math.max((badgeRadius * 2) / img.width, (badgeRadius * 2) / img.height);
        const imgW = img.width * scale;
        const imgH = img.height * scale;
        const x = (size - imgW) / 2;
        const y = (size - imgH) / 2;
        ctx.drawImage(img, x, y, imgW, imgH);

        ctx.restore();

        // Convert to line art (grayscale + threshold)
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // Skip fully transparent pixels
            if (a === 0) continue;

            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const threshold = 180;
            const value = gray > threshold ? 255 : (gray < 60 ? 0 : gray * 1.3);

            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
        }

        ctx.putImageData(imageData, 0, 0);

        // Draw badge border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, badgeRadius - 1, 0, Math.PI * 2);
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

        // Add all canvases to zip
        const canvases = [
            { id: 'lineArtCanvas', name: '뱃지_인쇄용_7.5cm.png' },
            { id: 'coloredCanvas', name: '뱃지_색칠본_상세페이지용.png' },
            { id: 'printCanvas', name: '뱃지_비색칠본_상세페이지용.png' }
        ];

        for (const { id, name } of canvases) {
            const canvas = document.getElementById(id);
            const dataUrl = canvas.toDataURL('image/png');
            const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
            zip.file(name, base64Data, { base64: true });
        }

        // Generate and download zip
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
        document.getElementById('previewSection').style.display = 'none';
        document.querySelector('.upload-section').style.display = 'block';
        document.getElementById('imageInput').value = '';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new BadgeProcessor();
});
