// next
import { notFound } from 'next/navigation';
import Image from 'next/image';
// entities
import { getUserProfile } from '@/entities/user/user.api';
import { getUserDesignList } from '@/entities/design/design.api';
import { DesignCard } from '@/entities/design/ui/DesignCard';

// types
type Params = Promise<{ userId: string }>;

export default async function ProfilePage({ params }: { params: Params }) {
  const { userId } = await params;

  const [profile, designs] = await Promise.all([
    getUserProfile(userId),
    getUserDesignList(userId),
  ]);

  if (!profile) notFound();

  const userNameInitial = (profile.name ?? 'U')[0].toUpperCase();

  return (
    <div>
      {/* 프로필 헤더 */}
      <div className="flex flex-col items-center border-b px-4 py-12 md:py-16">
        {/* 아바타 */}
        <div className="ring-primary bg-secondary relative size-20 shrink-0 overflow-hidden rounded-full ring-[3px] md:size-24">
          {profile.avatarUrl ? (
            <Image src={profile.avatarUrl} alt={profile.name ?? '프로필'} fill className="object-cover" sizes="96px" />
          ) : (
            <span className="text-muted-foreground flex h-full w-full items-center justify-center text-2xl font-bold">
              {userNameInitial}
            </span>
          )}
        </div>

        {/* 유저명 */}
        <h1 className="mt-4 text-xl font-bold md:text-2xl">{profile.name ?? '알 수 없는 유저'}</h1>

        {/* 바이오 (임시 하드코딩) */}
        <p className="text-muted-foreground mt-2 max-w-sm text-center text-sm leading-relaxed">
          레고 디자인을 통해 세상의 이야기를 만들어갑니다.
          <br />
          건축과 판타지 테마를 주로 작업하고 있어요.
        </p>
      </div>

      {/* 디자인 목록 */}
      {designs.length === 0 ? (
        <p className="text-muted-foreground py-20 text-center text-sm">아직 등록한 디자인이 없어요</p>
      ) : (
        <div className="columns-[200px] gap-2.5 p-4">
          {designs.map(design => (
            <DesignCard key={design.id} design={design} />
          ))}
        </div>
      )}
    </div>
  );
}
