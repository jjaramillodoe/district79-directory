import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Support | District 79 Directory',
  description: 'Get help with the District 79 Directory.',
};

const SUPPORT_EMAIL = 'jjaramillo7@schools.nyc.gov';

export default function SupportPage() {
  return (
    <div className="bg-slate-50">
      <div className="page-shell max-w-3xl py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-d79-navy">Support</h1>
        <p className="mt-2 text-slate-600">
          Help for authorized District 79 staff using this internal directory.
        </p>

        <div className="mt-8 space-y-6">
          <section className="surface-card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Site information is wrong
            </h2>
            <p className="mt-2 text-slate-700">
              Open the site in the directory and use <span className="font-medium">Report changes</span>.
              An admin reviews those requests before they go live.
            </p>
            <Link
              href="/home"
              className="mt-4 inline-flex rounded-lg bg-d79-navy px-4 py-2 text-sm font-medium text-white hover:bg-d79-blue"
            >
              Go to directory
            </Link>
          </section>

          <section className="surface-card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Sign-in problems
            </h2>
            <p className="mt-2 text-slate-700">
              Public directory access uses your NYC DOE Google account (
              <span className="font-medium">@schools.nyc.gov</span>). Admin tools use a separate password.
            </p>
          </section>

          <section className="surface-card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Technical help
            </h2>
            <p className="mt-2 text-slate-700">
              For bugs, access issues, or other questions, email the directory administrator:
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-d79-navy hover:bg-slate-50"
            >
              <Mail className="h-4 w-4" />
              {SUPPORT_EMAIL}
            </a>
            <p className="mt-3 text-sm text-slate-500">
              If your browser does not open email, copy the address above into Outlook or Gmail.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
