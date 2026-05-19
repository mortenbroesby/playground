import { useState } from 'react';
import { getSharedPassword } from './config';
import { AnecdotesSection } from './components/AnecdotesSection';
import { AppShell } from './components/AppShell';
import { ChatSection } from './components/ChatSection';
import { DisplayNameDialog } from './components/DisplayNameDialog';
import { PasswordGate } from './components/PasswordGate';
import { AboutSection } from './components/AboutSection';
import {
  clearSession,
  getDisplayName,
  isUnlocked,
  setDisplayName,
  unlockSession,
} from './lib/session';

export type BroesbySection = 'about' | 'anecdotes' | 'chat';

type AppProps = {
  sharedPassword?: string;
};

export function App({ sharedPassword = getSharedPassword() }: AppProps) {
  const [unlocked, setUnlocked] = useState(() => isUnlocked());
  const [displayName, setDisplayNameState] = useState(() => getDisplayName());
  const [activeSection, setActiveSection] = useState<BroesbySection>('about');

  function handleUnlock(password: string) {
    if (password !== sharedPassword) {
      return false;
    }

    unlockSession();
    setUnlocked(true);
    return true;
  }

  function handleSaveDisplayName(value: string) {
    const trimmed = value.trim();

    if (!trimmed) {
      return;
    }

    setDisplayName(trimmed);
    setDisplayNameState(trimmed);
  }

  function handleReset() {
    clearSession();
    setUnlocked(false);
    setDisplayNameState('');
    setActiveSection('about');
  }

  if (!unlocked) {
    return <PasswordGate onUnlock={handleUnlock} />;
  }

  return (
    <>
      <DisplayNameDialog
        opened={!displayName}
        initialValue={displayName}
        onSave={handleSaveDisplayName}
      />
      <AppShell
        activeSection={activeSection}
        displayName={displayName}
        onReset={handleReset}
        onSelectSection={setActiveSection}
      >
        {activeSection === 'about' ? <AboutSection /> : null}
        {activeSection === 'anecdotes' ? <AnecdotesSection displayName={displayName} /> : null}
        {activeSection === 'chat' ? <ChatSection displayName={displayName} /> : null}
      </AppShell>
    </>
  );
}
