import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id'); // Get session_id from URL query params

  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (sessionId) {
        try {
          const { data, error } = await supabase.functions.invoke('get-stripe-session-details', {
            body: { session_id: sessionId }
          });

          if (error) throw error;
          
          setSessionData(data);
          setLoading(false);
        } catch (err) {
          console.error('Errore nel recupero della sessione Stripe:', err);
          setError(err instanceof Error ? err.message : 'Si è verificato un errore durante il recupero dei dettagli della sessione.');
          setLoading(false);
        }
      } else {
        setError('ID sessione mancante nei parametri URL.');
        setLoading(false);
      }
    };

    fetchSessionDetails();
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
