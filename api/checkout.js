const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ALLOWED_PRICE_IDS = [
  'price_1T4QrwPnhmITZHrYOTUF1PPL', // La vie en couleur
  'price_1T4QsKPnhmITZHrYtmVRJjte', // Et même après
  'price_1UDkorPnhmITZHrYNPIjBxSD', // Tout ce que l'amour n'est pas
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://alexandranine.fr');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Panier vide' });
    }

    for (const item of items) {
      if (!ALLOWED_PRICE_IDS.includes(item.price)) {
        return res.status(400).json({ error: 'Produit non autorisé' });
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price: item.price,
        quantity: item.quantity || 1,
      })),
      mode: 'payment',
      success_url: 'https://alexandranine.fr?commande=ok',
      cancel_url: 'https://alexandranine.fr?commande=annulee',
      shipping_address_collection: {
        allowed_countries: ['FR', 'BE', 'LU'],
      },
      shipping_options: [
        { shipping_rate: 'shr_1UDnMgPnhmITZHrYo2xdw83g' },
      ],
      custom_fields: [
        {
          key: 'dedicace',
          label: { type: 'custom', custom: 'Prénom pour la dédicace (optionnel)' },
          type: 'text',
          optional: true,
        },
      ],
      locale: 'fr',
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la création de la session' });
  }
};
