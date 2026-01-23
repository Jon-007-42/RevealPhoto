import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Game() {
  const { id } = useParams()
  const [gameData, setGameData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pieces, setPieces] = useState([])
  const [selectedPiece, setSelectedPiece] = useState(null)
  const [isSolved, setIsSolved] = useState(false)

  useEffect(() => {
    async function fetchGame() {
      if (!id) return;
      const { data, error } = await supabase.from('games').select('*').eq('id', id).single()
      if (error) {
        console.error('Fejl:', error)
      } else {
        setGameData(data)
        const initialPieces = Array.from({ length: 9 }, (_, i) => i)
        // Bland brikkerne
        for (let i = initialPieces.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [initialPieces[i], initialPieces[j]] = [initialPieces[j], initialPieces[i]]
        }
        setPieces(initialPieces)
      }
      setLoading(false)
    }
    fetchGame()
  }, [id])

  const handlePieceClick = (index) => {
    if (isSolved) return
    if (selectedPiece === null) {
      setSelectedPiece(index)
    } else {
      const newPieces = [...pieces]
      const temp = newPieces[selectedPiece]
      newPieces[selectedPiece] = newPieces[index]
      newPieces[index] = temp
      setPieces(newPieces)
      setSelectedPiece(null)
      if (newPieces.every((val, i) => val === i)) {
        setIsSolved(true)
      }
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Henter...</div>

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#000', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'fixed' // Låser skærmen så man ikke kan scrolle ved en fejl
    }}>
      {/* Fase 1 & 2: Puslespillet i 9:16 format */}
      <div style={{ 
        flex: 1, 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gridTemplateRows: 'repeat(3, 1fr)', 
        gap: isSolved ? '0px' : '1px', // Fjerner streger når løst
        width: '100%',
        height: '100%',
        transition: 'gap 0.5s ease'
      }}>
        {pieces.map((pieceValue, index) => {
          const col = pieceValue % 3;
          const row = Math.floor(pieceValue / 3);
          return (
            <div 
              key={index}
              onClick={() => handlePieceClick(index)}
              style={{
                backgroundImage: `url(${gameData.image_path})`,
                backgroundSize: '300.5% 300.5%',
                backgroundPosition: `${col * 50}% ${row * 50}%`,
                border: selectedPiece === index ? '4px solid #3b82f6' : 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          )
        })}
      </div>

      {/* Fase 3: Reveal & CTA (Dukker op fra bunden når løst) */}
      {isSolved && (
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          width: '100%', 
          backgroundColor: 'rgba(255,255,255,0.95)', 
          padding: '30px 20px',
          borderTopLeftRadius: '25px',
          borderTopRightRadius: '25px',
          textAlign: 'center',
          animation: 'slideUp 0.5s ease-out'
        }}>
          <h2 style={{ margin: '0 0 10px 0' }}>{gameData.title}</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>Du har låst beskeden op! 🎉</p>
          <button style={{ 
            width: '100%', 
            padding: '18px', 
            backgroundColor: '#10b981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '15px', 
            fontSize: '1.2rem', 
            fontWeight: 'bold' 
          }}>
            Hent din bonus her 🎁
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}