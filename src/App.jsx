import React, { useState, useEffect } from 'react';
import './index.css';
import { shareGame } from './api/share';

const OpticPuzzle = () => {
  const [piecesPlaced, setPiecesPlaced] = useState(0);
  const totalPieces = 10; // Demo-antal
  const isWon = piecesPlaced >= totalPieces;

  // Dynamisk blur-effekt: starter på 20px og går til 0
  const currentBlur = Math.max(0, 20 - (piecesPlaced * 2));

  useEffect(() => {
    document.documentElement.style.setProperty('--blur-amount', `${currentBlur}px`);
  }, [piecesPlaced]);

  return (
    <div className="game-wrapper">
      <header className="p-4 text-center">
        <h1 className="text-xl font-bold">Stil skarpt på dit syn</h1>
        <p className="text-sm text-gray-600">Klik på billedet for at samle brikker (Demo)</p>
      </header>

      <main className="relative flex-1 flex items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=1000" 
          className="puzzle-image-layer"
          alt="Optik demo"
          onClick={() => !isWon && setPiecesPlaced(p => p + 1)}
        />
        
        <div className="absolute bottom-10 bg-white/80 p-2 rounded shadow text-xs">
          Brikker placeret: {piecesPlaced} / {totalPieces}
        </div>
      </main>

      {isWon && (
        <div className="winner-modal">
          <h2 className="text-2xl font-bold text-green-600">Knivskarpt!</h2>
          <p className="my-4">Du har vundet en gratis synstest og 20% på dit næste par briller.</p>
          <div className="bg-gray-100 p-3 rounded font-mono text-lg mb-4">KODE: OPTIK20</div>
          
          <button 
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold mb-2"
            onClick={() => window.open('https://google.com', '_blank')}
          >
            Book tid nu
          </button>
          
          <button 
            className="w-full bg-gray-200 py-3 rounded-lg font-bold"
            onClick={() => shareGame("Kan du se skarpt?", "Jeg fik lige 20% rabat hos optikeren via dette spil!")}
          >
            Del med en ven
          </button>
        </div>
      )}
    </div>
  );
};

export default OpticPuzzle;