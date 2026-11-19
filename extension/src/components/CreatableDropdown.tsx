import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react';
import { type Label } from '@/lib/gmailApi';

// Searchable label picker that can also create a new label.
// WAI-ARIA "combobox with listbox popup": focus stays in the text field and
// the highlighted option is announced with aria-activedescendant.
//   Click / type / Down arrow  open the list
//   Up / Down                  move the highlight (wraps)
//   Enter                      pick the highlighted option (or "+ Create")
//   Escape / Tab / click away  close without changing the selection
// Styling: .mc-input for the field, .mc-menu* for the list (components.css).

type CreatableDropdownProps = {
  /** Visible label for the field, e.g. "Label as". */
  label: string;
  items: Label[];
  /** id of the currently chosen label ('' for none). */
  selectedId: string;
  onChangeId: (id: string) => void;
  /** Creates a label; resolve true if it worked (the parent then selects it). */
  onCreate: (name: string) => Promise<boolean>;
  placeholder?: string;
};

type Option = { kind: 'item'; item: Label } | { kind: 'create'; name: string };

export function CreatableDropdown({
  label,
  items,
  selectedId,
  onChangeId,
  onCreate,
  placeholder = 'Choose or create a label',
}: CreatableDropdownProps) {
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listId = `${baseId}-list`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(''); // what's typed while the list is open
  const [active, setActive] = useState(-1); // highlighted option, -1 = none
  const [creating, setCreating] = useState(false);

  const selected = items.find((item) => item.id === selectedId);
  const typed = query.trim();

  const options = useMemo<Option[]>(() => {
    const needle = typed.toLowerCase();
    const matches = items.filter((item) => item.name.toLowerCase().includes(needle));
    const exists = items.some((item) => item.name.toLowerCase() === needle);
    return [
      ...matches.map((item): Option => ({ kind: 'item', item })),
      ...(typed && !exists ? [{ kind: 'create', name: typed } as Option] : []),
    ];
  }, [items, typed]);

  // Keep the highlight inside the list as it shrinks.
  useEffect(() => {
    if (active >= options.length) setActive(options.length - 1);
  }, [active, options.length]);

  // Keep the highlighted option scrolled into view.
  useEffect(() => {
    if (open && active >= 0) {
      document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
    }
    // optionId only depends on baseId, which never changes
  }, [open, active]);

  function openList() {
    if (open) return;
    setOpen(true);
    setQuery('');
    setActive(items.findIndex((item) => item.id === selectedId));
  }

  function close() {
    setOpen(false);
    setQuery('');
    setActive(-1);
  }

  async function choose(option: Option) {
    if (option.kind === 'item') {
      onChangeId(option.item.id);
      close();
      return;
    }
    if (creating) return;
    setCreating(true);
    try {
      if (await onCreate(option.name)) close();
    } finally {
      setCreating(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const count = options.length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) return openList();
        setActive((index) => (count ? (index + 1) % count : -1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) return openList();
        setActive((index) => (count ? (index <= 0 ? count - 1 : index - 1) : -1));
        break;
      case 'Enter': {
        if (!open) return;
        event.preventDefault();
        // Nothing highlighted: an exact name match still counts.
        const option =
          options[active] ??
          options.find((o) => o.kind === 'item' && o.item.name.toLowerCase() === typed.toLowerCase());
        if (option) void choose(option);
        break;
      }
      case 'Escape':
        if (open) {
          event.preventDefault();
          close();
        }
        break;
      case 'Tab':
        close();
        break;
      default:
        // Typing while closed starts a fresh search instead of editing the
        // chosen label's name. (React applies this before the key's character
        // lands in the field.)
        if (
          !open &&
          (event.key.length === 1 || event.key === 'Backspace' || event.key === 'Delete') &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          openList();
        }
    }
  }

  return (
    <div className="mc-field">
      <label htmlFor={inputId} className="mc-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          className="mc-input pr-10"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
          aria-busy={creating || undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={open ? query : (selected?.name ?? '')}
          onClick={openList}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(event.target.value.trim() ? 0 : -1);
          }}
          onKeyDown={handleKeyDown}
          onPaste={openList}
          onBlur={close}
        />
        {/* Pixel down-arrow. Decorative: the field itself opens the list. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 4 3"
          className="pointer-events-none absolute top-1/2 right-px4 h-3 w-4 -translate-y-1/2 text-text-muted"
          shapeRendering="crispEdges"
        >
          <path d={open ? 'M1 0h2v1h1v1H0V1h1z' : 'M0 0h4v1H3v1H1V1H0z'} fill="currentColor" />
        </svg>

        <div className="mc-menu absolute inset-x-0 top-full z-20 mt-px2" hidden={!open}>
          <ul id={listId} role="listbox" aria-label={label}>
            {options.map((option, index) => (
              <li
                key={option.kind === 'item' ? option.item.id : 'create'}
                id={optionId(index)}
                role="option"
                aria-selected={index === active}
                className={[
                  'mc-menu__item',
                  option.kind === 'create' && 'mc-menu__item--create',
                  option.kind === 'item' && option.item.id === selectedId && 'mc-menu__item--current',
                ]
                  .filter(Boolean)
                  .join(' ')}
                // Keep focus in the field so onBlur doesn't close the list mid-click.
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => void choose(option)}
              >
                {option.kind === 'item' ? option.item.name : `+ Create "${option.name}"`}
              </li>
            ))}
          </ul>
          {options.length === 0 && <p className="mc-menu__note">No labels yet. Type a name to create one.</p>}
          {creating && (
            <p className="mc-menu__note" role="status">
              Creating label...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
