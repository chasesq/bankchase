'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';

// User-friendly error messages for common Plaid errors
const ERROR_MESSAGES: { [key: string]: string } = {
  'INVALID_CREDENTIALS': 'Incorrect username or password. Please double-check and try again.',
  'INVALID_MFA': 'Incorrect verification code. Please try again.',
  'INSTITUTION_ERROR': 'Your bank is temporarily unavailable. Try again in a few minutes.',
  'INSTITUTION_DOWN': 'Your bank is down for maintenance. Please try later.',
  'INSTITUTION_NOT_RESPONDING': 'Your bank is not responding. Please try again shortly.',
  'NO_ACCOUNTS': 'No eligible accounts found at this institution.',
  'ITEM_LOCKED': 'Your account is locked. Please unlock it with your bank first.',
};

function getErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] || 'Something went wrong. Please try again.';
}

interface PlaidLinkButtonProps {
  onSuccess?: (metadata: any) => void;
  onError?: (error: any) => void;
  phoneNumber?: string;
}

export function PlaidLinkButton({ onSuccess, onError, phoneNumber }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exchanging, setExchanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectedItems, setConnectedItems] = useState<any[]>([]);
  const [openWhenReady, setOpenWhenReady] = useState(false);

  // Step 1: Fetch link token on mount
  const fetchLinkToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStatus('idle');
    setLinkToken(null);

    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize bank connection.');
      }

      const token = data.linkToken || data.link_token;
      if (!token) throw new Error('Plaid did not return a link token.');
      setLinkToken(token);
    } catch (err: unknown) {
      console.error('[v0] Error fetching link token:', err);
      setLinkToken(null);
      setError(err instanceof Error ? err.message : 'Unable to initialize bank connection.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }, [phoneNumber]);

  // Step 2: Handle successful Link completion
  const handlePlaidSuccess = useCallback(async (publicToken: string, metadata: any) => {
    setExchanging(true);
    setError(null);
    setStatus('idle');

    try {
      const response = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicToken,
          metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Exchange failed');
      }

      const result = await response.json();
      
      setStatus('success');
      setConnectedItems((prev) => [
        ...prev,
        {
          institution: metadata.institution?.name || 'Bank',
          accounts: metadata.accounts || [],
        },
      ]);

      onSuccess?.(result);
    } catch (err: any) {
      console.error('[v0] Token exchange failed:', err);
      setError('Failed to connect your account. Please try again.');
      setStatus('error');
      onError?.(err);
    } finally {
      setExchanging(false);
    }
  }, [onSuccess, onError]);

  // Step 3: Handle user exit or error
  const handlePlaidExit = useCallback((exitError: any, metadata: any) => {
    if (!exitError) {
      // User simply closed Link — no error
      console.log('[v0] User exited Plaid Link');
      return;
    }

    console.warn('[v0] Plaid Link exit with error:', exitError, metadata);
    setStatus('error');
    setError(getErrorMessage(exitError.error_code));
    onError?.(exitError);
  }, [onError]);

  // Step 4: Log events for debugging/analytics
  const handlePlaidEvent = useCallback((eventName: string, metadata: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Plaid Event]', eventName, metadata);
    }
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess: handlePlaidSuccess,
    onExit: handlePlaidExit,
    onEvent: handlePlaidEvent,
  });

  useEffect(() => {
    void fetchLinkToken();
  }, [fetchLinkToken]);

  useEffect(() => {
    if (openWhenReady && linkToken && ready && !loading && !exchanging) {
      setOpenWhenReady(false);
      open();
    }
  }, [exchanging, linkToken, loading, open, openWhenReady, ready]);

  const openBankLink = useCallback(async () => {
    if (!linkToken) {
      setOpenWhenReady(true);
      await fetchLinkToken();
      return;
    }
    if (!ready) {
      setError('Bank connection is still initializing. Please try again in a moment.');
      setStatus('error');
      return;
    }
    open();
  }, [fetchLinkToken, linkToken, open, ready]);

  return (
    <div className="w-full space-y-4">
      {/* Error banner */}
      {status === 'error' && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <span className="text-sm text-red-800">{error}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void fetchLinkToken()}
              disabled={loading || exchanging}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Success banner */}
      {status === 'success' && connectedItems.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 border border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-800">
            Connected <strong>{connectedItems[connectedItems.length - 1].institution}</strong> successfully!
          </span>
        </div>
      )}

      {/* Pay-by-bank entry point */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-semibold text-foreground">Pay by bank</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Securely verify your bank account instantly. You can also choose manual verification if your bank is not listed.
        </p>
        <Button
          onClick={openBankLink}
          disabled={loading || exchanging}
          className="mt-4 w-full"
          size="lg"
          variant="default"
        >
          {(loading || exchanging) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Initializing...' : exchanging ? 'Connecting...' : 'Instantly verify your bank account'}
        </Button>
      </div>

      {/* List of connected institutions */}
      {connectedItems.length > 0 && (
        <div className="mt-6 space-y-3 border-t pt-6">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Connected Accounts
          </h3>
          {connectedItems.map((item, i) => (
            <div key={i} className="rounded-lg border border-border p-4 bg-background">
              <p className="font-semibold text-foreground">{item.institution}</p>
              <ul className="mt-2 space-y-1">
                  {item.accounts?.map((account: any, accountIndex: number) => (
                    <li
                      key={account.id || account.account_id || account.accountId || `${account.name}-${accountIndex}`}
                      className="text-sm text-muted-foreground"
                    >
                      <div className="flex justify-between gap-3">
                        <span>{account.name || account.official_name || 'Bank account'}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {account.subtype || account.type || 'account'} •••{account.mask || '----'}
                        </span>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
