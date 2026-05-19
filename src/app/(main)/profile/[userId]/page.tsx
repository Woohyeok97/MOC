// next
import { notFound } from 'next/navigation';
import Image from 'next/image';
// icons
import { LayoutGrid, ShoppingBag } from 'lucide-react';
// features
import { getCurrentUser } from '@/features/auth/auth.api';
// entities
import { getUserProfile, getUserPurchaseList } from '@/entities/user/user.api';
import { getUserDesignList } from '@/entities/design/design.api';
import { DesignCard } from '@/entities/design/ui/DesignCard';
// shared
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
// types
import type { PurchaseItemType } from '@/entities/user/user.type';

// types
type Params = Promise<{ userId: string }>;

export default async function ProfilePage({ params }: { params: Params }) {
  const { userId } = await params;

  // 1. 현재 로그인 유저 확인 (cache()로 중복 호출 방지)
  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === userId;

  // 2. 프로필 + 디자인 목록 + (본인이면) 구매 내역 병렬 패치
  const [profile, designs, purchases] = await Promise.all([
    getUserProfile(userId),
    getUserDesignList(userId),
    isOwner ? getUserPurchaseList(userId) : Promise.resolve(null)
  ]);

  if (!profile) notFound();

  // 3. 아바타 — 본인이고 avatarUrl 있으면 사용, 없으면 이니셜
  const avatarUrl = isOwner ? (currentUser?.avatarUrl ?? null) : null;
  const initial = (profile.name ?? 'U')[0].toUpperCase();

  // 본인 여부
  const isOwnProfile = isOwner && purchases !== null;

  return (
    <div>
      {/* 프로필 헤더 */}
      <div className="flex flex-col items-center border-b px-4 py-12 md:py-16">
        {/* 아바타 */}
        <div className="ring-primary bg-secondary relative size-20 shrink-0 overflow-hidden rounded-full ring-[3px] md:size-24">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={profile.name ?? '프로필'} fill className="object-cover" sizes="96px" />
          ) : (
            <span className="text-muted-foreground flex h-full w-full items-center justify-center text-2xl font-bold">
              {initial}
            </span>
          )}
        </div>

        {/* 유저명 */}
        <h1 className="mt-4 text-xl font-bold md:text-2xl">{profile.name ?? '알 수 없는 유저'}</h1>

        {/* 바이오 (임시 하드코딩) */}
        <p className="text-muted-foreground mt-2 max-w-sm text-center text-sm leading-relaxed">
          레고 디자인을 통해 세상의 이야기를 만들어갑니다.
          <br />
          건축과 판타지 테마를 주로 작업하고 있어요.
        </p>
      </div>

      {/* 콘텐츠 영역 */}
      {isOwnProfile ? (
        // 본인 프로필 — 탭 UI
        <Tabs defaultValue="designs">
          <TabsList className="gap-6 px-4">
            <TabsTrigger value="designs" className="gap-1.5">
              <LayoutGrid size={15} />내 디자인
              <span className="bg-secondary text-muted-foreground in-aria-selected:bg-foreground in-aria-selected:text-background rounded-full px-2 py-0.5 text-xs">
                {profile.designCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="purchases" className="gap-1.5">
              <ShoppingBag size={15} />
              구매 내역
              <span className="bg-secondary text-muted-foreground in-aria-selected:bg-foreground in-aria-selected:text-background rounded-full px-2 py-0.5 text-xs">
                {purchases.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* 내 디자인 탭 */}
          <TabsContent value="designs">
            {designs.length === 0 ? (
              <p className="text-muted-foreground py-20 text-center text-sm">아직 등록한 디자인이 없어요</p>
            ) : (
              <div className="columns-[200px] gap-2.5 p-4">
                {designs.map(design => (
                  <DesignCard key={design.id} design={design} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* 구매 내역 탭 */}
          <TabsContent value="purchases" className="px-4">
            {purchases.length === 0 ? (
              <p className="text-muted-foreground py-20 text-center text-sm">아직 구매한 디자인이 없어요</p>
            ) : (
              <ul>
                {purchases.map(purchase => (
                  <PurchaseItem key={purchase.id} purchase={purchase} />
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        // 타인 프로필 — 탭 없이 그리드
        <>
          {designs.length === 0 ? (
            <p className="text-muted-foreground py-20 text-center text-sm">아직 등록한 디자인이 없어요</p>
          ) : (
            <div className="columns-[200px] gap-2.5 p-4">
              {designs.map(design => (
                <DesignCard key={design.id} design={design} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 구매 내역 날짜 포맷 (2025.12.15)
function formatDate(date: Date): string {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

// 구매 내역 단일 아이템 — 데스크탑 행 / 모바일 카드 반응형
function PurchaseItem({ purchase }: { purchase: PurchaseItemType }) {
  return (
    <li className="border-b last:border-b-0">
      {/* 모바일: 카드 레이아웃 */}
      <div className="block py-4 sm:hidden">
        <div className="bg-secondary relative aspect-video w-full overflow-hidden rounded-lg">
          <Image
            src={purchase.design.thumbnail}
            alt={purchase.design.title}
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="mt-3 px-1">
          <p className="text-sm leading-snug font-semibold">{purchase.design.title}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="bg-secondary inline-block size-5 shrink-0 rounded-full" />
            <span className="text-muted-foreground text-xs">{purchase.design.author.name}</span>
          </div>
          <p className="mt-1 text-sm font-semibold">₩{purchase.amount.toLocaleString()}</p>
        </div>
      </div>

      {/* 데스크탑: 행 레이아웃 */}
      <div className="hidden items-center gap-4 py-4 sm:flex">
        <div className="bg-secondary relative size-18 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={purchase.design.thumbnail}
            alt={purchase.design.title}
            fill
            className="object-cover"
            sizes="72px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-snug font-semibold">{purchase.design.title}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="bg-secondary inline-block size-5 shrink-0 rounded-full" />
            <span className="text-muted-foreground text-xs">{purchase.design.author.name}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold">₩{purchase.amount.toLocaleString()}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">{formatDate(purchase.purchasedAt)}</p>
        </div>
      </div>
    </li>
  );
}
