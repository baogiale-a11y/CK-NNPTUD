import AppRoutes from './routes/AppRoutes';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <div>
      <Navbar />
      <main className="container">
        <AppRoutes />
      </main>
    </div>
  );
}
