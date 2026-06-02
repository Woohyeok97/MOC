import { DesignCard } from '@/entities/design/ui/DesignCard';
import { getDesigns } from '@/entities/design/design.api';

type SearchParams = Promise<{ query?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const { query } = await searchParams;
  const designs = await getDesigns(query); // 검색어가 있으면 서버에서 제목 기준으로 필터링된 목록

  return (
    <div className="columns-[200px] gap-2.5 p-4">
      {designs.map(design => (
        <DesignCard key={design.id} design={design} />
      ))}

      {/* 검색 결과가 없을 때 */}
      {designs.length === 0 && (
        <p className="py-20 text-center text-[14px] text-[#91918c]">검색 결과가 없어요</p>
      )}
    </div>
  );
}
