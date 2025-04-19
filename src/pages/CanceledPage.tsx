import React from 'react';
import { Link } from 'react-router-dom';
import SeoWrapper from '../components/SeoWrapper';

export default function CanceledPage() {
  return (
    <SeoWrapper
      title="Payment Canceled - DreamCasa AI"
      description="Your payment was not completed"
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
            <h1 className="text-3xl font-bold mb-6 text-custom">Pagamento Annullato</h1>
            <p className="text-xl mb-4">
              Il tuo pagamento è stato annullato o non è andato a buon fine.
            </p>
            <p className="text-xl mb-8">
              Non ti è stato addebitato alcun importo.
            </p>
            <div className="space-x-4">
              <Link 
                to="/#pricing" 
                className="inline-block px-6 py-3 bg-custom text-white rounded-button hover:bg-custom/90 transition"
              >
                Riprova il Pagamento
              </Link>
              <Link 
                to="/" 
                className="inline-block px-6 py-3 border border-custom text-custom rounded-button hover:bg-gray-50 transition"
              >
                Torna alla Home
              </Link>
            </div>
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
