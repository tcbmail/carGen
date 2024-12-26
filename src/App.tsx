import React from 'react';
import { Toaster } from 'react-hot-toast';
import VehicleForm from './components/VehicleForm';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      <VehicleForm />
    </div>
  );
}

export default App;