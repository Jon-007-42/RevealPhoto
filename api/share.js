// api/share.js
import { createClient } from '@supabase/supabase-client';

export default async function handler(req, res) {
  const { id } = req.query;

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_KEY
  );

  // Hent spildata fra Supabase
  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !game) {
    return res.status(404).send('Spillet blev ikke fundet');
  }

  // Her laver vi en teaser-URL. 
  // Vi kan bruge Supabase's indbyggede resizer til at lave det lille og sløret
  const teaserImage = `${game.image_path}?width=200&quality=20&blur=50`;

  const html = `
    <!DOCTYPE html>
    <html lang="da">
    <head>
      <meta charset="UTF-8">
      <title>${game.title}</title>
      <meta property="og:title" content="${game.title}">
      <meta property="og:description" content="Nogen har sendt dig et RevealPhoto! Løs puslespillet for at se billedet.">
      <meta property="og:image" content="${teaserImage}">
      <meta property="og:type" content="website">
      <meta name="twitter:card" content="summary_large_image">
      <meta http-equiv="refresh" content="0;url=/game/${id}">
    </head>
    <body>
      Sender dig videre til spillet...
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}