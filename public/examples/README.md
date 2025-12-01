# 예시 라이브러리 (Few-shot Learning)

이 폴더에는 AI가 참고할 우수한 상세페이지 예시를 저장합니다.

## 📂 폴더 구조

- `minimal/` - 미니멀/클린 스타일 예시
- `rich/` - 풍부한/친근한 스타일 예시

## 📝 이미지 추가 방법

1. 좋은 상세페이지 스크린샷 저장 (PNG 또는 JPG)
2. 적절한 폴더에 저장:
   - 미니멀: `public/examples/minimal/`
   - 풍부한: `public/examples/rich/`
3. `src/utils/exampleManager.js`에서 경로 추가:
   ```javascript
   '/examples/minimal/your-image.jpg'  // public/ 제외
   ```

## ✅ 현재 등록된 예시

### 미니멀 스타일 (2개)
- `example_smile_badge.jpg` - 스마일 뱃지
- `example_korea_badge.jpg` - 태극기 뱃지

### 풍부한 스타일 (4개)
- `example_long_detail.jpg` - 긴 상세페이지
- `example_colorful_house.jpg` - 컬러풀한 집
- `example_snowflake_sticker.png` - 눈꽃 스티커 상세페이지
- `example_ornament_collection.png` - 그리기 오너먼트 컬렉션

## 🚀 사용법

이미지를 추가하면 자동으로 AI 생성 시 참고됩니다!
