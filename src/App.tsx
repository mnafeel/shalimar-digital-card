import { Routes, Route } from 'react-router-dom'
import DigitalCard from './pages/DigitalCard'
import AdminPage from './pages/AdminPage'
import SharePreviewPage from './pages/SharePreviewPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DigitalCard />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/share-preview" element={<SharePreviewPage />} />
    </Routes>
  )
}
