import { Copy, Check } from 'lucide-react';

interface Props {
  copied: boolean;
  onClick: () => void;
}

export default function CopyEmailsButton({ copied, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors relative"
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


