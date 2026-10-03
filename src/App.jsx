import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './core/context/CartContext';
import MenuPage from './pages/MenuPage';

const ReviewPage = lazy(() => import('./pages/ReviewPage'));
const CustomerPage = lazy(() => import('./pages/CustomerPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const TrackPage = lazy(() => import('./pages/TrackPage'));

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4">
      <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <Router>
      <CartProvider>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/customer" element={<CustomerPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/track" element={<TrackPage />} />
          </Routes>
        </Suspense>
      </CartProvider>
    </Router>
  );
}

export default App;


