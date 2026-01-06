import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { v4 as uuidv4 } from 'uuid'
import getCroppedImg from '../utils/cropImage'
import { supabase } from '../supabaseClient'

export default function Creator() {
  const [imageSrc, setImageSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [gameLink, setGameLink] = useState(null)

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader()
      reader.addEventListener('load', () => setImageSrc(reader.result))
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const onCropComplete = useCallback((croppedArea, currentCroppedAreaPixels) => {
    setCroppedAreaPixels(currentCroppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!title) {
      alert('Husk at skrive en titel!')
      return
    }

    try {
      setUploading(true)
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      const fileName = `${uuidv4()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, croppedBlob)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName)

      const { data, error: dbError } = await supabase
        .from('games')
        .insert([{ title: title, image_path: publicUrl }])
        .select()

      if (dbError) throw dbError

      const newGameId = data[0].id
      const fullLink = `${window.location.origin}/game/${newGameId}`
      setGameLink(fullLink)

    } catch (error) {
      console.error('Fejl:', error)
      alert('Noget gik galt under upload!')
    } finally {
      setUploading(false)
    }
  }

  // SUCCES-SKÆRM (Link genereret)
  if (gameLink) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        padding: '20px', 
        textAlign: 'center' 
      }}>
        <h1 style={{ fontSize: '2rem' }}>🎉 Klar til deling!</h1>
        <p style={{ color: '#666' }}>Send linket til din modtager:</p>
        
        <div style={{ 
          background: '#f3f4f6', 
          padding: '15px', 
          borderRadius: '12px', 
          wordBreak: 'break-all', 
          margin: '20px 0',
          border: '1px solid #ddd',
          width: '100%'
        }}>
          <a href={gameLink} style={{ fontSize: '1.1rem', color: '#2563eb', fontWeight: 'bold' }}>{gameLink}</a>
        </div>

        <button 
          onClick={() => {
            navigator.clipboard.writeText(gameLink)
            alert('Link kopieret!')
          }}
          style={{ 
            width: '100%',
            padding: '18px', 
            background: '#1a1a1a', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '12px', 
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}
        >
          Kopier Link
        </button>
        
        <button 
          onClick={() => window.location.reload()} 
          style={{ marginTop: '30px', background: 'none', border: 'none', textDecoration: 'underline', color: '#666', cursor: 'pointer' }}
        >
          Lav et nyt spil
        </button>
      </div>
    )
  }

  // FORSIDE OG EDITOR (Centreret UX)
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      padding: '20px',
      textAlign: 'center',
      gap: '20px'
    }}>
      {!imageSrc ? (
        // VELKOMST SKÆRM
        <div style={{ width: '100%' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#1a1a1a' }}>
            RevealPhoto 📸
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '40px' }}>
            Tag et billede og lav det til et puslespil på få sekunder.
          </p>
          
          <label style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '20px 40px',
            borderRadius: '50px',
            fontSize: '1.3rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
            display: 'inline-block'
          }}>
            🚀 Start her
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              onChange={onSelectFile} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>
      ) : (
        // EDITOR SKÆRM
        <div style={{ width: '100%', maxWidth: '450px' }}>
          <h2 style={{ marginBottom: '20px' }}>Beskær dit billede</h2>
          
          <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', background: '#000', borderRadius: '15px', overflow: 'hidden' }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={3 / 4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          
          <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '12px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>1. Zoom ind/ud:</p>
              <input 
                type="range" 
                value={zoom} 
                min={1} 
                max={3} 
                step={0.1} 
                onChange={(e) => setZoom(e.target.value)} 
                style={{ width: '100%' }} 
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: '0 0 8px 5px', fontSize: '0.9rem', color: '#666' }}>2. Skriv en overskrift:</p>
              <input 
                type="text" 
                placeholder="F.eks. Gæt hvor jeg er?" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '18px', 
                  fontSize: '1.1rem', 
                  borderRadius: '12px', 
                  border: '1px solid #ddd',
                  outline: 'none'
                }}
              />
            </div>

            <button 
              onClick={handleSave}
              disabled={uploading}
              style={{
                backgroundColor: uploading ? '#9ca3af' : '#10b981', 
                color: 'white', 
                border: 'none', 
                padding: '20px', 
                borderRadius: '12px', 
                fontSize: '1.2rem', 
                fontWeight: 'bold',
                cursor: uploading ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
              }}
            >
              {uploading ? 'Uploader...' : 'Opret og send 🚀'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}