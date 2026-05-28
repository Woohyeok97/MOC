import { DesignCard } from '@/entities/design/ui/DesignCard';
import { getDesigns } from '@/entities/design/design.api';

type SearchParams = Promise<{ query?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const { query } = await searchParams;
  const designs = await getDesigns(); // 디자인 리스트 요청

  // 목록으로 보여줄 디자인 리스트 → 검색어가 있으면 제목·작성자 이름 기준으로 걸러낸 목록, 없으면 전체 목록
  const filteredDesigns = query
    ? designs.filter(
        design =>
          design.title.toLowerCase().includes(query.toLowerCase()) ||
          (design.author.name ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : designs;

  return (
    <div className="columns-[200px] gap-[10px] p-4">
      {filteredDesigns.map(design => (
        <DesignCard key={design.id} design={design} />
      ))}

      {/* 검색 결과가 없을 때 */}
      {filteredDesigns.length === 0 && (
        <p className="py-20 text-center text-[14px] text-[#91918c]">검색 결과가 없어요</p>
      )}
    </div>
  );
}
