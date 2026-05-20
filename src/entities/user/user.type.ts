// 유저 엔티티 타입 정의

// 유저 프로필 타입
export interface UserProfileType {
  id: string;
  name: string | null;
  avatarUrl: string | null;
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
