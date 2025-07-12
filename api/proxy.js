// This is a Vercel Serverless Function that acts as a robust CORS proxy.
export default async function handler(request, response) {
  const { url } = request.query;

  if (!url) {
    return response.status(400).send('Error: The "url" query parameter is required.');
  }

  try {
    // --- THIS IS THE FIX ---
    // We add a standard browser User-Agent header to make our request look
    // like it's coming from a real browser, not a server.
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    const targetResponse = await fetch(url, {
      redirect: 'manual',
      headers: headers // Add the headers to the fetch request
    });
    // --- END OF FIX ---

    targetResponse.headers.forEach((value, name) => {
      if (name.toLowerCase() !== 'content-encoding') {
        response.setHeader(name, value);
      }
    });

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Access-Control-Expose-Headers', 'Location, Content-Disposition');
    
    response.status(targetResponse.status);

    const body = await targetResponse.blob();
    response.send(body);

  } catch (error) {
    console.error(error);
    response.status(500).send(`Server error: ${error.message}`);
  }
}
