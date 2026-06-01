import { Block, BlockTitle, Button, List, ListInput, Navbar, Page } from 'konsta/react';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import apiClient from '../lib/api-client';
import { useAstroStore } from '../store/astroStore';
import { useChatStore } from '../store/chatStore';
import { debounce } from '../utils/debounce';
import { LocationSearchResult, User } from '../types/api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function ProfilePage() {
  const { user: storeUser, clearAstroData, hydrated, updateUser, refreshData, fetchAllTransitData } = useAstroStore();
  const { clearChatData } = useChatStore();
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [timezone, setTimezone] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [fetchingTimezone, setFetchingTimezone] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (hydrated && storeUser) {
      setBirthDate(storeUser.birthDate ? new Date(storeUser.birthDate).toISOString().split('T')[0] : '');
      setBirthTime(storeUser.birthTime || '');
      setLocation(storeUser.location || '');
      setLatitude(storeUser.latitude?.toString() || '');
      setLongitude(storeUser.longitude?.toString() || '');
      setTimezone(storeUser.timezone || '');
    }
  }, [hydrated, storeUser]);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length < 3) {
          setSearchResults([]);
          return;
        }
        setSearching(true);
        try {
          const res = await apiClient.post('/api/location/search', {
            location: query,
          });
          setSearchResults(res.data);
        } catch (err) {
          console.error('Search error', err);
          setError('Failed to search locations');
        } finally {
          setSearching(false);
        }
      }, 1000),
    [],
  );

  const handleLocationInput = (val: string) => {
    setLocation(val);
    setError('');
    debouncedSearch(val);
  };

  const selectLocation = async (res: LocationSearchResult) => {
    setLocation(res.complete_name);
    setLatitude(res.latitude.toFixed(4));
    setLongitude(res.longitude.toFixed(4));
    setSearchResults([]);
    setError('');

    setFetchingTimezone(true);
    try {
      const tzRes = await apiClient.post('/api/location/timezone', {
        latitude: res.latitude,
        longitude: res.longitude,
      });
      setTimezone(tzRes.data.timezone_offset.toString());
    } catch (err) {
      console.error('Timezone error', err);
    } finally {
      setFetchingTimezone(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/api/user/profile', {
        birthDate,
        birthTime,
        location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timezone,
      });
      // Update user in store and refresh all astro data with new birth details
      await useAstroStore.getState().updateUserAndRefresh({
        birthDate,
        birthTime,
        location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timezone,
      });
      // Clear chat data as well
      clearChatData();
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await useAstroStore.getState().logout();
  };

  return (
    <Page>
      <Navbar title="My Profile" />

      <Block strong className="flex flex-col items-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-3xl mb-4">
          👤
        </div>
        <div className="text-xl font-bold">{storeUser?.name || 'User'}</div>
        <div className="text-gray-500 text-sm">{storeUser?.email}</div>
      </Block>

      <BlockTitle>Edit Birth Details</BlockTitle>
      <List strongIos insetIos>
        <ListInput
          label="Birth Date"
          type="date"
          value={birthDate}
          onInput={(e) => setBirthDate(e.target.value)}
        />
        <ListInput
          label="Birth Time"
          type="time"
          value={birthTime}
          onInput={(e) => setBirthTime(e.target.value)}
        />
        <ListInput
          label="Location"
          type="text"
          placeholder="Search birthplace"
          value={location}
          onInput={(e) => handleLocationInput(e.target.value)}
          info={searching ? 'Searching...' : ''}
        />
        {searchResults.length > 0 && (
          <div className="bg-white border rounded-md shadow-lg mx-4 overflow-y-auto max-h-40">
            {searchResults.map((res, i) => (
              <div
                key={i}
                className="p-3 border-b last:border-0 cursor-pointer hover:bg-gray-100 text-sm"
                onClick={() => selectLocation(res)}
              >
                {res.complete_name}
              </div>
            ))}
          </div>
        )}
        <ListInput
          label='Timezone (Auto-detected from the location search)'
          type="text"
          value={timezone}
          disabled={true}
          onInput={(e) => setTimezone(e.target.value)}
          info={fetchingTimezone ? 'Fetching timezone...' : ''}
        />
      </List>

      <Block>
        <Button large onClick={handleUpdate} disabled={fetchingTimezone || loading}>
          {loading ? 'Updating...' : 'Update & Recalculate'}
        </Button>
      </Block>

      <Block>
        <Button large outline onClick={async () => { await refreshData(); await fetchAllTransitData(true); }}>
          Sync Now
        </Button>
      </Block>

      <Block className="mt-10">
        <Button large outline onClick={handleLogout}>
          Logout
        </Button>
      </Block>

      {error && (
        <Block strong className="text-center text-red-500">
          {error}
        </Block>
      )}
    </Page>
  );
}
