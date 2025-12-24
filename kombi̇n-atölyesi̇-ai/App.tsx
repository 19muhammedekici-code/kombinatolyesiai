import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Studio from './pages/Studio';
import Wardrobe from './pages/Wardrobe';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Studio />} />
          <Route path="/wardrobe" element={<Wardrobe />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
