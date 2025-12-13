/**
 * 배경 제거 유틸리티
 * @imgly/background-removal 라이브러리 래퍼
 */

import { removeBackground } from '@imgly/background-removal';

// 처리 상태 추적
let isProcessing = false;

/**
 * 이미지에서 배경 제거
 * @param {string|Blob|File} imageSource - 이미지 소스 (URL, Blob, File)
 * @param {Function} onProgress - 진행 상황 콜백
 * @returns {Promise<Blob>} 배경이 제거된 PNG Blob
 */
export async function removeImageBackground(imageSource, onProgress = null) {
    if (isProcessing) {
        throw new Error('이미 다른 이미지를 처리 중입니다.');
    }

    isProcessing = true;

    try {
        const config = {
            progress: (key, current, total) => {
                if (onProgress) {
                    const percent = Math.round((current / total) * 100);
                    onProgress({ key, current, total, percent });
                }
            },
            // 성능 최적화
            output: {
                format: 'image/png',
                quality: 1.0
            }
        };

        const blob = await removeBackground(imageSource, config);
        return blob;
    } finally {
        isProcessing = false;
    }
}

/**
 * File/Blob을 base64 Data URL로 변환
 * @param {Blob} blob 
 * @returns {Promise<string>}
 */
export function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * 여러 이미지의 배경 일괄 제거
 * @param {Array<File>} files - 이미지 파일 배열
 * @param {Function} onItemProgress - 개별 아이템 진행 콜백
 * @returns {Promise<Array<{original: File, processed: Blob, dataUrl: string}>>}
 */
export async function batchRemoveBackground(files, onItemProgress = null) {
    const results = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (onItemProgress) {
            onItemProgress({
                index: i,
                total: files.length,
                fileName: file.name,
                status: 'processing'
            });
        }

        try {
            const processedBlob = await removeImageBackground(file, (progress) => {
                if (onItemProgress) {
                    onItemProgress({
                        index: i,
                        total: files.length,
                        fileName: file.name,
                        status: 'processing',
                        progress
                    });
                }
            });

            const dataUrl = await blobToDataUrl(processedBlob);

            results.push({
                original: file,
                processed: processedBlob,
                dataUrl
            });

            if (onItemProgress) {
                onItemProgress({
                    index: i,
                    total: files.length,
                    fileName: file.name,
                    status: 'completed'
                });
            }
        } catch (error) {
            console.error(`배경 제거 실패 (${file.name}):`, error);
            results.push({
                original: file,
                processed: null,
                dataUrl: null,
                error: error.message
            });

            if (onItemProgress) {
                onItemProgress({
                    index: i,
                    total: files.length,
                    fileName: file.name,
                    status: 'error',
                    error: error.message
                });
            }
        }
    }

    return results;
}

export default {
    removeImageBackground,
    blobToDataUrl,
    batchRemoveBackground
};
