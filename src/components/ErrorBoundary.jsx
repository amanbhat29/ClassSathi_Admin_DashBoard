import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to console so monitoring tools can pick it up
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null, errorInfo: null }, () => {
      window.location.reload();
    });
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const isDev = process.env.NODE_ENV !== 'production';

      return (
        <div style={styles.overlay}>
          <div style={styles.card}>
            {/* Red error icon */}
            <div style={styles.iconWrapper}>
              <svg
                style={styles.icon}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="11" stroke="#e53e3e" strokeWidth="2" fill="#fff5f5" />
                <line x1="12" y1="7" x2="12" y2="13" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="17" r="1.2" fill="#e53e3e" />
              </svg>
            </div>

            {/* Title */}
            <h1 style={styles.title}>Something went wrong</h1>

            {/* Error message */}
            <p style={styles.message}>
              {error ? error.toString() : 'An unexpected error occurred.'}
            </p>

            {/* Action buttons */}
            <div style={styles.buttonGroup}>
              <button style={styles.tryAgainButton} onClick={this.handleTryAgain}>
                Try Again
              </button>
              <button style={styles.goBackButton} onClick={this.handleGoBack}>
                Go Back
              </button>
            </div>

            {/* Dev-mode stack trace */}
            {isDev && errorInfo && errorInfo.componentStack && (
              <div style={styles.stackContainer}>
                <p style={styles.stackLabel}>Component Stack Trace:</p>
                <pre style={styles.stackPre}>
                  <code style={styles.stackCode}>
                    {errorInfo.componentStack}
                  </code>
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  overlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
    boxSizing: 'border-box',
    backgroundColor: '#fafafa',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  card: {
    maxWidth: '600px',
    width: '100%',
    padding: '40px',
    borderRadius: '16px',
    backgroundColor: '#fff5f5',
    border: '1px solid #feb2b2',
    textAlign: 'center',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
  },
  iconWrapper: {
    marginBottom: '20px',
  },
  icon: {
    width: '56px',
    height: '56px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#c53030',
    margin: '0 0 12px 0',
  },
  message: {
    fontSize: '15px',
    color: '#742a2a',
    lineHeight: '1.6',
    margin: '0 0 28px 0',
    wordBreak: 'break-word',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  tryAgainButton: {
    padding: '10px 28px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#e53e3e',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  goBackButton: {
    padding: '10px 28px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#e53e3e',
    backgroundColor: '#ffffff',
    border: '1px solid #e53e3e',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  stackContainer: {
    marginTop: '28px',
    textAlign: 'left',
  },
  stackLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#718096',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  stackPre: {
    backgroundColor: '#edf2f7',
    padding: '16px',
    borderRadius: '8px',
    overflow: 'auto',
    maxHeight: '240px',
    margin: '0',
    border: '1px solid #e2e8f0',
  },
  stackCode: {
    fontSize: '12px',
    lineHeight: '1.5',
    color: '#2d3748',
    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};

export default ErrorBoundary;
