import { notFound } from 'next/navigation';
import { LayoutGrid, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
// components
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import { DesignCard } from '@/entities/design/ui/DesignCard';
// api
import { getCurrentUser } from '@/features/auth/auth.api';
import { getUserProfile, getUserPurchaseList } from '@/entities/user/user.api';
import { getUserDesignList } from '@/entities/design/design.api';

type Props = { params: Promise<{ userId: string }> };

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params;

  // 로그인, 유저 프로필, 유저 디자인 목록
  const [currentUser, profile, designs] = await Promise.all([
    getCurrentUser(),
    getUserProfile(userId),
    getUserDesignList(userId)
  ]);

  // 프로필이 없는 경우
  if (!profile) notFound();

  const isOwner = currentUser?.id === userId; // 본인 프로필 여부
  const purchaseList = isOwner ? await getUserPurchaseList(userId) : null; // 구매 목록

  // 디자인 그리드 (본인/타인 공통)
  const designsGrid = (
    <div className="columns-[200px] gap-2.5 p-4">
      {designs.map(design => (
        <DesignCard key={design.id} design={design} />
      ))}
      {designs.length === 0 && <p className="py-20 text-center text-[14px] text-[#91918c]">등록한 디자인이 없어요</p>}
    </div>
  );

  return (
    <div>
      {/* 프로필 헤더 */}
      <div className="flex flex-col items-center gap-3 px-4 py-10">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e0e0d9]">
          <span className="text-2xl font-semibold text-[#62625b]">{profile.name?.[0] ?? '?'}</span>
        </div>
        <h1 className="text-xl font-bold text-[#211922]">{profile.name}</h1>
        <p className="mb-6 text-sm text-[#62625b]">
          레고 디자인을 통해 세상의 이야기를 만들어갑니다. 건축과 판타지 테마를 주로 작업하고 있어요.
        </p>
      </div>

      {/* 컨텐츠 */}
      {isOwner && purchaseList ? (
        <Tabs defaultValue="designs">
          <TabsList variant="line" className="border-b-secondary flex w-full justify-start gap-6 border px-4">
            <TabsTrigger
              value="designs"
              className="group/trigger flex-none gap-1.5 px-0 py-4 text-[15px] group-data-horizontal/tabs:after:bottom-0">
              <LayoutGrid size={15} />내 디자인
              <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold group-data-[state=active]/trigger:bg-[#211922] group-data-[state=active]/trigger:text-white group-data-[state=inactive]/trigger:bg-[#efefef] group-data-[state=inactive]/trigger:text-[#62625b]">
                {profile._count.designs}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="purchases"
              className="group/trigger flex-none gap-1.5 px-0 py-4 text-[15px] group-data-horizontal/tabs:after:bottom-0">
              <ShoppingBag size={15} />
              구매 내역
              <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold group-data-[state=active]/trigger:bg-[#211922] group-data-[state=active]/trigger:text-white group-data-[state=inactive]/trigger:bg-[#efefef] group-data-[state=inactive]/trigger:text-[#62625b]">
                {profile._count.purchases}
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="designs">{designsGrid}</TabsContent>
          <TabsContent value="purchases">
            {/* 데스크탑: 리스트 행 / 모바일: 카드 */}
            <div className="sm:divide-y sm:divide-[#efefef]">
              {purchaseList.map(purchase => (
                <Link key={purchase.id} href={`/designs/${purchase.design.id}`} className="group block">
                  {/* 모바일: 카드 */}
                  <div className="p-3 sm:hidden">
                    <div className="overflow-hidden rounded-[16px] border border-[#efefef]">
                      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#efefef]">
                        {purchase.design.thumbnail && (
                          <Image
                            src={purchase.design.thumbnail}
                            alt={purchase.design.title}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-[15px] font-semibold text-[#211922]">{purchase.design.title}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="inline-block h-6 w-6 shrink-0 rounded-full bg-[#e0e0d9]" />
                          <span className="text-[13px] text-[#767676]">{purchase.design.author.name}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-[#efefef] pt-3">
                          <span className="text-[13px] text-[#91918c]">
                            {purchase.purchasedAt.toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </span>
                          <span className="text-[15px] font-bold text-[#211922]">
                            ₩{purchase.design.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* 데스크탑: 리스트 행 */}
                  <div className="hidden items-center gap-4 px-4 py-3 transition-colors hover:bg-[#fafafa] sm:flex">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[8px] bg-[#efefef]">
                      {purchase.design.thumbnail && (
                        <Image
                          src={purchase.design.thumbnail}
                          alt={purchase.design.title}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-[#211922]">{purchase.design.title}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="inline-block h-4 w-4 shrink-0 rounded-full bg-[#e0e0d9]" />
                        <span className="text-[13px] text-[#767676]">{purchase.design.author.name}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[14px] font-semibold text-[#211922]">
                        ₩{purchase.design.price.toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-[12px] text-[#91918c]">
                        {purchase.purchasedAt.toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
              {purchaseList.length === 0 && (
                <p className="py-20 text-center text-[14px] text-[#91918c]">구매한 디자인이 없어요</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="columns-[200px] gap-2.5 p-4">
          {designs.map(design => (
            <DesignCard key={design.id} design={design} />
          ))}
          {designs.length === 0 && (
            <p className="py-20 text-center text-[14px] text-[#91918c]">등록한 디자인이 없어요</p>
          )}
        </div>
      )}
    </div>
  );
}
