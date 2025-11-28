/**
 * 이미지 생성 및 다운로드 유틸리티
 * HTML 요소를 Canvas로 변환하여 이미지 파일로 다운로드
 */

import html2canvas from 'html2canvas';

/**
 * HTML 요소를 이미지로 변환
 * @param {HTMLElement} element - 변환할 HTML 요소
 * @param {Object} options - html2canvas 옵션
 * @returns {Promise<HTMLCanvasElement>} Canvas 요소
 */
export async function htmlToCanvas(element, options = {}) {
    // 🔧 가장 안정적인 설정으로 단순화
    const defaultOptions = {
        scale: 2, // 2배로 안정성 우선 (3배는 일부 브라우저에서 문제)
        useCORS: true,
        allowTaint: true, // CORS 우회
        backgroundColor: '#ffffff',
        logging: true, // 디버깅용
        imageTimeout: 0, // 무제한 대기
        removeContainer: true,
        scrollY: 0, // 스크롤 위치 초기화 (중요)
        scrollX: 0,
        windowWidth: document.documentElement.scrollWidth, // 전체 너비 캡처
        windowHeight: document.documentElement.scrollHeight, // 전체 높이 캡처
        ...options,
    };

    try {
        console.log('📸 Canvas 생성 시작:', {
            element: element.tagName,
            width: element.offsetWidth,
            height: element.offsetHeight
        });

        // 이미지 강제 로딩 대기
        const images = element.querySelectorAll('img');
        let loadedCount = 0;

        if (images.length > 0) {
            console.log(`🖼️ 이미지 ${images.length}개 로딩 대기 중...`);

            await Promise.all(
                Array.from(images).map((img, idx) => {
                    return new Promise((resolve) => {
                        // 이미 로드된 경우
                        if (img.complete && img.naturalHeight !== 0) {
                            loadedCount++;
                            console.log(`✅ [${loadedCount}/${images.length}] 이미 로드됨`);
                            resolve();
                            return;
                        }

                        // 로딩 이벤트
                        const onLoad = () => {
                            loadedCount++;
                            console.log(`✅ [${loadedCount}/${images.length}] 로드 완료`);
                            cleanup();
                            resolve();
                        };

                        const onError = (e) => {
                            console.warn(`⚠️ [${idx + 1}] 로드 실패 - 무시하고 계속`, e.message);
                            cleanup();
                            resolve();
                        };

                        const onTimeout = () => {
                            console.warn(`⏱️ [${idx + 1}] 타임아웃 (15초) - 무시하고 계속`);
                            cleanup();
                            resolve();
                        };

                        const cleanup = () => {
                            img.removeEventListener('load', onLoad);
                            img.removeEventListener('error', onError);
                            clearTimeout(timeoutId);
                        };

                        img.addEventListener('load', onLoad);
                        img.addEventListener('error', onError);
                        const timeoutId = setTimeout(onTimeout, 15000);
                    });
                })
            );

            console.log(`✅ 이미지 로딩 완료: ${loadedCount}/${images.length}개`);
        }

        // 약간의 대기 시간 (브라우저 렌더링 완료 보장)
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('🎨 html2canvas 실행 중...');
        const canvas = await html2canvas(element, defaultOptions);

        if (!canvas || canvas.width === 0 || canvas.height === 0) {
            throw new Error('Canvas 생성 실패: 결과가 비어있음');
        }

        const sizeMB = (canvas.width * canvas.height * 4) / (1024 * 1024);
        console.log(`✅ Canvas 생성 성공!`, {
            width: canvas.width,
            height: canvas.height,
            estimatedMB: sizeMB.toFixed(2)
        });

        return canvas;

    } catch (error) {
        console.error('❌ Canvas 생성 실패:', error);
        throw error;
    }
}

/**
 * Canvas를 이미지 파일로 다운로드
 */
export function downloadCanvas(canvas, filename, format = 'png') {
    return new Promise((resolve, reject) => {
        try {
            const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
            const quality = format === 'jpg' ? 0.95 : 1.0;

            console.log('💾 다운로드 시작:', {
                width: canvas.width,
                height: canvas.height,
                format,
                quality
            });

            canvas.toBlob((blob) => {
                if (!blob) {
                    console.warn('⚠️ Blob 생성 실패, dataURL 방식으로 재시도');

                    try {
                        const dataUrl = canvas.toDataURL(mimeType, quality);
                        const link = document.createElement('a');
                        link.download = `${filename}.${format}`;
                        link.href = dataUrl;
                        document.body.appendChild(link);
                        link.click();
                        setTimeout(() => {
                            document.body.removeChild(link);
                            console.log('✅ 다운로드 완료 (dataURL)');
                            resolve();
                        }, 100);
                    } catch (err) {
                        console.error('❌ dataURL 방식도 실패:', err);
                        reject(new Error('이미지 변환 실패'));
                    }
                    return;
                }

                try {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `${filename}.${format}`;
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();

                    setTimeout(() => {
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
                        console.log(`✅ 다운로드 완료! (${sizeMB}MB)`);
                        resolve();
                    }, 100);
                } catch (error) {
                    console.error('❌ Blob 다운로드 실패:', error);
                    reject(error);
                }
            }, mimeType, quality);

        } catch (error) {
            console.error('❌ 다운로드 프로세스 실패:', error);
            reject(error);
        }
    });
}

/**
 * HTML 요소를 이미지로 변환하여 바로 다운로드
 */
export async function generateAndDownload(element, productName, options = {}) {
    try {
        if (options.onStart) {
            options.onStart();
        }

        const canvas = await htmlToCanvas(element, options.canvasOptions);

        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const sanitizedName = productName.replace(/[^a-zA-Z0-9가-힣]/g, '_');
        const filename = `product-detail-${sanitizedName}-${timestamp}`;

        await downloadCanvas(canvas, filename, options.format || 'jpg');

        if (options.onSuccess) {
            options.onSuccess(filename);
        }

        return canvas;
    } catch (error) {
        console.error('❌ generateAndDownload 실패:', error);
        if (options.onError) {
            options.onError(error);
        }
        throw error;
    }
}

/**
 * Canvas를 Blob으로 변환
 */
export function canvasToBlob(canvas, format = 'png') {
    return new Promise((resolve, reject) => {
        const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Blob 변환 실패'));
                }
            },
            mimeType,
            0.95
        );
    });
}
