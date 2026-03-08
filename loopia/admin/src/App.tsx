import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Rooms from './pages/Rooms'
import LiveStatus from './pages/LiveStatus'
import Moderation from './pages/Moderation'
import Stats from './pages/Stats'
import Users from './pages/Users'
import UserProfile from './pages/UserProfile'
import QuestReview from './pages/QuestReview'

const globalStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background: #0f1117;
    color: #e2e8f0;
    min-height: 100vh;
  }
  input, select, textarea, button {
    font-family: inherit;
  }
`;

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!sessionStorage.getItem('admin_password')
  );

  if (!isAuthenticated) {
    return (
      <>
        <style>{globalStyles}</style>
        <Login onLogin={() => setIsAuthenticated(true)} />
      </>
    );
  }

  return (
    <>
      <style>{globalStyles}</style>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/rooms" replace />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="status" element={<LiveStatus />} />
            <Route path="moderation" element={<Moderation />} />
            <Route path="users" element={<Users />} />
            <Route path="users/:id" element={<UserProfile />} />
            <Route path="stats" element={<Stats />} />
            <Route path="quests" element={<QuestReview />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}
