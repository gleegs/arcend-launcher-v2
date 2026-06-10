import { createRoot } from 'react-dom/client'
import './index.css'
import Sidebar from './app/components/Sidebar/Sidebar'
import { useArcStore } from './app/store/arc'

const App = () => {
  const selectedArc = useArcStore((s) => s.selectedArc)

  return (
    <div className=" rounded-3xl bg-surface w-full h-full flex p-4 gap-4">
      <Sidebar />
      <div className="flex-1 rounded-2xl overflow-hidden">
        {selectedArc ? (
          <img
            src={selectedArc.coverImage ?? 'https://placehold.co/600x400?text=Image+Not+Found'}
            alt={selectedArc.name ?? ''}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-white/5" />
        )}
      </div>
    </div>
  )
}

const container = document.getElementById('root')
if (!container) throw new Error('Root element not found')
const root = createRoot(container)
root.render(<App />)
