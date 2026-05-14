'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
// components
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi
} from '@/shared/ui/carousel';
// utils
import { cn } from '@/shared/lib/utils';

interface Props {
  images: string[];
  title: string;
}

export function DesignImageCarousel({ images, title }: Props) {
  // CarouselApi: Embla 인스턴스. setApi prop으로 Carousel이 마운트 후 주입해줌
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0); // 현재 슬라이드 인덱스 (dots 강조에 사용)
  const count = images.length; // 전체 슬라이드 수 — props에서 직접 파생

  useEffect(() => {
    if (!api) return;
    // 슬라이드 이동 시마다 현재 인덱스 갱신 (이벤트 콜백으로만 setState)
    const onSelect = () => setCurrentSlide(api.selectedScrollSnap());
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  return (
    <Carousel setApi={setApi} className="h-full w-full" opts={{ loop: true }}>
      <CarouselContent className="ml-0 h-full">
        {images.map((src, i) => (
          <CarouselItem key={i} className="relative h-full pl-0">
            <Image src={src} alt={`${title} ${i + 1}`} fill className="object-cover" priority={i === 0} />
          </CarouselItem>
        ))}
      </CarouselContent>

      {/* 화살표 — 기본 위치(-left-12/-right-12)를 left-4/right-4로 덮어써서 이미지 위에 오버레이. 단일 이미지면 숨김 */}
      {count > 1 && (
        <>
          <CarouselPrevious className="left-4 border-0 bg-black/40 text-white hover:bg-black/60 hover:text-white" />
          <CarouselNext className="right-4 border-0 bg-black/40 text-white hover:bg-black/60 hover:text-white" />
        </>
      )}

      {/* 점 인디케이터 — 슬라이드가 2장 이상일 때만 표시 */}
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {Array.from({ length: count }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'size-1.5 rounded-full transition-opacity',
                i === currentSlide ? 'bg-white' : 'bg-white/50'
              )}
            />
          ))}
        </div>
      )}
    </Carousel>
  );
}
