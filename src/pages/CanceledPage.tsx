import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation

export default function CanceledPage() {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-3xl font-bold mb-4 text-red-600">Pagamento Annullato</h1>
      <p className="text-lg mb-6">
        Il tuo pagamento è stato annullato o non è andato a buon fine. Non ti è stato addebitato alcun importo.
      </p>
      <p className="mb-6">
        Se pensi si tratti di un errore, per favore riprova o contatta il supporto.
      </p>
      <div className="space-x-4">
        <Link to="/#pricing" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition duration-300">
          Riprova il Pagamento
        </Link>
        <Link to="/" className="text-blue-600 hover:underline">
          Torna alla Home
        </Link>
      </div>
    </div>
  );
}
