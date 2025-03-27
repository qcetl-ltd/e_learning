import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./login"; 
import SignUp from "./Registration"; 
import LoginDashboard from "./LoginDashboard"; 
import VerifyEmail from './VerifyEmail';  // Import the VerifyEmail component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/LoginDashboard" element={<LoginDashboard />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </Router>
  );
}

export default App;
