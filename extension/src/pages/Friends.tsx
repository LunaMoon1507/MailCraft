import { useEffect, useRef, useState, type FormEvent } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';
import { useAuth } from '@/hooks/useAuth';
import { avatarFor } from '@/lib/avatar';
import {
  type Friend,
  type FriendSearchResult,
  type LeaderboardEntry,
  addFriend,
  getFriends,
  getLeaderboard,
  removeFriend,
  searchUser,
} from '@/lib/api';

// Friends tab (PBI #10 / SCRUM-41): search by exact username, add with +,
// and see/remove current friends. Adding is instant and mutual.
export default function Friends() {
  const { token, isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<FriendSearchResult | null>(null);
  const [searchError, setSearchError] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [listError, setListError] = useState('');
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
 const [leaderboardError, setLeaderboardError] = useState('');
 const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  async function loadFriends() {
    try {
      setFriends(await getFriends());
      setListError('');
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Could not load your friends list.');
    }
  }

  async function loadLeaderboard() {
    setLeaderboardLoading(true);
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
      setLeaderboardError('');
    } catch (error) {
      setLeaderboardError(error instanceof Error ? error.message : 'Could not load the leaderboard.');
    } finally {
      setLeaderboardLoading(false);
    }
  }

  // Reload when the user logs in or out (or the token is refreshed).
  useEffect(() => {
    setResult(null);
    setSearchError('');
    if (isAuthenticated) {
      void loadFriends();
      void loadLeaderboard();
    } else {
      setFriends([]);
      setLeaderboard([]);
      setListError('');
      setLeaderboardError('');
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) { return; }
    const handleCleanupUpdate = () => {
      void loadLeaderboard();
    };
    window.addEventListener('MailCraft: cleanup updated', handleCleanupUpdate);
    return () => {
      window.removeEventListener('MailCraft: cleanup updated', handleCleanupUpdate);
    };
  }, [isAuthenticated]); 

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    const username = query.trim();
    setResult(null);
    if (!username) {
      setSearchError('Enter a username to search for.');
      return;
    }
    setBusy(true);
    setSearching(true);
    try {
      const found = await searchUser(username);
      if (found) {
        setResult(found);
        setSearchError('');
      } else {
        setSearchError(`No user named "${username}".`);
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed, please try again.');
    } finally {
      setBusy(false);
      setSearching(false);
    }
  }

  async function handleAdd(username: string) {
    setBusy(true);
    try {
      await addFriend(username);
      setResult((current) => (current ? { ...current, isFriend: true } : current));
      await loadFriends();
      await loadLeaderboard();
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Could not add friend, please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(username: string) {
    setBusy(true);
    try {
      await removeFriend(username);
      setResult((current) =>
        current?.username === username ? { ...current, isFriend: false } : current,
      );
      await loadFriends();
      await loadLeaderboard();
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Could not remove friend, please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Card variant="secondary" heading="Find a friend">
        <form onSubmit={handleSearch} noValidate>
          <TextInput
            label="Username"
            value={query}
            updateValue={setQuery}
            error={searchError}
            autoComplete="off"
            spellCheck={false}
            trailing={
              <Button type="submit" variant="primary" size="sm" disabled={busy} loading={searching}>
                Search
              </Button>
            }
          />
        </form>

        {result && (
          <div
            className="mc-bevel mc-bevel--inset bg-outline m-px1 flex items-center gap-px2 p-px2"
            role="status"
            aria-label={`Search result: ${result.username}`}
          >
            <Avatar username={result.username} icon={result.avatar} />
            <span className="mc-stat__value min-w-0 flex-1 break-words">{result.username}</span>
            {result.isSelf ? (
              <span className="mc-label">That's you</span>
            ) : result.isFriend ? (
              <span className="mc-label">Friends</span>
            ) : (
              <Button
                variant="primary"
                size="sm"
                disabled={busy}
                onClick={() => void handleAdd(result.username)}
                aria-label={`Add ${result.username} as a friend`}
              >
                + Add
              </Button>
            )}
          </div>
        )}
      </Card>

      <Card variant="primary" heading="🏆 Friends Leaderboard">
        {leaderboardError && (<p className="mc-error">{leaderboardError}</p>)}
        {leaderboardLoading && leaderboard.length === 0 && (<p>Loading leaderboard...</p>)}
        {!leaderboardLoading && leaderboard.length === 0 && !leaderboardError && (<p>No leaderboard data available yet.</p>)}
        {leaderboard.length > 0 && (
          <ol aria-label="Friends leaderboard">
            {leaderboard.map((entry) => (
              <li
                key={entry.userId}
                className={`mc-stat items-center ${
                  entry.isCurrentUser ? 'bg-highlight' : ''
                }`}
              >
                <span className="mc-label">#{entry.rank}</span>
                <Avatar username={entry.username} icon={entry.avatar} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="mc-stat__value break-words">{entry.username} {entry.isCurrentUser && ' (You)'}</span>
                  <span className="mc-label">{entry.emailsCleaned.toLocaleString()} emails cleaned</span>
                </div>

                {entry.rank === 1 && (<span aria-label="First place">🥇</span>)}
              </li>
            ))}
          </ol>
        )}
        <Button
          variant="primary"
          size="sm"
          disabled={leaderboardLoading}
          loading={leaderboardLoading}
          onClick={() => void loadLeaderboard()}
        >
          Refresh leaderboard
        </Button>
      </Card>

      <Card variant="primary" heading={`Your friends (${friends.length})`}>
        {listError && <p className="mc-error">{listError}</p>}
        {friends.length === 0 && !listError && <p>No friends yet. Search for a username above.</p>}
        {friends.length > 0 && (
          <ul aria-label="Your friends">
            {friends.map((friend) => (
              <FriendRow
                key={friend.username}
                friend={friend}
                disabled={busy}
                onRemove={() => void handleRemove(friend.username)}
              />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function Avatar({ username, icon }: { username: string, icon: number }) {
  return (
    <span className="mc-slot h-10 w-10">
      <img src={avatarFor(icon)} alt="" />
    </span>
  );
}

const CONFIRM_MS = 3000;

// One friend. Remove takes two clicks: the first turns the button into
// "Sure?" for a few seconds, the second actually removes.
function FriendRow({ friend, disabled, onRemove }: { friend: Friend; disabled: boolean; onRemove: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleClick() {
    if (confirming) {
      clearTimeout(timer.current);
      setConfirming(false);
      onRemove();
      return;
    }
    setConfirming(true);
    timer.current = setTimeout(() => setConfirming(false), CONFIRM_MS);
  }

  return (
    <li className="mc-stat items-center">
      <Avatar username={friend.username} icon={friend.avatar} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="mc-stat__value break-words">{friend.username}</span>
        <span className="mc-label">Friends since {formatSince(friend.since)}</span>
      </div>
      <Button
        variant="danger"
        size="sm"
        disabled={disabled}
        onClick={handleClick}
        onBlur={() => setConfirming(false)}
        aria-label={
          confirming
            ? `Click again to remove ${friend.username} from friends`
            : `Remove ${friend.username} from friends`
        }
      >
        {confirming ? 'Sure?' : 'Remove'}
      </Button>
    </li>
  );
}

// "Oct 2" this year, "Oct 2, 2025" otherwise.
function formatSince(since: string) {
  const date = new Date(since);
  if (Number.isNaN(date.getTime())) return 'a while';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== new Date().getFullYear() && { year: 'numeric' }),
  });
}
