
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import Call from "@/pages/Call";
import CreateCall from "@/pages/CreateCall";
import CreateWebCall from "@/pages/CreateWebCall";
import CreateBatchCall from "@/pages/CreateBatchCall";
import NotFound from "@/pages/NotFound";
import SideMenu from "@/components/SideMenu";
import "./App.css";

const App = () => {
  return (
    <Router>
      <SideMenu />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/calls/:callId" element={<Call />} />
        <Route path="/create-call" element={<CreateCall />} />
        <Route path="/create-web-call" element={<CreateWebCall />} />
        <Route path="/create-batch-call" element={<CreateBatchCall />} />
        <Route path="/calls" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
};

export default App;
