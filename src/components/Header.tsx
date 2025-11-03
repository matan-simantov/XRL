import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="flex items-center justify-end p-6 h-[73px]">
      <Link to="/dashboard">
        <img 
          src="/Innovation-logo.png" 
          alt="Innovation" 
          className="h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity"
        />
      </Link>
    </header>
  );
};

export default Header;

