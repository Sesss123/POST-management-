import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          backgroundColor: '#fff1f2', 
          color: '#be123c', 
          minHeight: '100vh', 
          fontFamily: 'system-ui, sans-serif' 
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '16px' }}>Application Crash Detected</h1>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #fecdd3', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error Message:</p>
            <pre style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', overflowX: 'auto', border: '1px solid #e2e8f0', color: '#1e293b' }}>
              {this.state.error?.toString()}
            </pre>
            
            <p style={{ fontWeight: 'bold', marginTop: '24px', marginBottom: '8px' }}>Stack Trace:</p>
            <pre style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', overflowX: 'auto', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px' }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              marginTop: '24px', 
              padding: '12px 24px', 
              backgroundColor: '#be123c', 
              color: 'white', 
              border: 'none', 
              borderRadius: '12px', 
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
