import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CookiesProvider } from 'react-cookie'
import RootProvider from '@/services/core/RootProvider.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/orange.css';
import App from '@/App';


createRoot(document.getElementById('root')).render(
  <CookiesProvider defaultSetOptions={{ path: '/' }}>
    <RootProvider>
      <BrowserRouter>
        <App/>
      </BrowserRouter>
    </RootProvider>
  </CookiesProvider>
);
