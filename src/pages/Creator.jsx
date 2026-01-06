import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { v4 as uuidv4 } from 'uuid' // Vi bruger denne til at lave unikke filnavne
import getCroppedImg from '../utils/cropImage'
import { supabase } from '../supabaseClient' // Vores forbindelse til databasen

export default function Creator() {
  const [imageSrc, setImageSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  
  // Nye variabler til titel og status
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
      setUploading(true) // Tænd for "vent venligst"
      
      // 1. Skær billedet til
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      
      // 2. Lav et unikt filnavn (f.eks. "8273-2819.jpg")
      const fileName = `${uuidv4()}.jpg`

      // 3. Upload billedet til Supabase "images" bucket
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, croppedBlob)

      if (uploadError) throw uploadError

      // 4. Få den offentlige URL til billedet
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName)

      // 5. Gem spillet i databasen
      const { data, error: dbError } = await supabase
        .from('games')
        .insert([{ title: title, image_path: publicUrl }])
        .select()

      if (dbError) throw dbError

      // 6. Succes! Lav linket
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

  // HVIS VI HAR ET LINK (Succes-skærm)
  if (gameLink) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h1>🎉 Puslespillet er klar!</h1>
        <p>Send dette link til din ven/kunde:</p>
        
        <div style={{ background: '#eee', padding: '15px', borderRadius: '8px', wordBreak: 'break-all', margin: '20px 0' }}>
          <a href={gameLink} style={{ fontSize: '18px', color: '#2563eb' }}>{gameLink}</a>
        </div>

        <button 
          onClick={() => {
            navigator.clipboard.writeText(gameLink)
            alert('Link kopieret!')
          }}
          style={{ padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer'}}
        >
          Kopier Link
        </button>
        
        <br/><br/>
        <button onClick={() => window.location.reload()} style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>
          Lav et nyt spil
        </button>
      </div>
    )
  }

  // EDITOR SKÆRM
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
      <h1>Opret Puslespil 📸</h1>
      
      {!imageSrc ? (
        <div style={{ marginTop: '40px' }}>
          <label style={{ backgroundColor: '#3b82f6', color: 'white', padding: '15px 30px', borderRadius: '8px', fontSize: '18px', cursor: 'pointer' }}>
            Vælg Billede
            <input type="file" accept="image/*" onChange={onSelectFile} style={{ display: 'none' }} />
          </label>
        </div>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <div style={{ position: 'relative', width: '100%', height: '400px', background: '#333' }}>
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
          
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <p style={{marginBottom: '5px'}}>1. Zoom billedet:</p>
              <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} style={{ width: '80%' }} />
            </div>

            <div>
              <p style={{marginBottom: '5px'}}>2. Skriv en titel:</p>
              <input 
                type="text" 
                placeholder="F.eks. Tillykke Ole!" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ padding: '10px', width: '80%', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
              />
            </div>

            <button 
              style={{
                backgroundColor: uploading ? '#9ca3af' : '#10b981', 
                color: 'white', border: 'none', padding: '15px', borderRadius: '5px', fontSize: '18px', cursor: uploading ? 'wait' : 'pointer'
              }}
              onClick={handleSave}
              disabled={uploading}
            >
              {uploading ? 'Uploader...' : '🚀 Opret Spil'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}