import dynamic from 'next/dynamic'
import Editor from '../components/Editor'

export default function Home() {
  return (
    <main className="min-h-screen p-6 bg-slate-50">
      <div className="container-fluid">
        <h1 className="text-2xl font-bold mb-4">Image Text Composer</h1>
      </div>
      <Editor />
    </main>
  )
}