import { createRoot } from 'react-dom/client'
import './index.css'

const App = () => {
  return <h1 className="text-3xl font-bold">Hello from React</h1>
}

const container = document.getElementById('root')
if (!container) throw new Error('Root element not found')
const root = createRoot(container)
root.render(<App />)
