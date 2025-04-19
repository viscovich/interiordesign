import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import SeoWrapper from '../components/SeoWrapper';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (sessionId) {
        try {
          const { data, error } = await supabase.functions.invoke('get-stripe-session-details', {
            body: { session_id: sessionId }
          });

          if (error) throw error;
          setEmail(data?.customer_details?.email || '');
        } catch (err) {
          console.error('Errore nel recupero della sessione Stripe:', err);
        }
      }
    };

    fetchSessionDetails();
  }, [sessionId]);

  return (
    <SeoWrapper
      title="Payment Successful - DreamCasa AI"
      description="Thank you for your purchase with DreamCasa AI"
    >
      <div className="flex flex-col min-h-screen">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <nav className="container max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center lg:ml-0 order-1 lg:order-none ml-16 lg:ml-0">
                <img 
                  src="/images/Dreamcasa3-removebg-preview.png" 
                  alt="DreamCasa AI Logo" 
                  className="h-8 w-auto cursor-pointer"
                />
                <span className="ml-2 text-xl font-semibold text-custom">DreamCasa AI</span>
              </div>
            </div>
          </nav>
        </header>

        <main className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-2xl px-4 py-12">
            <h1 className="text-3xl font-bold mb-6 text-custom">Pagamento completato con successo!</h1>
            <p className="text-xl mb-8">
              Grazie per il tuo acquisto, {email || 'cliente'}!
            </p>
            <a 
              href="/" 
              className="inline-block px-6 py-3 bg-custom text-white rounded-button hover:bg-custom/90 transition"
            >
              Torna alla Home
            </a>
          </div>
        </main>

        <footer className="bg-gray-900 text-white py-12 w-full">
          <div className="container max-w-8xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <img src="/images/Dreamcasa3-removebg-preview.png" alt="DreamCasa AI Logo" className="h-8 mb-4 brightness-0 invert" />
                <span className="text-white text-lg font-bold block mb-2">DreamCasa AI</span>
                <p className="text-gray-400">Transform your spaces with AI</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Product</h4>
                <ul className="space-y-2">
                  <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li>
                  <li><a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a></li>
                  <li><a href="#portfolio" className="text-gray-400 hover:text-white">Portfolio</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Support</h4>
                <ul className="space-y-2">
                  <li><a href="#faq" className="text-gray-400 hover:text-white">FAQ</a></li>
                  <li><a href="mailto:info@mg.dreamcasa.design" className="text-gray-400 hover:text-white">Contact</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
              <p>&copy; 2025 DreamCasa AI. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </SeoWrapper>
  );
}
