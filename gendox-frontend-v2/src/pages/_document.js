import { Html, Head, Main, NextScript } from 'next/document'

// Sets <html data-theme> before the first paint: ?theme= → saved choice → OS setting
const themeScript = `(function () {
  try {
    var prefs = ['light', 'dark', 'system']
    var fromUrl = new URLSearchParams(location.search).get('theme')
    var saved = localStorage.getItem('gx-theme')
    var pref = prefs.indexOf(fromUrl) > -1 ? fromUrl : prefs.indexOf(saved) > -1 ? saved : 'system'
    var osLight = matchMedia('(prefers-color-scheme: light)').matches
    document.documentElement.dataset.theme = pref === 'system' ? (osLight ? 'light' : 'dark') : pref
  } catch (e) {
    document.documentElement.dataset.theme = 'dark'
  }
})()`

const CustomDocument = () => {
  return (
    <Html lang='en'>
      <Head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='' />
        <link
          rel='stylesheet'
          href='https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=JetBrains+Mono:wght@400;500&display=swap'
        />
        <link rel='icon' href='/images/logo.svg' type='image/svg+xml' />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

export default CustomDocument
