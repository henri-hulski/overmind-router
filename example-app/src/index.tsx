import React from 'react'
import ReactDOM from 'react-dom/client'

import './styles.css'

import { createOvermind } from 'overmind'
import { Provider } from 'overmind-react'

import App from './components/App'
import { config } from './overmind'

const overmind = createOvermind(config, {
  devtools: true,
  strict: true,
})

ReactDOM.createRoot(window.document.getElementById('root')!).render(
  <Provider value={overmind}>
    <App />
  </Provider>
)
