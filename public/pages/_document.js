import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="it">
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0b1329" />
        {/* Rende l'app a schermo intero su iPhone eliminando la barra Safari */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AcademyPro" />
        <link rel="apple-touch-icon" href="https://img.icons8.com/color/192/skiing.png" />
      </Head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#090e1a', color: '#fff' }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
