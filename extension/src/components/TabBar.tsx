import { type KeyboardEvent, useRef } from 'react';

// Hotbar-style tab bar for switching side-panel screens.
// Styling lives in src/assets/theme/components.css (.mc-hotbar, .mc-tab*). See THEME.md.
export interface TabItem<Id extends string = string> {
  id: Id;
  label: string;
  /** Image URL, e.g. `import steve from '@graphics/8-steve.png'`. Decorative: the label names the tab. */
  icon?: string;
  /** Shown dimmed and can't be selected (e.g. tabs that need a login). */
  disabled?: boolean;
  /** Tooltip explaining why a disabled tab is locked. */
  disabledReason?: string;
}

export interface TabBarProps<Id extends string> {
  tabs: TabItem<Id>[];
  active: Id;
  onChange: (id: Id) => void;
  /** Accessible name for the tab list, e.g. "MailCraft sections". */
  label: string;
  className?: string;
}

/** id of a tab's button. Use it for aria-labelledby on the tab's panel. */
export const tabId = (id: string) => `mc-tab-${id}`;
/** id to give a tab's panel (the element with role="tabpanel"). */
export const panelId = (id: string) => `mc-tabpanel-${id}`;

export default function TabBar<Id extends string>({
  tabs,
  active,
  onChange,
  label,
  className = '',
}: TabBarProps<Id>) {
  const buttons = useRef(new Map<Id, HTMLButtonElement>());

  // Arrow keys / Home / End move between enabled tabs and select them
  // (WAI-ARIA tabs pattern, automatic activation). Only the selected tab is
  // in the Tab order, so Tab jumps straight from the bar into the panel.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const enabled = tabs.filter((tab) => !tab.disabled);
    if (enabled.length === 0) return;
    const index = enabled.findIndex((tab) => tab.id === active);
    let next: TabItem<Id> | undefined;
    switch (event.key) {
      case 'ArrowRight':
        next = enabled[(index + 1) % enabled.length];
        break;
      case 'ArrowLeft':
        next = enabled[(index - 1 + enabled.length) % enabled.length];
        break;
      case 'Home':
        next = enabled[0];
        break;
      case 'End':
        next = enabled[enabled.length - 1];
        break;
      default:
        return;
    }
    event.preventDefault();
    if (next) {
      onChange(next.id);
      buttons.current.get(next.id)?.focus();
    }
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={['mc-hotbar', className].filter(Boolean).join(' ')}
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(element) => {
              if (element) buttons.current.set(tab.id, element);
              else buttons.current.delete(tab.id);
            }}
            type="button"
            role="tab"
            id={tabId(tab.id)}
            // Only the active tab's panel is rendered, so only it is referenced.
            aria-controls={selected ? panelId(tab.id) : undefined}
            aria-selected={selected}
            aria-disabled={tab.disabled || undefined}
            tabIndex={selected ? 0 : -1}
            title={tab.disabled ? tab.disabledReason : undefined}
            className={['mc-tab', selected && 'mc-tab--active'].filter(Boolean).join(' ')}
            onClick={() => {
              if (!tab.disabled) onChange(tab.id);
            }}
          >
            {tab.icon && <img src={tab.icon} alt="" />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
