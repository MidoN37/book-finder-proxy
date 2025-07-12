// This is a Vercel Serverless Function that acts as a robust CORS proxy.
export default async function handler(request, response) {
  // Get the target URL from the query parameters.
  const { url } = request.query;

  if (!url) {
    return response.status(400).send('Error: The "url" query parameter is required.');
  }

  try {
    // --- KEY CHANGE 1: DO NOT FOLLOW REDIRECTS AUTOMATICALLY ---
    // We set `redirect: 'manual'` so that if the target URL gives us
    // a redirect (like a 307), we can capture it instead of following it.
    // This is essential for our download-link-finding process.
    const targetResponse = await fetch(url, {
      redirect: 'manual'
    });

    // --- KEY CHANGE 2: FORWARD ALL HEADERS FROM THE TARGET ---
    // This ensures that important headers like 'Content-Disposition' (for downloads)
    // and 'Location' (for redirects) are passed back to our app.
    targetResponse.headers.forEach((value, name) => {
      // Note: We avoid setting 'content-encoding' as Vercel handles compression.
      if (name.toLowerCase() !== 'content-encoding') {
        response.setHeader(name, value);
      }
    });

    // --- THIS IS THE MOST IMPORTANT PART FOR CORS ---
    // We add our required CORS headers to the headers we are forwarding.
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // We must also expose headers so the client can read them, especially 'Location'.
    response.setHeader('Access-Control-Expose-Headers', 'Location, Content-Disposition');


    // --- KEY CHANGE 3: FORWARD THE ORIGINAL STATUS CODE ---
    // This passes the original status (e.g., 200 for OK, 307 for Redirect) to our app.
    response.status(targetResponse.status);

    // --- KEY CHANGE 4: FORWARD THE BODY AS-IS (BINARY SAFE) ---
    // We read the response as a blob, which handles any content type
    // (HTML, JSON, images, EPUB files, etc.) without corrupting it.
    // We then send this blob back to our app.
    const body = await targetResponse.blob();
    response.send(body);

  } catch (error) {
    // If any other error occurs, send a "Server Error" response.
    console.error(error);
    response.status(500).send(`Server error: ${error.message}`);
  }
}
