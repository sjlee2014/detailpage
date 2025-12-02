/**
 * IndexedDB 기반 임시 저장소 관리자
 * 대용량 이미지와 HTML 데이터를 브라우저에 저장하기 위해 사용
 */

const DB_NAME = 'VibeCodingDB';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';

// DB 연결 객체
let db = null;

/**
 * IndexedDB 초기화 및 연결
 */
export const initDB = () => {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            reject('IndexedDB를 열 수 없습니다.');
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('✅ IndexedDB 연결 성공');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // 객체 저장소 생성 (keyPath: id, autoIncrement: true)
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                // 인덱스 생성 (날짜순 정렬 등을 위해)
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                console.log('📦 저장소(ObjectStore) 생성 완료');
            }
        };
    });
};

/**
 * 임시 저장 (Draft Save)
 * @param {Object} data - 저장할 데이터 { title, html, productInfo, images, ... }
 */
export const saveDraft = async (data) => {
    await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const draft = {
            ...data,
            timestamp: new Date().toISOString(), // 저장 시간
        };

        const request = store.add(draft);

        request.onsuccess = () => {
            console.log('💾 임시 저장 완료');
            resolve(request.result); // 저장된 ID 반환
        };

        request.onerror = (event) => {
            console.error('저장 실패:', event.target.error);
            reject('저장에 실패했습니다.');
        };
    });
};

/**
 * 모든 임시 저장 목록 조회
 */
export const getDrafts = async () => {
    await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp'); // 시간순 정렬

        // 최신순으로 가져오기 위해 커서 사용 (prev)
        const request = index.openCursor(null, 'prev');
        const drafts = [];

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                // 목록에는 HTML 전체를 담으면 너무 무거우므로 요약 정보만 담을 수도 있음
                // 하지만 IndexedDB는 빠르므로 일단 전체를 가져오되, UI 렌더링 시 주의
                drafts.push(cursor.value);
                cursor.continue();
            } else {
                resolve(drafts);
            }
        };

        request.onerror = (event) => {
            console.error('목록 조회 실패:', event.target.error);
            reject('목록을 불러오는데 실패했습니다.');
        };
    });
};

/**
 * 특정 임시 저장 항목 불러오기
 * @param {number} id 
 */
export const loadDraft = async (id) => {
    await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error('로드 실패:', event.target.error);
            reject('항목을 불러오는데 실패했습니다.');
        };
    });
};

/**
 * 항목 삭제
 * @param {number} id 
 */
export const deleteDraft = async (id) => {
    await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
            console.log('🗑️ 삭제 완료');
            resolve();
        };

        request.onerror = (event) => {
            console.error('삭제 실패:', event.target.error);
            reject('삭제에 실패했습니다.');
        };
    });
};
