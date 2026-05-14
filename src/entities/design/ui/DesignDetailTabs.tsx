'use client';

// components
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
// types
import type { Design } from '@/entities/design/design.type';

export function DesignDetailTabs({ design }: { design: Design }) {
  return (
    <Tabs defaultValue="description" className="gap-0">
      {/* 탭 리스트 — 전체 너비 하단 보더 */}
      <div className="border-border border-b px-6 pt-4">
        <TabsList variant="line" className="flex gap-6">
          <TabsTrigger value="description">설명</TabsTrigger>
          <TabsTrigger value="parts">부품 수</TabsTrigger>
          <TabsTrigger value="reviews">리뷰</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="description" className="px-6 py-6">
        <p className="text-foreground/80 leading-relaxed">{design.description}</p>
      </TabsContent>

      <TabsContent value="parts" className="px-6 py-6">
        <p className="text-muted-foreground text-sm">부품 수 정보 준비 중</p>
      </TabsContent>

      <TabsContent value="reviews" className="px-6 py-6">
        <p className="text-muted-foreground text-sm">리뷰 준비 중</p>
      </TabsContent>
    </Tabs>
  );
}
