import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { v4 as uuidv4 } from 'uuid'
import getCroppedImg from '../utils/cropImage'
import { supabase } from '../supabaseClient'

export default function Creator() {
  const [step, setStep] = useState(1) // 1: Billede, 2: Detaljer
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
      reader.addEventListener('load', () => {
        setImageSrc(reader.result)
        setStep(1)
      })
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const onCropComplete = useCallback((croppedArea, currentCroppedAreaPixels) => {
    setCroppedAreaPixels(currentCroppedAreaPixels)
  }, [])

  const handleGoToDetails = () => setStep(2)

  const handleSave = async () => {
    if (!title) {
      alert('Husk lige en overskrift!')
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

      setGameLink(`${window.location.origin}/api/share?id=${data[0].id}`)
    } catch (error) {
      console.error(error)
      alert('Noget gik galt...')
    } finally {
      setUploading(false)
    }
  }

  // --- VIEW: SUCCES ---
  if (gameLink) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh', padding: '30px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Færdig! 🚀</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>Dit hemmelige link er klar til brug.</p>
        <div style={{ background: '#f0f0f0', padding: '20px', borderRadius: '20px', wordBreak: 'break-all', marginBottom: '30px', border: '2px solid #3b82f6' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{gameLink}</span>
        </div>
        <button onClick={() => { navigator.clipboard.writeText(gameLink); alert('Kopieret!'); }} style={{ padding: '20px', background: '#1a1a1a', color: 'white', borderRadius: '15px', border: 'none', fontSize: '1.2rem', fontWeight: 'bold' }}>Kopier Link</button>
        <button onClick={() => window.location.reload()} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#888', textDecoration: 'underline' }}>Lav et nyt</button>
      </div>
    )
  }

  // --- VIEW: TRIN 1 (BESKÆR 9:16) ---
  if (imageSrc && step === 1) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#000' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={9 / 16}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          minZoom={1} // Tvinger billedet til at fylde rammen (ingen tomme sider)
        />
        <div style={{ position: 'absolute', bottom: '40px', left: '0', right: '0', textAlign: 'center', zIndex: 10 }}>
          <button 
            onClick={handleGoToDetails}
            style={{ background: '#3b82f6', color: 'white', padding: '18px 45px', borderRadius: '50px', border: 'none', fontSize: '1.2rem', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}
          >
            Næste →
          </button>
          <br/>
          <button onClick={() => setImageSrc(null)} style={{ marginTop: '15px', background: 'none', border: 'none', color: 'white', opacity: 0.7 }}>Fortryd</button>
        </div>
      </div>
    )
  }

  // --- VIEW: TRIN 2 (DETALJER) ---
  if (imageSrc && step === 2) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh', padding: '30px' }}>
        <h2 style={{ marginBottom: '10px' }}>Sidste hånd... ✍️</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>Hvad skal modtageren se som overskrift?</p>
        <input 
          type="text" 
          placeholder="F.eks. Gæt hvor jeg er?" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', padding: '20px', fontSize: '1.2rem', borderRadius: '15px', border: '2px solid #ddd', outline: 'none', marginBottom: '20px' }}
        />
        <button 
          onClick={handleSave}
          disabled={uploading}
          style={{ padding: '20px', background: '#10b981', color: 'white', borderRadius: '15px', border: 'none', fontSize: '1.2rem', fontWeight: 'bold' }}
        >
          {uploading ? 'Opretter...' : 'Opret Spil 🚀'}
        </button>
        <button onClick={() => setStep(1)} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#888' }}>← Tilbage til billede</button>
      </div>
    )
  }

  // --- VIEW: FORSIDE ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '30px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '10px' }}>Reveal</h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '50px' }}>Skab og del hemmelige øjeblikke.</p>
      <label style={{ background: '#3b82f6', color: 'white', padding: '22px 45px', borderRadius: '50px', fontSize: '1.4rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 25px rgba(59,130,246,0.3)' }}>
        📸 Start nu
        <input type="file" accept="image/*" capture="environment" onChange={onSelectFile} style={{ display: 'none' }} />
      </label>
    </div>
  )
}