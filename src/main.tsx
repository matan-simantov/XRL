import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force light mode
document.documentElement.classList.remove("dark");
localStorage.removeItem("xrl:darkMode");

createRoot(document.getElementById("root")!).render(<App />);
