// src/App.jsx
import { Outlet, Link } from 'react-router-dom';

function App() {
  return (
    <div>
      <header>
        <h1>TechFlow - Gestão de Preventivas</h1>
        <nav>
          {/* Links para navegar entre as páginas */}
          <Link to="/">Página Inicial</Link> | <Link to="/login">Login</Link>
        </nav>
      </header>
      <hr />
      <main>
        {/* O Outlet é o "espaço reservado" onde as outras páginas serão renderizadas */}
        <Outlet />
      </main>
    </div>
  )
}

export default App