import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AutReg from "./AutReg";
import Dashboard from "./Dashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AutReg />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
