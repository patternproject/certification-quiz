// App.jsx
import { useState } from 'react'
import CertificationQuiz from './components/CertificationQuiz'
import CenteredLayout from './components/CenteredLayout'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
  return (
    <CenteredLayout>
      <ErrorBoundary>
        <CertificationQuiz />
      </ErrorBoundary>
    </CenteredLayout>
  )
}

export default App




