export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-16">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm">
        <p className="text-gray-400">© {new Date().getFullYear()} NYC Public Schools - District 79 | All rights reserved.</p>
        <p className="text-gray-500 mt-1">
          Developed by Javier Jaramillo |{' '}
          <a 
            href="mailto:jjaramillo7@schools.nyc.gov" 
            className="hover:text-white transition-colors"
          >
            jjaramillo7@schools.nyc.gov
          </a>
        </p>
      </div>
    </footer>
  );
}

