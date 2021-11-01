import '../styles/globals.css';
import 'tailwindcss/tailwind.css';
import type { AppProps } from 'next/app';
import AppControlProvider from '../components/appControlHandler';
import AppOverlay from '../components/appOverlay';

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<AppControlProvider>
			<Component {...pageProps} />
		</AppControlProvider>
	);
}
export default MyApp;
