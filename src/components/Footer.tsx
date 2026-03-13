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
        </footer>
      )
}