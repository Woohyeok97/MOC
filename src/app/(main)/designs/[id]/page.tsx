import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Share2, Check, Bookmark, PencilLine } from 'lucide-react';
import { getDesignById, getIsPurchased } from '@/entities/design/design.api';
import { getAuthSession } from '@/features/auth/auth.api';
// components
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { DesignImageCarousel } from '@/entities/design/ui/DesignImageCarousel';
import { PurchaseButton } from '@/features/design-purchase/ui/PurchaseButton';
import { InstructionDownloadButton } from '@/features/design-purchase/ui/InstructionDownloadButton';

type ViewerState =
  | 'guest_free' // 비로그인 + 무료 + 설명서 있음
  | 'guest_paid' // 비로그인 + 유료 + 설명서 있음
  | 'owner' // 본인
  | 'unbought' // 로그인 + 유료 + 미구매 + 설명서 있음
  | 'bought' // 로그인 + 유료 + 구매함 + 설명서 있음
  | 'free' // 로그인 + 무료 + 설명서 있음
  | 'no_instructions' // 무료 + 설명서 없음
  | 'guest_no_instructions'; // 비로그인 + 설명서 없음

export default async function DesignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: designId } = await params;
  const [design, user] = await Promise.all([getDesignById(designId), getAuthSession()]);

  // 해당 디자인이 없는 경우
  if (!design) notFound();

  // 사용자의 해당 디자인 구매 여부
  const isPurchased = user ? await getIsPurchased(user.id, design.id) : false;

  // viewer 상태
  const viewerState: ViewerState = (() => {
    const hasInstructions = design.instructions.length > 0; // Instruction 여부
    const isFree = design.price === 0; // 유료, 무료 여부

    if (!user) return hasInstructions ? (isFree ? 'guest_free' : 'guest_paid') : 'guest_no_instructions';
    if (user.id === design.authorId) return 'owner';
    if (isFree) return hasInstructions ? 'free' : 'no_instructions';
    return isPurchased ? 'bought' : 'unbought';
  })();

  // const viewerState: ViewerState = 'unbought';

  // 캐러셀에 넣을 이미지 배열: thumbnail 첫 번째, 이후 gallery
  const carouselImages = [design.thumbnail, ...design.images].filter(Boolean);

  return (
    <main className="detail-page-pad max-w-7xl px-8 pt-4 pb-20" style={{ margin: '14px auto 0' }}>
      <div className="detail-layout-grid">
        {/* 이미지 캐러셀 영역 */}
        <div className="detail-ga-image">
          <DesignImageCarousel images={carouselImages} />
        </div>

        {/* 정보 패널 — sticky */}
        <aside className="detail-ga-info detail-sticky flex flex-col gap-5 rounded-[20px] border border-[#efefef] bg-white p-6">
          <div>
            <Badge variant="secondary" className="capitalize">
              {design.category}
            </Badge>
            <h1 className="mt-3 text-2xl font-bold">{design.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 overflow-hidden rounded-[50%] bg-[#e0e0d9]">
              {/* 추후 이미지 태그 & 디자인 유저 아바타 삽입 */}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-[#211922]">{design.author.name}</div>
              <div className="text-muted-foreground text-xs">{design.createdAt.toLocaleDateString()}</div>
            </div>
          </div>

          {design.price !== 0 && (
            <div className="flex items-end gap-1">
              <span className="text-lg font-semibold">$</span>
              <div className="text-3xl font-bold">{design.price}</div>
            </div>
          )}

          {/* Instruction 다운로드  */}
          {design.instructions.length > 0 && (
            <div className="flex flex-col gap-2">
              {design.instructions.map((instruction, index) => (
                <InstructionDownloadButton
                  key={index}
                  designId={designId}
                  index={index}
                  label={`Instruction_${index + 1}.pdf`}
                  isEnabled={viewerState === 'owner' || viewerState === 'bought' || viewerState === 'free'}
                />
              ))}
            </div>
          )}

          <div>
            {viewerState === 'guest_free' && (
              <Link href="/signin">
                <Button size="lg" className="h-auto w-full text-sm">
                  <LogIn /> 로그인하고 다운로드하기
                </Button>
              </Link>
            )}

            {viewerState === 'guest_paid' && (
              <Link href="/signin">
                <Button size="lg" className="h-auto w-full text-sm">
                  <LogIn /> 로그인하고 구매하기
                </Button>
              </Link>
            )}

            {viewerState === 'owner' && (
              <Link href="#">
                <Button size="lg" variant="secondary" className="h-auto w-full text-sm">
                  <PencilLine /> 수정
                </Button>
              </Link>
            )}

            {viewerState === 'unbought' && (
              <div>
                <PurchaseButton designId={design.id} />
              </div>
            )}

            {viewerState === 'bought' && (
              <div className="flex items-center gap-3 rounded-xl border border-[#0066ff2e] bg-[#e7ecf4] px-4 py-3">
                <div className="bg-primary flex h-7 w-7 items-center justify-center rounded-[50%]">
                  <Check size={16} color="white" />
                </div>
                <div>
                  <p className="text-primary text-sm font-bold">구매 완료</p>
                  <p className="text-muted-foreground text-xs">다운로드 가능</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="lg" className="h-auto flex-1 text-sm">
              <Bookmark /> 저장
            </Button>
            <Button variant="secondary" size="lg" className="h-auto flex-1 text-sm">
              <Share2 /> 공유
            </Button>
          </div>
        </aside>

        {/* 작품 설명 */}
        <div className="detail-ga-desc pt-7">{design.description}</div>
      </div>
    </main>
  );
}
