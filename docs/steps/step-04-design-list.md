# Step 4. 도안 목록 페이지 (`/`)

## 목표

홈(`/`)에서 등록된 도안을 최신순으로 조회하고, 각 카드에 대표 썸네일/제목/카테고리를 표시한다.  
로그인 여부와 관계없이 누구나 접근 가능하며, 각 카드를 통해 상세 페이지로 이동할 수 있다.

---

## 사용 기술 & 라이브러리

| 패키지           | 용도                  | 비고 |
| ---------------- | --------------------- | ---- |
| `@prisma/client` | Design 모델 타입 추론 | 기존 |

---

## 구현 순서

1. 도안 목록 조회 API 함수 생성 (`src/entities/design/design.api.ts`)
   - `createdAt` 기준 최신순 정렬(`orderBy: { createdAt: 'desc' }`)
   - `findMany`로 Prisma `Design` 행 전체 조회 (`select`로 필드 축소는 이후 필요 시 도입)
   - 현재는 목데이터(`design.mock.ts`)로 대체 중

2. Design 타입 정리 (`src/entities/design/design.type.ts`)
   - Prisma 생성 타입 `Design`, `DesignCategory`를 re-export

3. 도안 카드 UI 생성 (`src/entities/design/ui/DesignCard.tsx`)
   - 대표 이미지(`images` 배열의 첫 요소), 제목, 카테고리(Badge), 작성자 렌더링
   - 호버 시 오버레이: 제목, 작성자, 등록일, 가격 표시 (CSS `group-hover`로 구현, 서버 컴포넌트 유지)

4. 홈 페이지 구성 (`src/app/(main)/page.tsx`)
   - Route Group `(main)` 사용 (Sidebar/Header가 필요한 페이지와 `/signin`을 레이아웃 분리)
   - 서버 컴포넌트에서 `getDesigns()` 호출
   - CSS columns 기반 Masonry 그리드로 `DesignCard` 목록 렌더링 (2열~5열 반응형)
   - JS 방식 Masonry는 아직 고려중

---

## 구현 지침

- **서버 컴포넌트 우선**: 목록 조회는 서버에서 수행하고 결과만 렌더링한다. 클라이언트 fetch로 초기 렌더를 대체하지 않는다.

- **N+1 방지**: 목록은 단일 `findMany`로 조회하고, 카드마다 추가 쿼리를 하지 않는다.

- **정렬 일관성**: 최신순 기준 컬럼을 `createdAt`으로 고정한다.

- **빈 상태 UX 제공**: 등록된 도안이 없을 때 빈 화면 대신 안내 문구를 노출한다.

- **FSD 레이어 준수**: 도메인 UI(`DesignCard`)와 목록 조회 로직은 `entities/design/`에 배치한다.

---

## 엣지 케이스

---

## 검증 항목
