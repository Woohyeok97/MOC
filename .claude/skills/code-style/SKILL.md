---
name: code-style
description: 코드를 작성/수정/리팩토링할 때 항상 참고하는 코드 스타일 가이드. 비-관용적 패턴 회피, 명확한 네이밍, 가독성 좋은 코드를 위한 안티 패턴 카탈로그. 새 파일 작성, 함수 추가, 기존 코드 수정 시 자동 발동.
---

# 코드 스타일 가이드

이 카탈로그에 정의된 안티 패턴을 피하고 선호 패턴을 따를 것.
새 코드 작성, 기존 코드 수정, 리팩토링 모든 경우에 적용.

## 적용 방식

- 코드 작성 전 관련된 안티 패턴이 있는지 확인
- 코드 작성 중 패턴을 따르는지 점검
- 작성 후 자가 검토 시 카탈로그와 대조

---

## 안티 패턴 카탈로그

### CS-1: React/라이브러리 훅은 네임스페이스 없이 직접 임포트

**원칙**: `React.useState()` 같은 네임스페이스 호출 대신, 필요한 훅을 직접 임포트해서 사용.

**Before** (피할 패턴):

```tsx
import React from 'react';

function Component() {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    /* ... */
  }, []);
}
```

**After** (선호 패턴):

```tsx
import { useState, useEffect } from 'react';

function Component() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    /* ... */
  }, []);
}
```

**왜**: 트리 쉐이킹 친화적이고, 코드가 짧아지고, React 커뮤니티의 관용적 스타일.

---

### CS-2: map/filter 콜백 파라미터는 의미 있는 풀네임으로

**원칙**: `arr.map(d => ...)`처럼 한 글자 약어 쓰지 말 것. 변수의 역할이 코드에서 즉시 파악되어야 함.

**Before** (피할 패턴):

```tsx
{
  designs.map(d => <DesignCard key={d.id} design={d} />);
}

{
  users.filter(u => u.active).map(u => <UserRow user={u} />);
}
```

**After** (선호 패턴):

```tsx
{
  designs.map(design => <DesignCard key={design.id} design={design} />);
}

{
  users.filter(user => user.active).map(user => <UserRow user={user} />);
}
```

**예외**: 진짜 의미 없는 인덱스나 좌표는 `i`, `x`, `y` 허용. 단 도메인 객체는 절대 한 글자 금지.

**왜**: 한 글자 변수는 읽을 때마다 "이게 뭐였지?"를 다시 생각하게 만듦. 풀네임은 인지 부하 0.

---

<!-- 새 안티 패턴은 여기 아래에 CS-3, CS-4, ... 형식으로 추가 -->

---

## 카탈로그 외 일반 원칙

위 구체 사례가 없어도 다음 원칙을 따를 것:

- **명확한 네이밍**: 변수/함수/컴포넌트는 역할이 즉시 파악되는 이름
- **관용적 패턴 우선**: 라이브러리/프레임워크의 일반적 사용 스타일을 따를 것
- **자기 설명적 코드**: 주석 없이도 읽히는 코드가 우선, 주석은 "왜"를 설명할 때만
