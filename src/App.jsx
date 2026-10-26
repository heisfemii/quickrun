import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Browse from './pages/Browse'
import PostTask from './pages/PostTask'
import TaskDetail from './pages/TaskDetail'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MyTasks from './pages/MyTasks'
import Payouts from './pages/Payouts'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/post" element={<PostTask />} />
        <Route path="/task/:id" element={<TaskDetail />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/my-tasks" element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
        <Route path="/payouts" element={<ProtectedRoute><Payouts /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
      <Footer />
    </>
  )
}
