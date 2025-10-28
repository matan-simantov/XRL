const Footer = () => {
  return (
    <footer className="mt-auto pt-8">
      <div className="border-t border-border/50"></div>
      <div className="flex items-center justify-center gap-1 py-2">
        <span className="text-xs text-muted-foreground">Website by</span>
        <img 
          src="/yg-logo.png" 
          alt="SYG Consulting" 
          className="h-24 w-auto"
        />
      </div>
    </footer>
  );
};

export default Footer;

