import * as React from 'react'
import { toast } from 'sonner'
import type { Toast } from '#app/types/toast'

interface ToastErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

class ToastErrorBoundary extends React.Component<
  ToastErrorBoundaryProps,
  { hasError: boolean }
> {
  constructor(props: ToastErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Toast error:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function useToast(toastMessage?: Toast | null) {
  React.useEffect(() => {
    if (!toastMessage) return;
    
    try {
      const { type, title, id, description } = toastMessage;
      const options = {
        id,
        description,
        onDismiss: () => {
          console.debug('Toast dismissed:', id);
        },
      };

      switch (type) {
        case 'success':
          toast.success(title ?? description, options);
          break;
        case 'error':
          toast.error(title ?? description, options);
          break;
        case 'message':
          toast(title ?? description, options);
          break;
      }
    } catch (error) {
      console.error('Error showing toast:', error);
    }
  }, [toastMessage]);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastErrorBoundary
      fallback={<div className="hidden">Toast error boundary</div>}
    >
      {children}
    </ToastErrorBoundary>
  );
}
