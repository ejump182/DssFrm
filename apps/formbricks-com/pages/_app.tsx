import type { AppProps } from "next/app";
import PlausibleProvider from "next-plausible";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PlausibleProvider
      customDomain="https://plausible.formbricks.com"
      domain="formbricks.com"
      selfHosted={true}>
      <Component {...pageProps} />
    </PlausibleProvider>
  );
}
