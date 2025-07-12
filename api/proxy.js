// This is a Vercel Serverless Function.
// It takes an incoming request and is expected to send a response.
export default async function handler(request, response) {
  // Get the target URL from the query parameters.
  // e.g., if the request is /api/proxy?url=https://example.com, this will be "https://example.com"
  const { url } = request.query;

  // If no URL is provided, send a "Bad Request" error.
  if (!url) {
    return response.status(400).send('Error: The "url" query parameter is required.');
  }

  try {
    // Fetch the content from the target URL provided by the client.
    // We add a User-Agent to look more like a real browser.
    const targetResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Check if the fetch was successful.
    if (!targetResponse.ok) {
      // If not, forward the error status and text from the target.
      const errorText = await targetResponse.text();
      return response.status(targetResponse.status).send(errorText);
    }

    // Get the HTML content as a string.
    const htmlContent = await targetResponse.text();

    // --- This is the most important part for CORS ---
    // Set headers to allow any origin to access this response.
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // ------------------------------------------------

    // Send the fetched HTML content back to our app with a 200 OK status.
    response.status(200).send(htmlContent);

  } catch (error) {
    // If any other error occurs (e.g., network issue), send a "Server Error" response.
    console.error(error);
    response.status(500).send(`Server error: ${error.message}`);
  }
}
