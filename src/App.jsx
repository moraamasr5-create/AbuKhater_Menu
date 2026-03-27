import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import MenuPage from './pages/MenuPage';
import ReviewPage from './pages/ReviewPage';
import CustomerPage from './pages/CustomerPage';
import PaymentPage from './pages/PaymentPage';

function App() {
  return (
    <Router>
      <CartProvider>
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/customer" element={<CustomerPage />} />
          <Route path="/payment" element={<PaymentPage />} />
        </Routes>
      </CartProvider>
    </Router>
  );
}

export default App;
