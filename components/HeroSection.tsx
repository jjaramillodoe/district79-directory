import { User, UserRound, UserSquare } from 'lucide-react';

const executives = [
  {
    name: 'Glenda Esperance',
    title: 'Superintendent',
    image: <UserRound className="h-12 w-12 text-white" />,
  },
  {
    name: 'Jerry Brito',
    title: 'Deputy Superintendent',
    image: <UserRound className="h-12 w-12 text-white" />,
  },
  {
    name: 'Veronica Pichardo',
    title: 'Executive Director',
    image: <UserRound className="h-12 w-12 text-white" />,
  },
  {
    name: 'Annette Knox',
    title: 'Executive Director',
    image: <UserSquare className="h-12 w-12 text-white" />,
  },
  {
    name: 'Ben Meade',
    title: 'Director of Student Services',
    image: <UserSquare className="h-12 w-12 text-white" />,
  },
  {
    name: 'Stacey Oliger',
    title: 'Director of Communications',
    image: <UserSquare className="h-12 w-12 text-white" />,
  },
  {
    name: 'Randy Cole',
    title: 'Director of Operations',
    image: <UserSquare className="h-12 w-12 text-white" />,
  }
];

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">District 79 Directory</h1>
          <p className="text-blue-100 text-xl mb-2">Alternative Education for All</p>
          <div className="inline-block mt-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm">
            Serving students across New York City
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Executive Leadership</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {executives.map((executive) => (
              <div className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center shadow-lg">
                    {executive.image}
                  </div>
                  <p className="font-bold text-lg mb-1">{executive.title}</p>
                  <p className="text-blue-100 text-sm">{executive.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 w-full">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0L60 10C120 20 240 40 360 53.3C480 67 600 73 720 70C840 67 960 53 1080 48C1200 43 1320 47 1380 49.3L1440 51.3V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}


