
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import "./App.css";
import SideMenu from "@/components/SideMenu";

function App() {
  return (
    <Router>
      <div className="flex">
        <SideMenu />
        <div className="flex-1">
          <Toaster />
        </div>
      </div>
    </Router>
  );
}

export default App;
