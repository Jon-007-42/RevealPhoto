import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Creator from './pages/Creator'
import Game from './pages/Game'

function App() {
  return (
    <BrowserRouter>
      {/* Denne div fungerer som en mobil-ramme */}
      <div style={{ 
        maxWidth: '500px', 
        margin: '0 auto', 
        minHeight: '100vh', 
        backgroundColor: '#ffffff',
        boxShadow: '0 0 20px rgba(0,0,0,0.05)', // Giver en let skygge på PC
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Routes>
          <Route path="/" element={<Creator />} />
          <Route path="/game/:id" element={<Game />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App