'use client'

import React from 'react'

/**
 * Page Loading Manager
 * Handles smooth page transitions and loading states
 */

export interface LoadingState {
  isLoading: boolean
  error: string | null
  progress: number
}

class PageLoadingManager {
  private static instance: PageLoadingManager
  private listeners: Set<(state: LoadingState) => void> = new Set()
  private state: LoadingState = {
    isLoading: false,
    error: null,
    progress: 0,
  }

  private constructor() {}

  static getInstance(): PageLoadingManager {
    if (!PageLoadingManager.instance) {
      PageLoadingManager.instance = new PageLoadingManager()
    }
    return PageLoadingManager.instance
  }

  subscribe(listener: (state: LoadingState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state))
  }

  startLoading(initialProgress = 10) {
    this.state = {
      isLoading: true,
      error: null,
      progress: initialProgress,
    }
    this.notifyListeners()
  }

  updateProgress(progress: number | ((current: number) => number)) {
    const nextProgress = typeof progress === 'function'
      ? progress(this.state.progress)
      : progress
    const normalizedProgress = Math.max(this.state.progress, Math.min(100, nextProgress))

    this.state = {
      ...this.state,
      progress: normalizedProgress,
    }
    this.notifyListeners()
  }

  completeLoading() {
    this.state = {
      isLoading: false,
      error: null,
      progress: 100,
    }
    this.notifyListeners()

    // Reset after the completion frame without leaving stale progress behind.
    setTimeout(() => {
      if (this.state.progress !== 100 || this.state.isLoading) return
      this.state = {
        isLoading: false,
        error: null,
        progress: 0,
      }
      this.notifyListeners()
    }, 500)
  }

  setError(error: string) {
    this.state = {
      isLoading: false,
      error,
      progress: 0,
    }
    this.notifyListeners()
  }

  clearError() {
    this.state = {
      ...this.state,
      error: null,
    }
    this.notifyListeners()
  }

  reset() {
    this.state = {
      isLoading: false,
      error: null,
      progress: 0,
    }
    this.notifyListeners()
  }

  getState(): LoadingState {
    return { ...this.state }
  }
}

export const pageLoader = PageLoadingManager.getInstance()

/**
 * Hook to use page loading state
 */
export function usePageLoading() {
  const [state, setState] = React.useState<LoadingState>(pageLoader.getState())

  React.useEffect(() => {
    const unsubscribe = pageLoader.subscribe(setState)
    return unsubscribe
  }, [])

  const startLoading = React.useCallback((progress?: number) => pageLoader.startLoading(progress), [])
  const updateProgress = React.useCallback(
    (progress: number | ((current: number) => number)) => pageLoader.updateProgress(progress),
    [],
  )
  const completeLoading = React.useCallback(() => pageLoader.completeLoading(), [])
  const setError = React.useCallback((error: string) => pageLoader.setError(error), [])
  const clearError = React.useCallback(() => pageLoader.clearError(), [])
  const reset = React.useCallback(() => pageLoader.reset(), [])

  return {
    isLoading: state.isLoading,
    error: state.error,
    progress: state.progress,
    startLoading,
    updateProgress,
    completeLoading,
    setError,
    clearError,
    reset,
  }
}

