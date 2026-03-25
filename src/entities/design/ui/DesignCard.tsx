import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Download, User } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import type { Design } from '@/entities/design/design.type';

export function DesignCard({ design }: { design: Design }) {
  const thumbnailUrl = design.images[0] ?? ''; // 썸네일

  return (
    <Link href="#" className="group block cursor-pointer break-inside-avoid">
      <div className="relative overflow-hidden rounded-2xl bg-zinc-200">
        {thumbnailUrl && (
          <Image
            src={thumbnailUrl}
            alt={design.title}
            width={600}
            height={800}
            className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        )}

        <Badge className="bg-primary text-primary-foreground absolute top-3 left-3">{design.category}</Badge>

        <div className="absolute inset-0 flex flex-col justify-end bg-black/60 p-4 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="space-y-2">
            <div>
              <h3 className="line-clamp-2 text-base leading-tight font-bold">{design.title}</h3>
              <div className="mt-1 flex items-center gap-1.5 text-white/80">
                <User className="h-3 w-3" />
                <span className="text-xs font-medium">{design.authorId}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-white/20 pt-2 text-[11px] font-medium text-white/70">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(design.createdAt).toLocaleDateString('ko-KR')}
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {design.price === 0 ? '무료' : `₩${design.price.toLocaleString()}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 px-1">
        <h3 className="truncate text-sm font-semibold text-zinc-900">{design.title}</h3>
        <p className="mt-0.5 text-xs text-zinc-500">{design.authorId}</p>
      </div>
    </Link>
  );
}
