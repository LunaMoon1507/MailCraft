import { useEffect, useState, type FormEvent } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';
import { useAuth } from '@/hooks/useAuth';
import {
  type Friend,
  type FriendSearchResult,
  addFriend,
  getFriends,
  removeFriend,
  searchUser,
} from '@/lib/api';

// Friends block (PBI #10 / SCRUM-41): search by exact username, add with +,
// and see/remove current friends. Adding is instant and mutual.
export default function Friends() {
  const { token, isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<FriendSearchResult | null>(null);
  const [searchError, setSearchError] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [listError, setListError] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadFriends() {
    try {
      setFriends(await getFriends());
      setListError('');
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Could not load your friends list.');
    }
  }

  // Reload when the user logs in or out (or the token is refreshed).
  useEffect(() => {
    setResult(null);
    setSearchError('');
    if (isAuthenticated) {
      void loadFriends();
    } else {
      setFriends([]);
    }
  }, [token, isAuthenticated]);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    const username = query.trim();
    setResult(null);
    if (!username) {
      setSearchError('Enter a username to search for.');
      return;
    }
    setBusy(true);
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
    }
  }

  async function handleAdd(username: string) {
    setBusy(true);
    try {
      await addFriend(username);
      setResult((current) => (current ? { ...current, isFriend: true } : current));
      await loadFriends();
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
    <Card variant="secondary" heading="Friends">
      <form onSubmit={handleSearch} className="flex flex-col gap-px2">
        <TextInput
          label="Find a friend by username"
          value={query}
          updateValue={setQuery}
          error={searchError}
          autoComplete="off"
        />
        <div>
          <Button type="submit" variant="primary" size="sm" disabled={busy}>
            Search
          </Button>
        </div>
      </form>

      {result && (
        <div className="mc-stat items-center">
          <span>{result.username}</span>
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
              +
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-px2">
        <span className="mc-label">Your friends ({friends.length})</span>
        {listError && <p className="mc-error">{listError}</p>}
        {friends.length === 0 && !listError && <p>No friends yet. Search for a username above.</p>}
        {friends.map((friend) => (
          <div key={friend.username} className="mc-stat items-center">
            <span>{friend.username}</span>
            <Button
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={() => void handleRemove(friend.username)}
              aria-label={`Remove ${friend.username} from friends`}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
