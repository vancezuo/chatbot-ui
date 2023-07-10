import TagManager from 'react-gtm-module';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';

import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';

import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

const tagManagerArgs = {
  gtmId: 'G-GJQBG1DD14',
};

function App({ Component, pageProps }: AppProps<{}>) {
  const queryClient = new QueryClient();

  TagManager.initialize(tagManagerArgs);

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
