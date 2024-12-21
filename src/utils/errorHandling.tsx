import React, { Component, ErrorInfo, useCallback } from "react";

// Error Boundary 컴포넌트
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export const useErrorHandler = () => {
  return useCallback((error: unknown) => {
    console.error("Caught error:", error);
    window.location.reload();
  }, []);
};

// Provider 컴포넌트
export const ErrorProvider = ({ children }: { children: React.ReactNode }) => {
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

// 에러 래퍼 함수 - try/catch를 간단히 처리하기 위한 유틸리티
export const withErrorHandling = async <T,>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    console.error(errorMessage || "An error occurred:", error);
    window.location.reload();
    throw error; // 타입 추론을 위해 필요
  }
};
