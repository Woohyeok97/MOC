import Image from 'next/image';
import Link from 'next/link';
import type { Design } from '@/entities/design/design.type';

export function DesignCard({ design }: { design: Design }) {
  const thumbnailUrl = design.images[0] ?? ''; // 썸네일

  return (
    <Link
      href="#"
      className="group mb-[10px] block cursor-pointer break-inside-avoid transition-transform duration-170 ease-out hover:-translate-y-0.5">
      <div className="relative overflow-hidden rounded-[14px] bg-[#efefef]">
        {thumbnailUrl && (
          <Image
            src={thumbnailUrl}
            alt={design.title}
            width={600}
            height={800}
            className="h-auto w-full object-cover transition-[transform,filter] duration-700 group-hover:scale-[1.04] group-hover:brightness-[0.62]"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        )}

        {/* hover 오버레이 — 기본 숨김, hover 시 fade in */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-180 group-hover:opacity-100">
          {/* 카테고리 배지 */}
          <span className="bg-primary absolute top-[10px] left-[10px] rounded-full px-[10px] py-1 text-[10px] font-semibold tracking-[0.2px] text-white shadow-[0_2px_6px_rgba(0,102,255,0.35)]">
            {design.category}
          </span>

          {/* 하단 제목 + 작성자 */}
          <div className="absolute inset-x-0 bottom-0 px-3 pt-3.5 pb-3">
            <p className="line-clamp-2 text-[13px] leading-[1.3] font-bold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.4)]">
              {design.title}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="inline-block h-4 w-4 shrink-0 rounded-full bg-[#e0e0d9]" />
              <span className="text-[11px] text-white/85">{design.authorId}</span>
              {design.price > 0 && (
                <span className="text-[11px] text-white/60">· ₩{design.price.toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
