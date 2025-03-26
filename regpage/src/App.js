import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./login"; 
import SignUp from "./Registration"; 
import LoginDashboard from "./LoginDashboard"; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/LoginDashboard" element={<LoginDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
