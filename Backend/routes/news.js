import express from 'express';

const router = express.Router();

const GNEWS_API_KEY = process.env.GNEWS_API_KEY || "db02a2c17e9f44536f62faad948deb62";
const GNEWS_ENDPOINT = "https://gnews.io/api/v4/search";

// Proxy endpoint for GNews API
router.get('/search', async (req, res) => {
  try {
    const { q, lang, country, max, sortby, from, to } = req.query;

    if (!q) {
      return res.status(400).json({ 
        success: false, 
        error: 'Search query is required' 
      });
    }

    const params = new URLSearchParams({
      q: q.toString(),
      apikey: GNEWS_API_KEY,
      lang: lang?.toString() || 'en',
      country: country?.toString() || 'in',
      max: max?.toString() || '10',
      sortby: sortby?.toString() || 'publishedAt',
    });

    if (from) params.append('from', from.toString());
    if (to) params.append('to', to.toString());

    const response = await fetch(`${GNEWS_ENDPOINT}?${params.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GNews API Error:', response.status, errorText);
      return res.status(response.status).json({ 
        success: false, 
        error: `GNews API error: ${response.statusText}` 
      });
    }

    const data = await response.json();
    
    res.json({
      success: true, 
      data: {
        totalArticles: data.totalArticles || 0,
        articles: data.articles || []
      }
    });
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch news articles' 
    });
  }
});

export default router;
