/**
 * Badge Processor - 뱃지 이미지 처리 모듈 (고급 텍스트 에디터 버전)
 * 
 * 기능:
 * 1. 이미지 크기/위치 조절
 * 2. 다중 텍스트 레이어 (각각 다른 색상/크기)
 * 3. 드래그로 텍스트 위치 및 크기 조절
 * 4. 실시간 미리보기
 */

const BADGE_SIZE = 886;
const PREVIEW_SIZE = 400;
const SCALE_RATIO = BADGE_SIZE / PREVIEW_SIZE;

class BadgeProcessor {
    constructor() {
        this.originalImage = null;

        // Image settings
        this.imageSettings = {
            scale: 130,
            posX: 0,
            posY: 0
        };

        // Text layers
        this.textLayers = [];
        this.activeLayerIndex = -1;
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };
        this.resizeStartFontSize = 0;
        this.resizeStartY = 0;

        this.initEventListeners();
    }

    initEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');
        const downloadPrint = document.getElementById('downloadPrint');
        const downloadWeb = document.getElementById('downloadWeb');
        const downloadAll = document.getElementById('downloadAll');
        const resetBtn = document.getElementById('resetBtn');
        const applyChanges = document.getElementById('applyChanges');
        const changeImageBtn = document.getElementById('changeImageBtn');
        const addTextBtn = document.getElementById('addTextBtn');

        // Upload
        uploadArea.addEventListener('click', () => imageInput.click());
        changeImageBtn.addEventListener('click', () => imageInput.click());

        imageInput.addEventListener('change', (e) => {
            if (e.target.files[0]) this.handleImageUpload(e.target.files[0]);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files[0]) this.handleImageUpload(e.dataTransfer.files[0]);
        });

        // Downloads
        downloadPrint.addEventListener('click', () => this.downloadCanvas('printCanvas', '뱃지_인쇄용_7.5cm.png'));
        downloadWeb.addEventListener('click', () => this.downloadCanvas('webCanvas', '뱃지_상세페이지용.png'));
        downloadAll.addEventListener('click', () => this.downloadAllAsZip());

        resetBtn.addEventListener('click', () => this.reset());
        applyChanges.addEventListener('click', () => this.applyToFinal());
        addTextBtn.addEventListener('click', () => this.addTextLayer());

        // Image controls
        this.initImageControls();

        // Canvas drag events
        this.initCanvasDrag();
    }

    initImageControls() {
        const imageScale = document.getElementById('imageScale');
        const imageScaleInput = document.getElementById('imageScaleInput');
        const imagePosX = document.getElementById('imagePosX');
        const imagePosXInput = document.getElementById('imagePosXInput');
        const imagePosY = document.getElementById('imagePosY');
        const imagePosYInput = document.getElementById('imagePosYInput');

        // Scale
        const syncScale = (val) => {
            val = Math.max(50, Math.min(200, parseInt(val) || 130));
            imageScale.value = val;
            imageScaleInput.value = val;
            this.imageSettings.scale = val;
            this.updateLivePreview();
        };
        imageScale.addEventListener('input', (e) => syncScale(e.target.value));
        imageScaleInput.addEventListener('input', (e) => syncScale(e.target.value));
        imageScaleInput.addEventListener('blur', (e) => syncScale(e.target.value));

        // PosX
        const syncPosX = (val) => {
            val = Math.max(-200, Math.min(200, parseInt(val) || 0));
            imagePosX.value = val;
            imagePosXInput.value = val;
            this.imageSettings.posX = val;
            this.updateLivePreview();
        };
        imagePosX.addEventListener('input', (e) => syncPosX(e.target.value));
        imagePosXInput.addEventListener('input', (e) => syncPosX(e.target.value));
        imagePosXInput.addEventListener('blur', (e) => syncPosX(e.target.value));

        // PosY
        const syncPosY = (val) => {
            val = Math.max(-200, Math.min(200, parseInt(val) || 0));
            imagePosY.value = val;
            imagePosYInput.value = val;
            this.imageSettings.posY = val;
            this.updateLivePreview();
        };
        imagePosY.addEventListener('input', (e) => syncPosY(e.target.value));
        imagePosYInput.addEventListener('input', (e) => syncPosY(e.target.value));
        imagePosYInput.addEventListener('blur', (e) => syncPosY(e.target.value));
    }

    initCanvasDrag() {
        const canvas = document.getElementById('livePreviewCanvas');

        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (PREVIEW_SIZE / rect.width);
            const y = (e.clientY - rect.top) * (PREVIEW_SIZE / rect.height);

            // Find if click is on a text layer
            for (let i = this.textLayers.length - 1; i >= 0; i--) {
                const layer = this.textLayers[i];
                const previewX = layer.x / SCALE_RATIO;
                const previewY = layer.y / SCALE_RATIO;
                const previewFontSize = layer.fontSize / SCALE_RATIO;

                // Calculate text bounds
                const textWidth = layer.text.length * previewFontSize * 0.6;
                const textHeight = previewFontSize;

                const left = previewX - textWidth / 2;
                const right = previewX + textWidth / 2;
                const top = previewY - textHeight / 2;
                const bottom = previewY + textHeight / 2;

                // Check resize handle (bottom-right corner)
                const handleSize = 12;
                const handleX = right;
                const handleY = bottom;

                if (x >= handleX - handleSize && x <= handleX + handleSize &&
                    y >= handleY - handleSize && y <= handleY + handleSize) {
                    // Start resizing
                    this.isResizing = true;
                    this.isDragging = false;
                    this.activeLayerIndex = i;
                    this.resizeStartFontSize = layer.fontSize;
                    this.resizeStartY = y;
                    this.highlightLayerCard(i);
                    canvas.style.cursor = 'nwse-resize';
                    return;
                }

                // Check if clicking on text body
                if (x >= left && x <= right && y >= top && y <= bottom) {
                    this.isDragging = true;
                    this.isResizing = false;
                    this.activeLayerIndex = i;
                    this.dragOffset = { x: x - previewX, y: y - previewY };
                    this.highlightLayerCard(i);
                    canvas.style.cursor = 'grabbing';
                    break;
                }
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (PREVIEW_SIZE / rect.width);
            const y = (e.clientY - rect.top) * (PREVIEW_SIZE / rect.height);

            // Handle resizing
            if (this.isResizing && this.activeLayerIndex >= 0) {
                const layer = this.textLayers[this.activeLayerIndex];
                const deltaY = y - this.resizeStartY;
                const newFontSize = Math.max(16, Math.min(100, this.resizeStartFontSize + deltaY * SCALE_RATIO));
                layer.fontSize = Math.round(newFontSize);

                this.updateLayerSizeInput(this.activeLayerIndex);
                this.updateLivePreview();
                return;
            }

            // Handle dragging
            if (this.isDragging && this.activeLayerIndex >= 0) {
                const layer = this.textLayers[this.activeLayerIndex];
                layer.x = (x - this.dragOffset.x) * SCALE_RATIO;
                layer.y = (y - this.dragOffset.y) * SCALE_RATIO;

                // Clamp to badge area
                layer.x = Math.max(50, Math.min(BADGE_SIZE - 50, layer.x));
                layer.y = Math.max(50, Math.min(BADGE_SIZE - 50, layer.y));

                this.updateLayerPositionInputs(this.activeLayerIndex);
                this.updateLivePreview();
                return;
            }

            // Update cursor based on hover position
            let cursorSet = false;
            for (let i = this.textLayers.length - 1; i >= 0; i--) {
                const layer = this.textLayers[i];
                const previewX = layer.x / SCALE_RATIO;
                const previewY = layer.y / SCALE_RATIO;
                const previewFontSize = layer.fontSize / SCALE_RATIO;

                const textWidth = layer.text.length * previewFontSize * 0.6;
                const textHeight = previewFontSize;

                const right = previewX + textWidth / 2;
                const bottom = previewY + textHeight / 2;

                // Check resize handle
                const handleSize = 12;
                if (x >= right - handleSize && x <= right + handleSize &&
                    y >= bottom - handleSize && y <= bottom + handleSize) {
                    canvas.style.cursor = 'nwse-resize';
                    cursorSet = true;
                    break;
                }

                // Check text body
                if (x >= previewX - textWidth / 2 && x <= previewX + textWidth / 2 &&
                    y >= previewY - textHeight / 2 && y <= previewY + textHeight / 2) {
                    canvas.style.cursor = 'move';
                    cursorSet = true;
                    break;
                }
            }

            if (!cursorSet) {
                canvas.style.cursor = 'default';
            }
        });

        canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.isResizing = false;
        });

        canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.isResizing = false;
            canvas.style.cursor = 'default';
        });
    }

    highlightLayerCard(index) {
        document.querySelectorAll('.text-layer-card').forEach((card, i) => {
            card.classList.toggle('active', i === index);
        });
    }

    updateLayerPositionInputs(index) {
        const layer = this.textLayers[index];
        const card = document.querySelectorAll('.text-layer-card')[index];
        if (card) {
            card.querySelector('.layer-x-input').value = Math.round(layer.x);
            card.querySelector('.layer-y-input').value = Math.round(layer.y);
        }
    }

    updateLayerSizeInput(index) {
        const layer = this.textLayers[index];
        const card = document.querySelectorAll('.text-layer-card')[index];
        if (card) {
            card.querySelector('.layer-size-input').value = Math.round(layer.fontSize);
        }
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

                document.getElementById('editorSection').style.display = 'block';
                document.getElementById('previewSection').style.display = 'block';
                document.querySelector('.upload-section').style.display = 'none';

                this.updateLivePreview();
                this.applyToFinal();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    addTextLayer() {
        const newLayer = {
            id: Date.now(),
            text: '텍스트',
            x: BADGE_SIZE / 2,
            y: BADGE_SIZE / 2 + (this.textLayers.length * 60),
            fontSize: 48,
            fontFamily: 'Noto Sans KR',
            color: '#333333',
            style: 'fill', // fill, stroke, both
            strokeWidth: 3,
            strokeColor: '#333333'
        };

        this.textLayers.push(newLayer);
        this.renderTextLayerCards();
        this.updateLivePreview();
    }

    deleteTextLayer(index) {
        this.textLayers.splice(index, 1);
        this.activeLayerIndex = -1;
        this.renderTextLayerCards();
        this.updateLivePreview();
    }

    renderTextLayerCards() {
        const container = document.getElementById('textLayersContainer');
        container.innerHTML = '';

        this.textLayers.forEach((layer, index) => {
            const card = document.createElement('div');
            card.className = 'text-layer-card';
            card.innerHTML = `
                <div class="text-layer-header">
                    <span class="text-layer-title">텍스트 ${index + 1}</span>
                    <button class="delete-layer-btn" data-index="${index}">×</button>
                </div>
                <div class="text-layer-content">
                    <input type="text" class="text-layer-input layer-text-input" 
                           value="${layer.text}" placeholder="텍스트 입력" data-index="${index}">
                    <div class="text-layer-controls">
                        <div class="mini-control">
                            <label>채움색</label>
                            <input type="color" class="layer-color-input" value="${layer.color}" data-index="${index}">
                        </div>
                        <div class="mini-control">
                            <label>크기</label>
                            <input type="number" class="layer-size-input" value="${layer.fontSize}" 
                                   min="16" max="100" data-index="${index}">
                        </div>
                        <div class="mini-control">
                            <label>폰트</label>
                            <select class="layer-font-input" data-index="${index}">
                                <option value="Noto Sans KR" ${layer.fontFamily === 'Noto Sans KR' ? 'selected' : ''}>Noto Sans</option>
                                <option value="Black Han Sans" ${layer.fontFamily === 'Black Han Sans' ? 'selected' : ''}>블랙한산스</option>
                                <option value="Jua" ${layer.fontFamily === 'Jua' ? 'selected' : ''}>주아체</option>
                                <option value="Gamja Flower" ${layer.fontFamily === 'Gamja Flower' ? 'selected' : ''}>감자꽃</option>
                                <option value="Do Hyeon" ${layer.fontFamily === 'Do Hyeon' ? 'selected' : ''}>도현체</option>
                            </select>
                        </div>
                    </div>
                    <div class="text-layer-controls">
                        <div class="mini-control">
                            <label>스타일</label>
                            <select class="layer-style-input" data-index="${index}">
                                <option value="fill" ${layer.style === 'fill' ? 'selected' : ''}>채움</option>
                                <option value="stroke" ${layer.style === 'stroke' ? 'selected' : ''}>외곽선만</option>
                                <option value="both" ${layer.style === 'both' ? 'selected' : ''}>채움+외곽선</option>
                            </select>
                        </div>
                        <div class="mini-control">
                            <label>선 색상</label>
                            <input type="color" class="layer-stroke-color-input" value="${layer.strokeColor || '#333333'}" data-index="${index}">
                        </div>
                        <div class="mini-control">
                            <label>선 두께</label>
                            <input type="number" class="layer-stroke-width-input" value="${layer.strokeWidth || 3}" 
                                   min="1" max="10" data-index="${index}">
                        </div>
                    </div>
                    <div class="text-layer-position">
                        <div class="mini-control">
                            <label>X 좌표</label>
                            <input type="number" class="layer-x-input" value="${Math.round(layer.x)}" data-index="${index}">
                        </div>
                        <div class="mini-control">
                            <label>Y 좌표</label>
                            <input type="number" class="layer-y-input" value="${Math.round(layer.y)}" data-index="${index}">
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        // Add event listeners
        container.querySelectorAll('.delete-layer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.deleteTextLayer(parseInt(e.target.dataset.index));
            });
        });

        container.querySelectorAll('.layer-text-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.textLayers[parseInt(e.target.dataset.index)].text = e.target.value;
                this.updateLivePreview();
            });
        });

        container.querySelectorAll('.layer-color-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.textLayers[parseInt(e.target.dataset.index)].color = e.target.value;
                this.updateLivePreview();
            });
        });

        container.querySelectorAll('.layer-size-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.textLayers[parseInt(e.target.dataset.index)].fontSize = parseInt(e.target.value) || 48;
                this.updateLivePreview();
            });
        });

        // Font - wait for font to load before rendering
        container.querySelectorAll('.layer-font-input').forEach(input => {
            const handleFontChange = async (e) => {
                const fontFamily = e.target.value;
                const index = parseInt(e.target.dataset.index);
                this.textLayers[index].fontFamily = fontFamily;

                // Wait for font to load before rendering
                try {
                    await document.fonts.load(`bold 48px "${fontFamily}"`);
                } catch (err) {
                    console.log('Font loading:', err);
                }
                this.updateLivePreview();
            };

            input.addEventListener('change', handleFontChange);
        });

        container.querySelectorAll('.layer-x-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.textLayers[parseInt(e.target.dataset.index)].x = parseInt(e.target.value) || BADGE_SIZE / 2;
                this.updateLivePreview();
            });
        });

        container.querySelectorAll('.layer-y-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.textLayers[parseInt(e.target.dataset.index)].y = parseInt(e.target.value) || BADGE_SIZE / 2;
                this.updateLivePreview();
            });
        });

        // Style selector
        container.querySelectorAll('.layer-style-input').forEach(input => {
            input.addEventListener('change', (e) => {
                this.textLayers[parseInt(e.target.dataset.index)].style = e.target.value;
                this.updateLivePreview();
            });
        });

        // Stroke color
        container.querySelectorAll('.layer-stroke-color-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.textLayers[parseInt(e.target.dataset.index)].strokeColor = e.target.value;
                this.updateLivePreview();
            });
        });

        // Stroke width
        container.querySelectorAll('.layer-stroke-width-input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.textLayers[parseInt(e.target.dataset.index)].strokeWidth = parseInt(e.target.value) || 3;
                this.updateLivePreview();
            });
        });
    }

    updateLivePreview() {
        if (!this.originalImage) return;

        const canvas = document.getElementById('livePreviewCanvas');
        const ctx = canvas.getContext('2d');
        const size = PREVIEW_SIZE;
        const img = this.originalImage;

        const scale = this.imageSettings.scale / 100;
        const offsetX = this.imageSettings.posX / SCALE_RATIO;
        const offsetY = this.imageSettings.posY / SCALE_RATIO;

        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, size, size);

        // Clip to circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();

        // Draw image
        const baseScale = Math.min(size / img.width, size / img.height);
        const finalScale = baseScale * scale;
        const scaledW = img.width * finalScale;
        const scaledH = img.height * finalScale;
        const imgX = (size - scaledW) / 2 + offsetX;
        const imgY = (size - scaledH) / 2 + offsetY;

        ctx.drawImage(img, imgX, imgY, scaledW, scaledH);

        // Draw text layers
        this.textLayers.forEach((layer, index) => {
            const previewX = layer.x / SCALE_RATIO;
            const previewY = layer.y / SCALE_RATIO;
            const previewFontSize = layer.fontSize / SCALE_RATIO;

            ctx.font = `bold ${previewFontSize}px "${layer.fontFamily}"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const textWidth = ctx.measureText(layer.text).width;
            const textHeight = previewFontSize;

            // Draw selection box for active layer
            if (index === this.activeLayerIndex) {
                ctx.save();
                ctx.strokeStyle = 'rgba(102, 126, 234, 0.8)';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(
                    previewX - textWidth / 2 - 5,
                    previewY - textHeight / 2 - 3,
                    textWidth + 10,
                    textHeight + 6
                );
                ctx.setLineDash([]);

                // Draw resize handle (bottom-right corner)
                const handleX = previewX + textWidth / 2 + 5;
                const handleY = previewY + textHeight / 2 + 3;
                ctx.fillStyle = '#667eea';
                ctx.fillRect(handleX - 4, handleY - 4, 8, 8);
                ctx.restore();
            }

            // Render text based on style
            const previewStrokeWidth = (layer.strokeWidth || 3) / SCALE_RATIO;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            if (layer.style === 'stroke') {
                // Outline only (hollow text)
                ctx.strokeStyle = layer.strokeColor || layer.color;
                ctx.lineWidth = previewStrokeWidth;
                ctx.strokeText(layer.text, previewX, previewY);
            } else if (layer.style === 'both') {
                // Fill + stroke
                ctx.strokeStyle = layer.strokeColor || '#333333';
                ctx.lineWidth = previewStrokeWidth;
                ctx.strokeText(layer.text, previewX, previewY);
                ctx.fillStyle = layer.color;
                ctx.fillText(layer.text, previewX, previewY);
            } else {
                // Fill only (default)
                ctx.fillStyle = layer.color;
                ctx.fillText(layer.text, previewX, previewY);
            }
        });

        ctx.restore();

        // Draw circle border
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    applyToFinal() {
        if (!this.originalImage) return;
        this.createPrintVersion();
        this.createWebVersion();
    }

    createPrintVersion() {
        const canvas = document.getElementById('printCanvas');
        const ctx = canvas.getContext('2d');
        const img = this.originalImage;

        const scale = this.imageSettings.scale / 100;
        const offsetX = this.imageSettings.posX;
        const offsetY = this.imageSettings.posY;

        ctx.clearRect(0, 0, BADGE_SIZE, BADGE_SIZE);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, BADGE_SIZE, BADGE_SIZE);

        ctx.save();
        ctx.beginPath();
        ctx.arc(BADGE_SIZE / 2, BADGE_SIZE / 2, BADGE_SIZE / 2, 0, Math.PI * 2);
        ctx.clip();

        const baseScale = Math.min(BADGE_SIZE / img.width, BADGE_SIZE / img.height);
        const finalScale = baseScale * scale;
        const scaledW = img.width * finalScale;
        const scaledH = img.height * finalScale;
        const imgX = (BADGE_SIZE - scaledW) / 2 + offsetX;
        const imgY = (BADGE_SIZE - scaledH) / 2 + offsetY;

        ctx.drawImage(img, imgX, imgY, scaledW, scaledH);

        // Draw all text layers
        this.textLayers.forEach(layer => {
            ctx.font = `bold ${layer.fontSize}px "${layer.fontFamily}"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            if (layer.style === 'stroke') {
                // Outline only (hollow text)
                ctx.strokeStyle = layer.strokeColor || layer.color;
                ctx.lineWidth = layer.strokeWidth || 3;
                ctx.strokeText(layer.text, layer.x, layer.y);
            } else if (layer.style === 'both') {
                // Fill + stroke
                ctx.strokeStyle = layer.strokeColor || '#333333';
                ctx.lineWidth = layer.strokeWidth || 3;
                ctx.strokeText(layer.text, layer.x, layer.y);
                ctx.fillStyle = layer.color;
                ctx.fillText(layer.text, layer.x, layer.y);
            } else {
                // Fill only (default)
                ctx.fillStyle = layer.color;
                ctx.fillText(layer.text, layer.x, layer.y);
            }
        });

        ctx.restore();

        // Cut line
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(BADGE_SIZE / 2, BADGE_SIZE / 2, BADGE_SIZE / 2 - 1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    createWebVersion() {
        const canvas = document.getElementById('webCanvas');
        const ctx = canvas.getContext('2d');
        const img = this.originalImage;
        const size = BADGE_SIZE;
        const centerX = size / 2;
        const centerY = size / 2;
        const badgeRadius = size / 2 - 35;

        const scale = this.imageSettings.scale / 100;
        const offsetX = this.imageSettings.posX;
        const offsetY = this.imageSettings.posY;

        canvas.width = size;
        canvas.height = size;
        ctx.clearRect(0, 0, size, size);

        // Drop shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX, centerY, badgeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Image
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, badgeRadius, 0, Math.PI * 2);
        ctx.clip();

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, size, size);

        const margin = 35;
        const availableSize = size - margin * 2;
        const baseScale = Math.min(availableSize / img.width, availableSize / img.height);
        const finalScale = baseScale * scale;
        const scaledW = img.width * finalScale;
        const scaledH = img.height * finalScale;
        const imgX = (size - scaledW) / 2 + offsetX;
        const imgY = (size - scaledH) / 2 + offsetY;

        ctx.drawImage(img, imgX, imgY, scaledW, scaledH);

        // Draw all text layers
        this.textLayers.forEach(layer => {
            ctx.font = `bold ${layer.fontSize}px "${layer.fontFamily}"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            if (layer.style === 'stroke') {
                // Outline only (hollow text)
                ctx.strokeStyle = layer.strokeColor || layer.color;
                ctx.lineWidth = layer.strokeWidth || 3;
                ctx.strokeText(layer.text, layer.x, layer.y);
            } else if (layer.style === 'both') {
                // Fill + stroke
                ctx.strokeStyle = layer.strokeColor || '#333333';
                ctx.lineWidth = layer.strokeWidth || 3;
                ctx.strokeText(layer.text, layer.x, layer.y);
                ctx.fillStyle = layer.color;
                ctx.fillText(layer.text, layer.x, layer.y);
            } else {
                // Fill only (default)
                ctx.fillStyle = layer.color;
                ctx.fillText(layer.text, layer.x, layer.y);
            }
        });

        ctx.restore();

        // Dome effect
        const domeGradient = ctx.createRadialGradient(centerX, centerY - badgeRadius * 0.3, 0, centerX, centerY, badgeRadius);
        domeGradient.addColorStop(0, 'rgba(255,255,255,0)');
        domeGradient.addColorStop(0.6, 'rgba(255,255,255,0)');
        domeGradient.addColorStop(0.85, 'rgba(0,0,0,0.02)');
        domeGradient.addColorStop(1, 'rgba(0,0,0,0.1)');

        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.beginPath();
        ctx.arc(centerX, centerY, badgeRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = domeGradient;
        ctx.fillRect(0, 0, size, size);
        ctx.restore();

        // Highlight
        const highlightGradient = ctx.createLinearGradient(centerX, centerY - badgeRadius, centerX, centerY + badgeRadius * 0.3);
        highlightGradient.addColorStop(0, 'rgba(255,255,255,0.4)');
        highlightGradient.addColorStop(0.3, 'rgba(255,255,255,0.15)');
        highlightGradient.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, badgeRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = highlightGradient;
        ctx.fillRect(0, 0, size, size);
        ctx.restore();

        // Border
        ctx.beginPath();
        ctx.arc(centerX, centerY, badgeRadius - 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    downloadCanvas(canvasId, filename) {
        const canvas = document.getElementById(canvasId);
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

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

    reset() {
        this.originalImage = null;
        this.textLayers = [];
        this.activeLayerIndex = -1;

        this.imageSettings = { scale: 130, posX: 0, posY: 0 };

        document.getElementById('imageScale').value = 130;
        document.getElementById('imageScaleInput').value = 130;
        document.getElementById('imagePosX').value = 0;
        document.getElementById('imagePosXInput').value = 0;
        document.getElementById('imagePosY').value = 0;
        document.getElementById('imagePosYInput').value = 0;

        document.getElementById('textLayersContainer').innerHTML = '';

        document.getElementById('editorSection').style.display = 'none';
        document.getElementById('previewSection').style.display = 'none';
        document.querySelector('.upload-section').style.display = 'block';
        document.getElementById('imageInput').value = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BadgeProcessor();
});
