import { DesignCard } from '@/entities/design/ui/DesignCard';
import { getDesigns } from '@/entities/design/design.api';

export default async function Home() {
  const designs = await getDesigns();

  if (designs.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-semibold text-zinc-900">등록된 도안이 없습니다</p>
        <p className="text-sm text-zinc-500">첫 번째 도안을 업로드해 보세요!</p>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="masonry-grid" style={{ '--item-count': designs.length } as React.CSSProperties}>
        {designs.map(design => (
          <DesignCard key={design.id} design={design} />
        ))}
      </div>
    </div>
  );
}
