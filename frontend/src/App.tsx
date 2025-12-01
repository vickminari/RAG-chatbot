import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GuestRoute } from './components/GuestRoute';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomePage } from './pages/HomePage';
import { ChatPage } from './pages/ChatPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <GuestRoute>
                    <RegisterPage />
                  </GuestRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<HomePage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="chat/:id" element={<ChatPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
