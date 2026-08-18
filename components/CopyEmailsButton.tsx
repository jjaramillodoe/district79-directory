import { Copy, Check } from 'lucide-react';

interface Props {
  copied: boolean;
  onClick: () => void;
}

export default function CopyEmailsButton({ copied, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg bg-d79-navy px-3 py-2 text-sm font-medium text-white hover:bg-d79-blue"
      title="Copy principal and assistant principal emails from filtered results"
    >
      {copied ? (
        <>
          <Check className="h-5 w-5" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-5 w-5" />
          Copy Emails
        </>
      )}
    </button>
  );
}


