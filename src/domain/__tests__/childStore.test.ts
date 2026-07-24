import { describe, it, expect } from 'vitest';
import {
  reducer,
  initialState,
  activeChild,
  exportData,
  type AppState,
  type Child,
} from '../../app/childStore';

const child = (id: string, nickname = id): Child => ({
  id,
  nickname,
  birthDate: '2024-01-01',
  useCorrectedAge: false,
});

describe('child store reducer', () => {
  it('records consent', () => {
    const s = reducer(initialState, { type: 'accept_consent', at: '2026-07-24' });
    expect(s.consentAcceptedAt).toBe('2026-07-24');
  });

  it('adds a child and makes the first one active', () => {
    const s = reducer(initialState, { type: 'add_child', child: child('a') });
    expect(s.children).toHaveLength(1);
    expect(s.activeChildId).toBe('a');
  });

  it('keeps the active child when adding a second', () => {
    let s = reducer(initialState, { type: 'add_child', child: child('a') });
    s = reducer(s, { type: 'add_child', child: child('b') });
    expect(s.activeChildId).toBe('a');
    expect(s.children).toHaveLength(2);
  });

  it('edits a child in place', () => {
    let s = reducer(initialState, { type: 'add_child', child: child('a', 'Old') });
    s = reducer(s, { type: 'edit_child', child: { ...child('a'), nickname: 'New' } });
    expect(activeChild(s)?.nickname).toBe('New');
  });

  it('deletes the active child and reassigns active', () => {
    let s = reducer(initialState, { type: 'add_child', child: child('a') });
    s = reducer(s, { type: 'add_child', child: child('b') });
    s = reducer(s, { type: 'delete_child', id: 'a' });
    expect(s.children.map((c) => c.id)).toEqual(['b']);
    expect(s.activeChildId).toBe('b');
  });

  it('sets active to null when the last child is deleted', () => {
    let s = reducer(initialState, { type: 'add_child', child: child('a') });
    s = reducer(s, { type: 'delete_child', id: 'a' });
    expect(s.activeChildId).toBeNull();
  });

  it('switches only to an existing child', () => {
    let s = reducer(initialState, { type: 'add_child', child: child('a') });
    s = reducer(s, { type: 'add_child', child: child('b') });
    s = reducer(s, { type: 'switch_child', id: 'ghost' });
    expect(s.activeChildId).toBe('a'); // unchanged
    s = reducer(s, { type: 'switch_child', id: 'b' });
    expect(s.activeChildId).toBe('b');
  });

  it('wipes everything on delete_account', () => {
    let s: AppState = reducer(initialState, { type: 'accept_consent', at: 'x' });
    s = reducer(s, { type: 'add_child', child: child('a') });
    s = reducer(s, { type: 'delete_account' });
    expect(s).toEqual(initialState);
  });

  it('exports minimized data as valid JSON', () => {
    let s = reducer(initialState, { type: 'add_child', child: child('a') });
    s = reducer(s, { type: 'accept_consent', at: '2026-07-24' });
    const parsed = JSON.parse(exportData(s));
    expect(parsed.children).toHaveLength(1);
    expect(parsed.consentAcceptedAt).toBe('2026-07-24');
  });
});
