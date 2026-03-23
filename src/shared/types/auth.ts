// 클라이언트 전역 상태에서 사용하는 로그인 유저 프로필 타입
// Supabase User 타입 대신 이 프로젝트에서 실제로 쓰는 필드만 정의
export interface UserProfile {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}
