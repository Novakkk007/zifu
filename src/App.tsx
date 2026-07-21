import { Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Hecan from '@/pages/Hecan'
import Bazi from '@/pages/Bazi'
import Hepan from '@/pages/bazi/Hepan'
import Liuyao from '@/pages/Liuyao'
import Ziwei from '@/pages/Ziwei'
import Qizheng from '@/pages/Qizheng'
import Qimen from '@/pages/Qimen'
import Daliuren from '@/pages/Daliuren'
import Daily from '@/pages/Daily'
import Toolkit from '@/pages/Toolkit'
import Wiki from '@/pages/Wiki'
import Talks from '@/pages/Talks'
import Terms from '@/pages/Terms'
import Auth from '@/pages/Auth'
import NotFound from '@/pages/NotFound'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hecan" element={<Hecan />} />
        <Route path="/bazi" element={<Bazi />} />
        <Route path="/bazi/hepan" element={<Hepan />} />
        <Route path="/liuyao" element={<Liuyao />} />
        <Route path="/ziwei" element={<Ziwei />} />
        <Route path="/qizheng" element={<Qizheng />} />
        <Route path="/qimen" element={<Qimen />} />
        <Route path="/daliuren" element={<Daliuren />} />
        <Route path="/daily" element={<Daily />} />
        <Route path="/toolkit" element={<Toolkit />} />
        <Route path="/wiki" element={<Wiki />} />
        <Route path="/talks" element={<Talks />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
