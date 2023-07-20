import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useEffect, useState } from 'react';
import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';

import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

function App({ Component, pageProps }: AppProps<{}>) {
  const queryClient = new QueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      let auth = sessionStorage.getItem("auth");

      if (auth === "true") {
        setIsAuthenticated(true);
        return;
      }

      while (auth !== "true") {
        let pass = prompt("Enter password");

        if (pass === null) { // User clicked cancel
          setIsAuthenticated(false);
          return;
        }
        else if (pass === process.env.NEXT_PUBLIC_PASSWORD) {
          sessionStorage.setItem("auth", "true");
          auth = sessionStorage.getItem("auth");
        } else {
          alert("Wrong password");
        }
      }

      setIsAuthenticated(true);
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Loading state
  }

  if (!isAuthenticated) {
    return <div>Access denied</div>; // If authentication failed
  }

  // If authentication passed
  return (
    <div className={inter.className}>
      <Toaster />
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </div>
  );
}

export default appWithTranslation(App);
