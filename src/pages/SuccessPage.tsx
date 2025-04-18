import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom'; // Use react-router-dom hook

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id'); // Get session_id from URL query params

  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      // Construct the Supabase function URL
      // Assumes your Supabase project URL is in VITE_SUPABASE_URL env var
      // and the function name matches what we planned
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-stripe-session-details`;

      fetch(functionUrl, {
        method: 'POST',
        headers: {
           'Content-Type': 'application/json',
           // Include Authorization header if your function requires authentication
           // 'Authorization': `Bearer ${your_supabase_token}`
         },
        body: JSON.stringify({ session_id: sessionId }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Failed to parse error response' }));
            throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          setSessionData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Errore nel recupero della sessione Stripe:', err);
          setError(err.message || 'Si è verificato un errore durante il recupero dei dettagli della sessione.');
          setLoading(false);
        });
    } else {
      setError('ID sessione mancante nei parametri URL.');
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) return <div className="container mx-auto px-4 py-8 text-center"><p>Caricamento...</p></div>;
  if (error) return <div className="container mx-auto px-4 py-8 text-center text-red-600"><p>Errore: {error}</p></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4 text-center text-green-600">Pagamento completato con successo!</h1>
      <p className="text-lg mb-6 text-center">
        Grazie per il tuo acquisto, {sessionData?.customer_details?.email || 'cliente'}!
      </p>
      <div className="bg-gray-100 p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Dettagli Sessione:</h2>
        <pre className="text-sm overflow-auto">{JSON.stringify(sessionData, null, 2)}</pre>
      </div>
      {/* Aggiungi un link per tornare alla home page o al dashboard */}
      <div className="text-center mt-6">
        <a href="/" className="text-blue-600 hover:underline">Torna alla Home</a>
      </div>
    </div>
  );
}
