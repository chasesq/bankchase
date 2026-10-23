'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface PlaidLinkButtonProps {
  onSuccess?: (metadata: unknown) => void;
  onError?: (error: unknown) => void;
  phoneNumber?: string;
}

export function PlaidLinkButton({ onSuccess, onError }: PlaidLinkButtonProps) {
  const handleClick = () => {
    try {
      onSuccess?.({ provider: 'quiltt', connectorId: 'vaia9lgjhd' });
    } catch (error) {
      onError?.(error);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-semibold text-foreground">Pay by bank</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Securely connect your bank account with Quiltt.
        </p>
        <Button
          type="button"
          quiltt-button="vaia9lgjhd"
          onClick={handleClick}
          className="mt-4 w-full"
          size="lg"
        >
          Connect
        </Button>
      </div>
    </div>
  );
}
