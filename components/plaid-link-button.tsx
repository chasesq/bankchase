'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface PlaidLinkButtonProps {
  onSuccess?: (metadata: unknown) => void;
  onError?: (error: unknown) => void;
  phoneNumber?: string;
  connectUrl?: string;
}

export function PlaidLinkButton({ onSuccess, onError, connectUrl }: PlaidLinkButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const launchConnect = async () => {
    const url = connectUrl ?? process.env.NEXT_PUBLIC_MASTERCARD_CONNECT_URL;
    if (!url) {
      const error = new Error('Bank connection is not configured.');
      setMessage(error.message);
      onError?.(error);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const { Connect } = await import('connect-web-sdk');
      Connect.launch(
        url,
        {
          onDone: (event) => {
            setIsLoading(false);
            onSuccess?.(event);
          },
          onCancel: (event) => {
            setIsLoading(false);
            onError?.(event);
          },
          onError: (event) => {
            setIsLoading(false);
            setMessage('We could not connect this bank account. Please try again.');
            onError?.(event);
          },
          onLoad: () => setIsLoading(false),
        },
        { overlay: 'rgba(0, 0, 0, 0.65)' },
      );
    } catch (error) {
      setIsLoading(false);
      setMessage('We could not open bank connection. Please try again.');
      onError?.(error);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-semibold text-foreground">Pay by bank</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Securely connect your bank account with Mastercard Open Banking.
        </p>
        <Button
          type="button"
          onClick={launchConnect}
          disabled={isLoading}
          className="mt-4 w-full"
          size="lg"
        >
          {isLoading ? 'Opening secure connection…' : 'Connect'}
        </Button>
        {message ? <p className="mt-2 text-sm text-destructive">{message}</p> : null}
      </div>
    </div>
  );
}
