import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).send('Manglende spil-ID');
    }

    // Vi henter variablerne fra dine Vercel Settings
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).send('Database-nøgler mangler i Vercel Settings');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !game) {
      return res.status(404).send('Puslespillet blev ikke fundet i databasen.');
    }

    // Teaser-billede (Supabase resizer laver det sløret/lav kvalitet her)
    const teaserImage = `${game.image_path}?width=200&quality=15`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="da">
      <head>
        <meta charset="UTF-8">
        <title>${game.title}</title>
        <meta property="og:title" content="${game.title}">
        <meta property="og:image" content="${teaserImage}">
        <meta property="og:description" content="Løs puslespillet for at se billedet!">
        <meta property="og:type" content="website">
        <meta name="twitter:card" content="summary_large_image">
        <meta http-equiv="refresh" content="0.5;url=/game/${id}">
      </head>
      <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f9f9f9;">
        <p>Henter dit puslespil...</p>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('SERVER FEJL:', err.message);
    return res.status(500).json({ error: err.message });
  }
}