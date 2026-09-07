# 2026 애국한양응원제 대기 지도

모바일 환경에 맞춘 팔찌 수령 및 노천극장 입장 대기 동선 디자인입니다.

현재 버전은 GitHub Pages에서 동작하는 프론트엔드 디자인 시안이며 샘플 데이터를 사용합니다.

운영용 백엔드는 `backend/`에 구현되어 있습니다. Cloudflare Worker가 정적 프론트엔드와 API를 함께 제공하고, 대기 상태는 D1에 저장합니다. 구축 및 배포 방법은 [backend/README.md](backend/README.md)를 참고하세요.

## 혼잡도 표시 기준 수정

사용자 화면의 `원활 / 보통 / 많음 / 매우 많음` 기준은 `app/queue-config.ts` 한 곳에서 관리합니다. 대기 동선이 확정되면 `normalFrom`, `busyFrom`, `veryBusyFrom` 숫자만 변경하면 됩니다. 각 값의 적용 범위는 파일 안의 한글 주석에 표시되어 있습니다.

## 로컬 실행

```bash
npm install --legacy-peer-deps
npm run dev
```

## 배포

`main` 브랜치에 변경 사항을 올리면 GitHub Actions가 정적 사이트를 자동으로 빌드하고 GitHub Pages에 배포합니다.
