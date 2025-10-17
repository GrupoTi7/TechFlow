// src/App.jsx
import { Outlet, Link } from 'react-router-dom';

function App() {
  return (
    <div>
      <header>
        <h1>TechFlow - Gestão de Preventivas</h1>
        <nav>
          {/* ADICIONE O LINK "DISPOSITIVOS" AQUI */}
          <Link to="/">Página Inicial</Link> | <Link to="/devices">Dispositivos</Link> | <Link to="/login">Login</Link>
        </nav>
      </header>
      <hr />
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default App