import { describe, it, expect, beforeEach } from 'vitest';
import { useToastStore } from '@/store/useToastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    // Reset the store between tests
    useToastStore.setState({ toasts: [] });
  });

  it('starts with empty toasts', () => {
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(0);
  });

  it('addToast adds a toast with correct fields', () => {
    const { addToast } = useToastStore.getState();
    addToast('Test message', 'success');

    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Test message');
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].id).toBeDefined();
  });

  it('addToast supports tx signature', () => {
    const { addToast } = useToastStore.getState();
    addToast('Minted!', 'success', 'sig123');

    const { toasts } = useToastStore.getState();
    expect(toasts[0].txSignature).toBe('sig123');
  });

  it('generates unique IDs', () => {
    const { addToast } = useToastStore.getState();
    addToast('Toast 1', 'info');
    addToast('Toast 2', 'info');

    const { toasts } = useToastStore.getState();
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });

  it('removeToast removes specific toast', () => {
    const { addToast } = useToastStore.getState();
    addToast('Keep', 'info');
    addToast('Remove', 'error');

    const { toasts } = useToastStore.getState();
    const removeId = toasts[1].id;

    useToastStore.getState().removeToast(removeId);
    const updated = useToastStore.getState().toasts;
    expect(updated).toHaveLength(1);
    expect(updated[0].message).toBe('Keep');
  });

  it('clearAll removes all toasts', () => {
    const { addToast } = useToastStore.getState();
    addToast('A', 'info');
    addToast('B', 'info');
    addToast('C', 'info');

    useToastStore.getState().clearAll();
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('removeToast does nothing for non-existent ID', () => {
    const { addToast } = useToastStore.getState();
    addToast('Test', 'info');

    useToastStore.getState().removeToast('non-existent-id');
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it('supports all toast types', () => {
    const { addToast } = useToastStore.getState();
    const types = ['success', 'error', 'info', 'warning'] as const;

    types.forEach((type) => addToast(`${type} msg`, type));

    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(4);
    types.forEach((type, i) => {
      expect(toasts[i].type).toBe(type);
    });
  });
});
