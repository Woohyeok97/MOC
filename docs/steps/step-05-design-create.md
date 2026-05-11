# Step 5. 도안 등록 폼 (`/designs/new`)

## 목표

로그인 유저가 `/designs/new`에서 제목, 설명, 카테고리, 이미지, PDF를 입력해 도안을 등록할 수 있도록 한다.  
등록 시 이미지/PDF는 Supabase Storage에 업로드하고, 업로드된 URL 배열을 `Design` 모델에 저장한다.

---

## 사용 기술 & 라이브러리

| 패키지 | 용도 | 비고 |
| --- | --- | --- |
| `react-hook-form` | 입력 상태 관리 및 제출 처리 | 신규 |
| `zod` | 입력값 유효성 검사 스키마 | 신규 |
| `@hookform/resolvers` | RHF + Zod 리졸버 연결 | 신규 |
| `@supabase/supabase-js` | 이미지/PDF Storage 업로드 | 기존 |
| `@prisma/client` | `Design` 레코드 생성 | 기존 |

---

## 구현 순서

1. 등록 페이지 라우트 생성 (`src/app/(main)/designs/new/page.tsx`)
   - 로그인 유저만 접근 가능하도록 서버 컴포넌트에서 인증 상태 확인
   - 비로그인 유저는 `/signin`으로 이동

2. 도안 등록 폼 UI 생성 (`src/features/design-create/ui/DesignCreateForm.tsx`)
   - 입력 항목: 제목, 설명, 카테고리, 이미지(multiple), PDF(multiple)
   - `react-hook-form`의 `register`, `handleSubmit`, `isSubmitting` 구성
   - 파일 선택 상태(파일명/개수) 표시

3. 입력 스키마 정의 및 RHF 연결 (`src/features/design-create/design-create.schema.ts`)
   - `zod`로 필수값, 문자열 길이, 카테고리 enum 검증
   - 파일 개수/크기/MIME 타입 검증
   - `zodResolver`로 RHF 에러 렌더링 연결

4. 서버 액션 구현 (`src/features/design-create/design-create.actions.ts`)
   - 액션 내부에서 로그인 유저 재검증
   - `FormData` 파싱 후 서버에서도 Zod 재검증
   - 이미지/PDF 업로드 및 URL 수집

5. 도안 저장 로직 구현 (`src/entities/design/design.api.ts`)
   - Prisma `Design` 생성 (`images`, `instructions`, `authorId` 저장)
   - 저장 성공 시 목록/상세 페이지로 이동
   - 저장 실패 시 업로드된 파일 정리 처리

---

## 구현 지침

- **서버 액션 인증 필수**: 페이지 가드와 별개로 서버 액션 내부에서 로그인 유저를 반드시 검증한다.

- **검증 이중화**: 클라이언트(RHF)와 서버 액션 양쪽에서 동일한 Zod 규칙을 적용한다.

- **스토리지 경로 규칙화**: 파일 경로는 `designs/{userId}/{uuid}` 형태로 고정해 충돌을 방지한다.

- **실패 시 정리 처리**: Storage 업로드 후 DB 저장 실패 시 업로드 파일을 정리해 orphan 파일을 남기지 않는다.

- **FSD 레이어 준수**: 등록 UI/액션은 `features/design-create`, 도안 저장은 `entities/design`에 배치한다.

---

## 엣지 케이스

- 비로그인 상태에서 `/designs/new` 직접 접근
- 이미지 업로드 성공 후 PDF 업로드 실패
- Storage 업로드 성공 후 DB 저장 실패
- 허용되지 않은 파일 형식 또는 용량 초과 파일 업로드
- 네트워크 오류로 업로드 중단

---

## 검증 항목

- [ ] 로그인 유저만 등록 페이지 접근 가능
- [ ] 제목/설명/카테고리/파일 입력이 RHF에 정상 등록됨
- [ ] 이미지/PDF 다중 선택과 제출 상태(`isSubmitting`)가 정상 동작
- [ ] Zod 검증 실패 시 필드 에러 메시지가 노출됨
- [ ] 이미지/PDF 업로드 후 URL이 `Design.images`/`Design.instructions`에 저장됨
- [ ] 저장 실패 시 업로드 파일 정리 로직이 동작함
- [ ] 등록 성공 후 목록 또는 상세 페이지로 정상 이동함
