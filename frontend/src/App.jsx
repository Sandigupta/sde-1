import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Navbar from './components/Navbar';
import DisasterMap from './components/DisasterMap';
import DisasterList from './components/DisasterList';
import DisasterDetails from './components/DisasterDetails';
import ReportForm from './components/ReportForm';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<DisasterMap />} />
          <Route path="/disasters" element={<DisasterList />} />
          <Route path="/disaster/:id" element={<DisasterDetails />} />
          <Route path="/report" element={<ReportForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
