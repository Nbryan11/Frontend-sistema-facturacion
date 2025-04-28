import 'bootstrap/dist/css/bootstrap.min.css'; // <-- Añade esto en la primera línea
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import FacturacionApp from './FacturacionApp'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<FacturacionApp/>} />
      </Routes>
    </Router>
  )
}

export default App
