'use client';

// icons
import { Download, LockKeyhole } from 'lucide-react';
// features
import { useGetInstructionMutation } from '@/features/design-download/design-download.mutate';

interface InstructionDownloadButtonProps {
  designId: string;
  index: number;
  label: string;
  isEnabled: boolean;
}

export function InstructionDownloadButton({ designId, index, label, isEnabled }: InstructionDownloadButtonProps) {
  const { mutate, isPending } = useGetInstructionMutation({
    onSuccess: url => {
      window.open(url, '_blank');
    }
  });

  const handleDownloadInstruction = () => {
    if (!isEnabled) return;
    mutate({ designId, index });
  };

  return (
    <div className="bg-muted border-input flex items-center justify-between rounded-xl border px-3 py-2">
      <div className="flex items-center gap-3">
        <div
          className={`${isEnabled ? 'bg-primary' : 'bg-[#91918c]'} flex h-8 w-8 items-center justify-center rounded-lg`}>
          <span className="text-[8px] font-extrabold text-white">PDF</span>
        </div>
        <div>
          <p className="text-[12.5px] font-semibold">{label}</p>
          <p className="text-muted-foreground text-[11px]">12.3 MB</p>
        </div>
      </div>
      <button
        onClick={handleDownloadInstruction}
        disabled={isPending || !isEnabled}
        className="bg-secondary flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg">
        {isEnabled ? <Download size={16} /> : <LockKeyhole size={16} />}
      </button>
    </div>
  );
}
