import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, ExternalLink, FileText, Home, Info, Layers3, Search, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { publishedWritingPosts } from '@/content/writing';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';

type CommandAction = {
  id: string;
  label: string;
  group: string;
  keywords?: string[];
  shortcut?: string;
  icon: typeof Home;
  run: () => void;
};

function formatShortcutLabel() {
  if (typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)) {
    return '⌘K';
  }

  return 'Ctrl K';
}

function isTypingTarget(target: HTMLElement | null) {
  return (
    target?.tagName === 'INPUT' ||
    target?.tagName === 'TEXTAREA' ||
    target?.isContentEditable
  );
}

export function CommandMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const chordTimeoutRef = useRef<number | null>(null);
  const pendingChordRef = useRef<string | null>(null);

  const actions = useMemo<CommandAction[]>(() => {
    const pageActions: CommandAction[] = [
      {
        id: 'page-home',
        label: 'Go to Home',
        group: 'Pages',
        keywords: ['landing', 'front page', 'index'],
        shortcut: 'G H',
        icon: Home,
        run: () => navigate('/'),
      },
      {
        id: 'page-about',
        label: 'Go to About',
        group: 'Pages',
        keywords: ['bio', 'profile'],
        shortcut: 'G A',
        icon: Info,
        run: () => navigate('/about'),
      },
      {
        id: 'page-writing',
        label: 'Go to Writing',
        group: 'Pages',
        keywords: ['posts', 'articles', 'blog'],
        shortcut: 'G W',
        icon: FileText,
        run: () => navigate('/writing'),
      },
      {
        id: 'page-uses',
        label: 'Go to Uses',
        group: 'Pages',
        keywords: ['gear', 'setup', 'tools'],
        shortcut: 'G U',
        icon: Sparkles,
        run: () => navigate('/uses/gear'),
      },
      {
        id: 'page-playground',
        label: 'Open Playground',
        group: 'Pages',
        keywords: ['apps', 'lab', 'experiments'],
        shortcut: 'G P',
        icon: Layers3,
        run: () => navigate('/playground'),
      },
    ];

    const writingActions: CommandAction[] = publishedWritingPosts.map((post) => ({
      id: `post-${post.slug}`,
      label: post.title,
      group: 'Writing',
      keywords: [post.summary, post.slug, ...post.tags],
      icon: FileText,
      run: () => navigate(`/writing/${post.slug}`),
    }));

    const utilityActions: CommandAction[] = [
      {
        id: 'utility-copy-url',
        label: 'Copy current URL',
        group: 'Actions',
        keywords: ['share', 'link'],
        shortcut: 'Y',
        icon: Copy,
        run: async () => {
          if (typeof window === 'undefined' || !navigator.clipboard) {
            return;
          }

          await navigator.clipboard.writeText(window.location.href);
        },
      },
      {
        id: 'utility-scroll-top',
        label: 'Scroll to top',
        group: 'Actions',
        keywords: ['jump', 'top'],
        icon: ExternalLink,
        run: () => {
          if (typeof window === 'undefined') {
            return;
          }

          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      },
    ];

    return [...pageActions, ...writingActions, ...utilityActions];
  }, [navigate]);

  const actionsById = useMemo(
    () =>
      new Map(actions.map((action) => [action.id, action])),
    [actions],
  );

  useEffect(() => {
    const clearChord = () => {
      pendingChordRef.current = null;

      if (chordTimeoutRef.current != null) {
        window.clearTimeout(chordTimeoutRef.current);
        chordTimeoutRef.current = null;
      }
    };

    const armChord = (value: string) => {
      pendingChordRef.current = value;

      if (chordTimeoutRef.current != null) {
        window.clearTimeout(chordTimeoutRef.current);
      }

      chordTimeoutRef.current = window.setTimeout(() => {
        pendingChordRef.current = null;
        chordTimeoutRef.current = null;
      }, 1200);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (isTypingTarget(target)) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        clearChord();
        setOpen((current) => !current);
        return;
      }

      if (event.altKey || event.metaKey || event.ctrlKey) {
        clearChord();
        return;
      }

      const key = event.key.toLowerCase();

      if (key === '/') {
        event.preventDefault();
        clearChord();
        setOpen(true);
        return;
      }

      if (key === 'y' && !event.shiftKey) {
        event.preventDefault();
        clearChord();
        void actionsById.get('utility-copy-url')?.run();
        return;
      }

      if (pendingChordRef.current === 'g') {
        const routeTargetByKey = new Map<string, string>([
          ['h', 'page-home'],
          ['a', 'page-about'],
          ['w', 'page-writing'],
          ['u', 'page-uses'],
          ['p', 'page-playground'],
        ]);

        const actionId = routeTargetByKey.get(key);
        clearChord();

        if (actionId) {
          event.preventDefault();
          void actionsById.get(actionId)?.run();
        }

        return;
      }

      if (key === 'g' && !event.shiftKey) {
        event.preventDefault();
        armChord('g');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearChord();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [actionsById]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const groups = useMemo(() => {
    const grouped = new Map<string, CommandAction[]>();

    for (const action of actions) {
      const existing = grouped.get(action.group) ?? [];
      existing.push(action);
      grouped.set(action.group, existing);
    }

    return [...grouped.entries()];
  }, [actions]);

  const shortcutLabel = formatShortcutLabel();

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="inline-flex h-9 gap-2 rounded-sm bg-background/20 px-2.5 text-xs font-normal text-muted-foreground shadow-none hover:bg-muted/20 hover:text-foreground"
        onClick={() => setOpen(true)}
        data-testid="command-menu-trigger"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Search</span>
        <span className="rounded-sm border border-border/70 bg-muted/15 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
          {shortcutLabel}
        </span>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Jump to a page, article, or action"
          data-testid="command-menu-input"
        />
        <CommandList>
          <CommandEmpty>No matching commands.</CommandEmpty>
          {groups.map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((action) => {
                const Icon = action.icon;

                return (
                  <CommandItem
                    key={action.id}
                    value={action.label}
                    keywords={action.keywords}
                    onSelect={() => {
                      void action.run();
                      setOpen(false);
                    }}
                    data-testid={`command-item-${action.id}`}
                  >
                    <Icon aria-hidden="true" />
                    <span>{action.label}</span>
                    {action.shortcut ? <CommandShortcut>{action.shortcut}</CommandShortcut> : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
