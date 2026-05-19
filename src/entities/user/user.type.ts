// 유저 엔티티 타입 정의

export interface UserProfile {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

// 프로필 헤더용 — 디자인 수 포함
export interface UserWithCount {
  id: string;
  name: string | null;
  designCount: number;
}

// 구매 내역 아이템 (mock 데이터 기반)
export interface PurchaseItemType {
  id: string;
  amount: number;
  purchasedAt: Date;
  design: {
    id: string;
    title: string;
    thumbnail: string;
    author: {
      name: string | null;
      avatarUrl: string | null;
    };
  };
}
