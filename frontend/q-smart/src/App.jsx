import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./Pages/Home.jsx";
import Signin from "./Pages/Signin.jsx";
import Signup from "./Pages/Signup.jsx";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
