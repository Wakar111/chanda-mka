// creating footer component
export default function Footer() {
    return (
        <footer className="bg-black text-white text-center py-4 md:py-6 mt-6 md:mt-10 px-4">
          <p className="text-xs md:text-sm">
            © {new Date().getFullYear()} Majlis Khuddam-ul-Ahmadiyya. All rights reserved.
          </p>
          <p className="text-xs mt-1 text-gray-400">
            A youth organization dedicated to service, education, and community development.
          </p>
          <p className="text-xs mt-2 text-gray-500">
            Developed by{' '}
            <a 
              href="https://innovativ-tech.de/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors underline"
            >
              innovativ-tech.de
            </a>
          </p>
        </footer>
      )
}