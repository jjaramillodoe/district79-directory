import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <img 
                src="/images/d79logo.png" 
                alt="District 79" 
                className="h-16 object-contain cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
            <div>
              <Link href="/">
                <h1 className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors">District 79 Directory</h1>
              </Link>
              <p className="text-sm text-gray-600">Adult Education & Youth Programs</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Directory
              </Link>
              <Link 
                href="/map" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Map
              </Link>
              <Link 
                href="/analytics" 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Analytics
              </Link>
            </nav>
            <img 
              src="/images/nycpublicshools.png" 
              alt="NYC Public Schools" 
              className="h-16 object-contain"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

