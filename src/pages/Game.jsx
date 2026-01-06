import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Game() {
  const { id } = useParams()
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pieces, setPieces] = useState([]) // Her gemmer vi rækkefølgen af brikkerne
  const [selectedPiece, setSelectedPiece] = useState(null) // Den brik man har klikket på
  const [isSolved, setIsSolved] = useState(false)

  useEffect(() => {
    async function fetchGame() {
      if (!id) return;
      const { data, error } = await supabase.from('games').select('*').eq('id', id).single()
      
      if (error) {
        console.error('Fejl:', error)
      } else {
        setGameData(data)
        // Opret 9 brikker (0-8) og bland dem
        const initialPieces = Array.from({ length: 9 }, (_, i) => i)
        shuffleArray(initialPieces)
        setPieces(initialPieces)
      }
      setLoading(false)
    }
    fetchGame()
  }, [id])

  // Hjælpefunktion til at blande brikkerne
  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
  }

  const handlePieceClick = (index) => {
    if (isSolved) return // Stop hvis spillet er vundet

    if (selectedPiece === null) {
      setSelectedPiece(index) // Vælg første brik
    } else {
      // Byt brikkerne plads
      const newPieces = [...pieces]
      const temp = newPieces[selectedPiece]
      newPieces[selectedPiece] = newPieces[index]
      newPieces[index] = temp
      
      setPieces(newPieces)
      setSelectedPiece(null) // Nulstil valg

      // Tjek om spillet er løst (0,1,2,3,4,5,6,7,8)
      if (newPieces.every((val, i) => val === i)) {
        setIsSolved(true)
      }
    }
  }

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Henter...</div>
  if (!gameData) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Ikke fundet 😕</div>

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
      <h2>{gameData.title}</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '2px', 
        width: '100%', 
        aspectRatio: '3/4', // Samme format som i Creator
        background: '#ccc',
        border: '2px solid #333'
      }}>
   {pieces.map((pieceValue, index) => {
  // Vi bruger 300% fordi det er et 3x3 grid. 
  // Vi tilføjer 0.5% ekstra (300.5) for at undgå mikroskopiske hvide kanter mellem brikkerne
  const backgroundSize = '300.5%'; 
  
  // Vi beregner positionen mere præcist:
  // Kolonne (x): 0 = venstre, 1 = midte, 2 = højre. Multipliceret med 50% for background-position.
  const col = pieceValue % 3;
  const row = Math.floor(pieceValue / 3);
  
  const posX = col * 50; // (0 * 50 = 0%), (1 * 50 = 50%), (2 * 50 = 100%)
  const posY = row * 50; // (0 * 50 = 0%), (1 * 50 = 50%), (2 * 50 = 100%)

  return (
    <div 
      key={index}
      onClick={() => handlePieceClick(index)}
      style={{
        backgroundImage: `url(${gameData.image_path})`,
        backgroundSize: backgroundSize,
        backgroundPosition: `${posX}% ${posY}%`,
        backgroundRepeat: 'no-repeat', // Vigtigt: undgå at billedet gentager sig i brikken
        cursor: 'pointer',
        border: selectedPiece === index ? '3px solid #3b82f6' : '1px solid rgba(255,255,255,0.2)',
        boxSizing: 'border-box', // Sikrer at bordren ikke skubber brikken
        transition: 'all 0.1s ease'
      }}
    />
  )
})}   </div>

      {isSolved && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#d1fae5', borderRadius: '10px' }}>
          <h3>🎉 Du klarede det!</h3>
          <p>Her er din Reveal-besked.</p>
          {/* Her kan vi senere indsætte en B2B rabatkode-knap */}
        </div>
      )}

      {!isSolved && <p style={{ marginTop: '20px' }}>Klik på to brikker for at bytte dem 🧩</p>}
    </div>
  )
}