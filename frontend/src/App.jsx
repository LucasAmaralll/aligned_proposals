import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import { CompanyProvider } from './context/CompanyContext';
import PrivateRoute from './components/PrivateRoute';

// Public pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import PublicQuoteView from './pages/PublicQuoteView';

// Private pages
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import ClientDetail from './pages/ClientDetail';
import Quotes from './pages/Quotes';
import QuoteDetail from './pages/QuoteDetail';
import QuoteForm from './pages/QuoteForm';
import Profile from './pages/Profile';
import ProductPricing from './pages/ProductPricing';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import ProductDetail from './pages/ProductDetail';
import Stock from './pages/Stock';
import StockMovements from './pages/StockMovements';
import Sales from './pages/Sales';
import Pos from './pages/Pos';
import SaleDetail from './pages/SaleDetail';
import SaleReturn from './pages/SaleReturn';
import SaleExchange from './pages/SaleExchange';
import Expenses from './pages/Expenses';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CompanyProvider>
        <SidebarProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/view/:token" element={<PublicQuoteView />} />

            {/* Private routes - Dashboard */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            
            {/* Private routes - Clients */}
            <Route
              path="/clients"
              element={
                <PrivateRoute>
                  <Clients />
                </PrivateRoute>
              }
            />
            <Route
              path="/clients/new"
              element={
                <PrivateRoute>
                  <ClientForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/clients/:id/edit"
              element={
                <PrivateRoute>
                  <ClientForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/clients/:id"
              element={
                <PrivateRoute>
                  <ClientDetail />
                </PrivateRoute>
              }
            />
            
            {/* Private routes - Quotes */}
            <Route
              path="/quotes"
              element={
                <PrivateRoute>
                  <Quotes />
                </PrivateRoute>
              }
            />
            <Route
              path="/quotes/new"
              element={
                <PrivateRoute>
                  <QuoteForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/quotes/:id/edit"
              element={
                <PrivateRoute>
                  <QuoteForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/quotes/:id"
              element={
                <PrivateRoute>
                  <QuoteDetail />
                </PrivateRoute>
              }
            />
            
            {/* Private routes - Sales */}
            <Route
              path="/sales"
              element={
                <PrivateRoute>
                  <Sales />
                </PrivateRoute>
              }
            />
            <Route
              path="/sales/new"
              element={
                <PrivateRoute>
                  <Pos />
                </PrivateRoute>
              }
            />
            <Route
              path="/sales/:id/return"
              element={
                <PrivateRoute>
                  <SaleReturn />
                </PrivateRoute>
              }
            />
            <Route
              path="/sales/:id/exchange"
              element={
                <PrivateRoute>
                  <SaleExchange />
                </PrivateRoute>
              }
            />
            <Route
              path="/sales/:id"
              element={
                <PrivateRoute>
                  <SaleDetail />
                </PrivateRoute>
              }
            />

            {/* Private routes - Catalog */}
            <Route
              path="/products"
              element={
                <PrivateRoute>
                  <Products />
                </PrivateRoute>
              }
            />
            <Route
              path="/products/new"
              element={
                <PrivateRoute>
                  <ProductForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/products/:id"
              element={
                <PrivateRoute>
                  <ProductDetail />
                </PrivateRoute>
              }
            />

            {/* Private routes - Stock */}
            <Route
              path="/stock"
              element={
                <PrivateRoute>
                  <Stock />
                </PrivateRoute>
              }
            />
            <Route
              path="/stock/movements"
              element={
                <PrivateRoute>
                  <StockMovements />
                </PrivateRoute>
              }
            />

            {/* Private routes - Expenses */}
            <Route
              path="/expenses"
              element={
                <PrivateRoute>
                  <Expenses />
                </PrivateRoute>
              }
            />

            {/* Private routes - Pricing */}
            <Route
              path="/pricing"
              element={
                <PrivateRoute>
                  <ProductPricing />
                </PrivateRoute>
              }
            />
            <Route
              path="/pricing/:id"
              element={
                <PrivateRoute>
                  <ProductPricing />
                </PrivateRoute>
              }
            />
            
            {/* Private routes - Profile */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        </SidebarProvider>
        </CompanyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
