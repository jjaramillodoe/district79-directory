interface HeroSectionProps {
  siteCount?: number;
  boroughCount?: number;
  programCount?: number;
}

const executives = [
  { name: 'Glenda Esperance', title: 'Superintendent' },
  { name: 'Jerry Brito', title: 'Deputy Superintendent' },
  { name: 'Veronica Pichardo', title: 'Executive Director' },
  { name: 'Annette Knox', title: 'Executive Director' },
  { name: 'Ben Meade', title: 'Director of Student Services' },
  { name: 'Stacey Oliger', title: 'Director of Communications' },
  { name: 'Randy Cole', title: 'Director of Operations' },
];

export default function HeroSection({
  siteCount,
  boroughCount,
  programCount,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-d79-navy text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,120,212,0.35),transparent_42%)]" />
      <div className="page-shell relative z-10 py-10 sm:py-12">
        <div className="max-w-3xl">
          <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-blue-100">
            NYC Public Schools · Internal directory
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Find District 79 sites across New York City
          </h1>
          <p className="mt-3 max-w-2xl text-base text-blue-100 sm:text-lg">
            Search open Adult Education and Youth Program locations, contact staff, and export the current view.
          </p>
        </div>

        {(siteCount || boroughCount || programCount) && (
          <dl className="mt-8 grid grid-cols-3 gap-3 max-w-xl">
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-blue-200">Open sites</dt>
              <dd className="mt-1 text-2xl font-semibold">{siteCount ?? 0}</dd>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-blue-200">Boroughs</dt>
              <dd className="mt-1 text-2xl font-semibold">{boroughCount ?? 0}</dd>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-blue-200">Programs</dt>
              <dd className="mt-1 text-2xl font-semibold">{programCount ?? 0}</dd>
            </div>
          </dl>
        )}

        <div className="mt-8 border-t border-white/15 pt-6">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-blue-200">
            Executive leadership
          </h2>
          <div className="flex flex-wrap gap-2">
            {executives.map((executive) => (
              <div
                key={`${executive.title}-${executive.name}`}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5"
              >
                <p className="text-sm font-medium leading-tight">{executive.name}</p>
                <p className="text-[11px] text-blue-200">{executive.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
