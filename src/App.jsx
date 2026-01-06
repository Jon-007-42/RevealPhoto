import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Creator from './pages/Creator'
import Game from './pages/Game'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Forsiden: Hvor man uploader */}
        <Route path="/" element={<Creator />} />
        
        {/* Spil-siden: Hvor man lander med et ID (f.eks. /game/123) */}
        <Route path="/game/:id" element={<Game />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App