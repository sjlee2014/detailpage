/**
 * 이미지 생성 및 다운로드 유틸리티
 * html-to-image를 사용하여 HTML 요소를 이미지로 변환
 */

import * as htmlToImage from 'html-to-image';

/**
 * HTML 요소를 이미지로 변환하여 Blob 생성
 * @param {HTMLElement} element - 변환할 HTML 요소
 * @param {string} format - 'png' 또는 'jpg'
 * @returns {Promise<Blob>} 이미지 Blob
 */
export async function htmlToBlob(element, format = 'jpg') {
    try {
        console.log('📸 이미지 생성 시작:', {
            element: element.tagName,
            width: element.offsetWidth,
            height: element.offsetHeight,
            format
        });

        // 이미지 로딩 대기
        const images = element.querySelectorAll('img');
        if (images.length > 0) {
            console.log(`🖼️ 이미지 ${images.length}개 로딩 확인 중...`);
            await Promise.all(
                Array.from(images).map((img) => {
                    return new Promise((resolve) => {
                        if (img.complete && img.naturalHeight !== 0) {
                            resolve();
                        } else {
                            img.addEventListener('load', () => resolve());
                            img.addEventListener('error', () => resolve());
                            setTimeout(() => resolve(), 5000);
                        }
                    });
                })
            );
            console.log('✅ 모든 이미지 로딩 완료');
        }

        // 약간의 대기 시간 (렌더링 안정화)
        await new Promise(resolve => setTimeout(resolve, 300));

        const options = {
            quality: 0.95,
            pixelRatio: 3, // 초고해상도 (약 300 DPI 수준)
            backgroundColor: '#ffffff',
            cacheBust: true,
            skipFonts: true, // CORS 오류 방지 (외부 폰트 건너뛰기)
        };

        let blob;
        if (format === 'png') {
            const dataUrl = await htmlToImage.toPng(element, options);
            blob = await dataUrlToBlob(dataUrl);
        } else {
            const dataUrl = await htmlToImage.toJpeg(element, options);
            blob = await dataUrlToBlob(dataUrl);
        }

        if (!blob) {
            throw new Error('Blob 생성 실패');
        }

        const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        console.log(`✅ 이미지 생성 성공! (${sizeMB}MB)`);

        return blob;

    } catch (error) {
        console.error('❌ 이미지 생성 실패:', error);
        throw error;
    }
}

/**
 * Data URL을 Blob으로 변환
 */
function dataUrlToBlob(dataUrl) {
    return fetch(dataUrl).then(res => res.blob());
}

/**
 * Blob을 파일로 다운로드
 */
export function downloadBlob(blob, filename, format = 'jpg') {
    return new Promise((resolve, reject) => {
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
            console.error('❌ 다운로드 실패:', error);
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

        const format = options.format || 'jpg';
        const blob = await htmlToBlob(element, format);

        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const sanitizedName = productName.replace(/[^a-zA-Z0-9가-힣]/g, '_');
        const filename = `product-detail-${sanitizedName}-${timestamp}`;

        await downloadBlob(blob, filename, format);

        if (options.onSuccess) {
            options.onSuccess(filename);
        }

        return blob;
    } catch (error) {
        console.error('❌ generateAndDownload 실패:', error);
        if (options.onError) {
            options.onError(error);
        }
        throw error;
    }
}

/**
 * Canvas를 Blob으로 변환 (호환성 유지용)
 * @deprecated html-to-image는 canvas를 직접 사용하지 않음
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
