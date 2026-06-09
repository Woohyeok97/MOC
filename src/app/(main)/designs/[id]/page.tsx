import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LogIn, Share2, Bookmark, PencilLine } from 'lucide-react';
import { getDesignById } from '@/entities/design/design.api';
import { getAuthSession } from '@/features/auth/auth.api';
// components
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { DesignImageCarousel } from '@/entities/design/ui/DesignImageCarousel';
import { InstructionDownloadButton } from '@/features/design-download/ui/InstructionDownloadButton';

type ViewerState = 'owner' | 'viewer' | 'guest';

export default async function DesignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: designId } = await params;
  const [design, user] = await Promise.all([getDesignById(designId), getAuthSession()]);

  if (!design) notFound();

  const viewerState: ViewerState = (() => {
    if (!user) return 'guest';
    if (user.id === design.authorId) return 'owner';
    return 'viewer';
  })();

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
        <aside className="detail-ga-info detail-sticky border-secondary flex flex-col gap-5 rounded-[20px] border bg-white p-6">
          <div>
            <Badge variant="secondary" className="capitalize">
              {design.category}
            </Badge>
            <h1 className="mt-3 text-2xl font-bold">{design.title}</h1>
          </div>
          <Link href={`/profile/${design.author.id}`} className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-[50%] bg-[#e0e0d9]">
              {design.author.avatarUrl && (
                <Image
                  src={design.author.avatarUrl}
                  alt={design.author.name ?? '작성자'}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <div className="text-surface-dark text-sm font-bold">{design.author.name}</div>
              <div className="text-muted-foreground text-xs">{design.createdAt.toLocaleDateString()}</div>
            </div>
          </Link>

          {/* Instruction 다운로드 */}
          {design.instructions.length > 0 && (
            <div className="flex flex-col gap-2">
              {design.instructions.map((instruction, index) => (
                <InstructionDownloadButton
                  key={index}
                  designId={designId}
                  index={index}
                  label={design.instructionNames[index] || `Instruction_${index + 1}.pdf`}
                  isEnabled={viewerState !== 'guest'}
                />
              ))}
            </div>
          )}

          <div>
            {viewerState === 'guest' && (
              <Link href="/signin">
                <Button size="lg" className="h-auto w-full cursor-pointer text-sm">
                  <LogIn /> 로그인하고 다운로드하기
                </Button>
              </Link>
            )}

            {viewerState === 'owner' && (
              <Link href={`/designs/${designId}/edit`}>
                <Button size="lg" variant="secondary" className="h-auto w-full cursor-pointer text-sm">
                  <PencilLine /> 수정
                </Button>
              </Link>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="lg" className="h-auto flex-1 cursor-pointer text-sm">
              <Bookmark /> 저장
            </Button>
            <Button variant="secondary" size="lg" className="h-auto flex-1 cursor-pointer text-sm">
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
