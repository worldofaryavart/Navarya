import Chat from '../components/Chat'

export default function Home() {
  return (
    <main className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-2xl font-semibold text-gray-800">Aarya Chat</h1>
      </header>
      <Chat />
    </main>
  )
}