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
      alert('Giv lige dit puslespil en overskrift!')
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
      setGameLink(`${window.location.origin}/game/${newGameId}`)

    } catch (error) {
      console.error('Fejl:', error)
      alert('Upload fejlede desværre.')
    } finally {
      setUploading(false)
    }
  }

  // SUCCES-SKÆRM
  if (gameLink) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.2rem' }}>🎁 Klar!</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>Send linket til din modtager:</p>
        <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '15px', wordBreak: 'break-all', marginBottom: '20px', width: '100%', border: '2px dashed #3b82f6' }}>
          <a href={gameLink} style={{ fontSize: '1.1rem', color: '#2563eb', fontWeight: 'bold', textDecoration: 'none' }}>{gameLink}</a>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(gameLink); alert('Link kopieret!'); }} style={{ width: '100%', padding: '20px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '15px', fontSize: '1.2rem', fontWeight: 'bold' }}>Kopier Link 📋</button>
        <button onClick={() => window.location.reload()} style={{ marginTop: '30px', background: 'none', border: 'none', textDecoration: 'underline', color: '#666' }}>Lav et nyt</button>
      </div>
    )
  }

  // FORSIDE / EDITOR
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px', textAlign: 'center' }}>
      {!imageSrc ? (
        <div style={{ width: '100%' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '10px', fontWeight: '900' }}>Reveal</h1>
          <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '40px' }}>Skab et magisk øjeblik.</p>
          <label style={{ backgroundColor: '#3b82f6', color: 'white', padding: '20px 40px', borderRadius: '50px', fontSize: '1.4rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)', display: 'inline-block' }}>
            📸 Tag Billede
            <input type="file" accept="image/*" capture="environment" onChange={onSelectFile} style={{ display: 'none' }} />
          </label>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', height: '90vh' }}>
          <h2 style={{ marginBottom: '10px' }}>Tilpas billedet</h2>
          <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px' }}>Brug to fingre til at zoome</p>
          
          <div style={{ position: 'relative', flex: 1, width: '100%', background: '#000', borderRadius: '20px', overflow: 'hidden' }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={3 / 4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              minZoom={0.5} // Tillader at zoome længere ud
              objectFit="contain" // Sikrer at hele billedet kan ses
            />
          </div>
          
          <div style={{ marginTop: '20px', width: '100%' }}>
            <input 
              type="text" 
              placeholder="Skriv en hilsen..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '18px', fontSize: '1.1rem', borderRadius: '15px', border: '2px solid #eee', outline: 'none', marginBottom: '15px' }}
            />
            <button 
              onClick={handleSave}
              disabled={uploading}
              style={{ width: '100%', backgroundColor: uploading ? '#ccc' : '#10b981', color: 'white', border: 'none', padding: '20px', borderRadius: '15px', fontSize: '1.3rem', fontWeight: 'bold' }}
            >
              {uploading ? 'Uploader...' : 'Færdig 🚀'}
            </button>
            <button onClick={() => setImageSrc(null)} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#ff4444', fontSize: '0.9rem' }}>Annuller</button>
          </div>
        </div>
      )}
    </div>
  )
}