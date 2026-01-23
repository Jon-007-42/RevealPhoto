// Brug dynamisk import for at undgå CommonJS/ESM konflikter
const { createClient } = require('@supabase/supabase-client');

module.exports = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).send('Manglende spil-ID');
    }

    // Hent variablerne - tjekker både med og uden VITE_
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase variabler mangler i Vercel');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !game) {
      return res.status(404).send('Spillet blev ikke fundet.');
    }

    const teaserImage = `${game.image_path}?width=200&quality=15`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${game.title}</title>
        <meta property="og:title" content="${game.title}">
        <meta property="og:image" content="${teaserImage}">
        <meta property="og:description" content="Løs puslespillet for at se billedet!">
        <meta http-equiv="refresh" content="0;url=/game/${id}">
      </head>
      <body>Viderestiller...</body>
      </html>
    `);
  } catch (err) {
    console.error('SERVER FEJL:', err.message);
    return res.status(500).json({ error: err.message });
  }
};