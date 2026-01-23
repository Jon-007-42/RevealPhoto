const { createClient } = require('@supabase/supabase-client');

module.exports = async (req, res) => {
  const { id } = req.query;

  // Tjek om ID findes
  if (!id) {
    return res.status(400).send('Manglende ID');
  }

  // Brug de variabler du indtastede i Vercel (image_6d3ca4.png)
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_KEY
  );

  try {
    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !game) {
      return res.status(404).send('Puslespillet blev ikke fundet i databasen');
    }

    // Vi laver en teaser ved at sætte kvaliteten helt ned (sikker backup hvis blur ikke er aktivt)
    const teaserImage = `${game.image_path}?width=100&quality=10`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${game.title}</title>
        <meta property="og:title" content="${game.title}">
        <meta property="og:description" content="Nogen har sendt dig en hemmelig hilsen! Løs puslespillet for at se billedet.">
        <meta property="og:image" content="${teaserImage}">
        <meta property="og:type" content="website">
        <meta name="twitter:card" content="summary_large_image">
        <meta http-equiv="refresh" content="0.5;url=/game/${id}">
      </head>
      <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
        <p>Henter dit puslespil...</p>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (err) {
    return res.status(500).send('Systemfejl: ' + err.message);
  }
};