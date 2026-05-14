import { notFound } from 'next/navigation';
import { Star } from 'lucide-react';
import { getDesignById, getIsPurchased } from '@/entities/design/design.api';
import { DesignDetailTabs } from '@/entities/design/ui/DesignDetailTabs';
import { DesignImageCarousel } from '@/entities/design/ui/DesignImageCarousel';
import { InstructionDownloadButton } from '@/features/design-purchase/ui/InstructionDownloadButton';
import { PurchaseButton } from '@/features/design-purchase/ui/PurchaseButton';
import { getCurrentUser } from '@/features/auth/auth.api';
// components
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
// types
import type { DesignWithAuthor } from '@/entities/design/design.type';
import type { UserProfile } from '@/entities/user/user.type';

const RATING = 4.9;
const REVIEW_COUNT = 128;

type ButtonState = 'no-instructions' | 'login-required' | 'get' | 'buy';

function getButtonState(user: UserProfile | null, design: DesignWithAuthor, isPurchased: boolean): ButtonState {
  if (design.instructions.length === 0) return 'no-instructions';
  if (!user) return 'login-required';
  if (user.id === design.authorId || isPurchased) return 'get';
  return 'buy';
}

export default async function DesignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: designId } = await params;
  const [design, user] = await Promise.all([getDesignById(designId), getCurrentUser()]);

  // 해당 디자인이 없는 경우
  if (!design) notFound();

  const isPurchased = user ? await getIsPurchased(user.id, design.id) : false; // 사용자의 해당 디자인 구매 여부
  const buttonState = getButtonState(user, design, isPurchased);

  return (
    <div>
      {/* 히어로 */}
      <div className="relative h-[480px] w-full overflow-hidden">
        <DesignImageCarousel
          images={design.images.length > 0 ? [design.thumbnail, ...design.images] : [design.thumbnail]}
          title={design.title}
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8">
          <Badge className="mb-3">{design.category}</Badge>
          <h1 className="text-3xl font-bold text-white">{design.title}</h1>
        </div>
      </div>

      {/* 본문 */}
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 md:flex-row">
        {/* 사이드바 — 모바일 먼저, 데스크톱 오른쪽 */}
        <aside className="border-border w-full shrink-0 space-y-5 rounded-xl border p-6 md:order-last md:w-80">
          {/* 가격 + 별점 */}
          <div>
            <p className="text-muted-foreground text-xs tracking-wide uppercase">Price</p>
            <div className="mt-1 flex items-end justify-between">
              <span className="text-2xl font-bold">{design.price === 0 ? '무료' : `$${design.price}`}</span>
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                <Star className="fill-primary text-primary size-3.5" />
                <span className="text-foreground font-semibold">{RATING}</span>
                <span>({REVIEW_COUNT})</span>
              </div>
            </div>
          </div>

          {/* CTA 버튼 */}
          <div className="space-y-2">
            {(buttonState === 'no-instructions' || buttonState === 'login-required') && (
              <Button size="lg" className="w-full" disabled>
                {buttonState === 'no-instructions' ? '설명서 없음' : '로그인 필요'}
              </Button>
            )}
            {buttonState === 'get' && <InstructionDownloadButton designId={design.id} />}
            {buttonState === 'buy' && <PurchaseButton designId={design.id} />}
          </div>

          {/* 디자이너 */}
          <div className="border-border flex items-center gap-3 border-t pt-4">
            <div className="bg-muted size-9 shrink-0 rounded-full" />
            <div>
              <p className="text-sm font-medium">{design.author.name ?? design.authorId}</p>
              <p className="text-muted-foreground text-xs">Designer</p>
            </div>
          </div>
        </aside>

        {/* 탭 영역 */}
        <div className="border-border flex-1 overflow-hidden rounded-xl border">
          <DesignDetailTabs design={design} />
        </div>
      </div>
    </div>
  );
}
