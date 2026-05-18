'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
// components
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/shared/ui/carousel';
// utils
import { cn } from '@/shared/lib/utils';

interface DesignImageCarouselProps {
  images: string[];
}

export function DesignImageCarousel({ images }: DesignImageCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasMultiple = images.length > 1;

  const onSelect = useCallback((api: CarouselApi) => {
    if (!api) return;
    setCurrentIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api, onSelect]);

  return (
    <div className="flex flex-col gap-3">
      {/* 메인 캐러셀 */}
      <Carousel setApi={setApi} opts={{ loop: true }}>
        <div className="relative aspect-4/3 overflow-hidden rounded-[20px] bg-black">
          <CarouselContent className="ml-0 h-full">
            {images.map((src, i) => (
              <CarouselItem key={i} className="h-full pl-0">
                <div className="relative h-full w-full">
                  {/* 블러 배경 (세로 이미지 양옆 빈 공간 채움) */}
                  {}
                  {/* <img
                    src={src}
                    alt=""
                    aria-hidden
                    draggable="false"
                    className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
                  /> */}
                  {/* 메인 이미지 */}
                  <Image
                    src={src}
                    alt={`이미지 ${i + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* 닷 인디케이터 */}
          {hasMultiple && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-colors',
                    i === currentIndex ? 'bg-white' : 'bg-white/50'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </Carousel>

      {/* 썸네일 스트립 */}
      {hasMultiple && (
        <div className="flex gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => api?.scrollTo(i)}
              className={cn(
                'h-20 w-20 shrink-0 overflow-hidden rounded-lg transition-all',
                i === currentIndex ? 'ring-2 ring-blue-500' : 'opacity-70 ring-1 ring-transparent'
              )}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`썸네일 ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
