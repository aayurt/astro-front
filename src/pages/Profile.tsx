import React, { useState, useEffect } from 'react';
import { Page, Navbar, List, ListInput, Button, Block, Card, BlockTitle } from 'konsta/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authClient } from '../lib/auth-client';
import { User, LocationSearchResult } from '../types/api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
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
    const fetchUser = async () => {
      const session = await authClient.getSession();
      if (session?.data?.user) {
        const u = session.data.user as any;
        setUser(u);
        setBirthDate(u.birthDate ? new Date(u.birthDate).toISOString().split('T')[0] : '');
        setBirthTime(u.birthTime || '');
        setLocation(u.location || '');
        setLatitude(u.latitude?.toString() || '');
        setLongitude(u.longitude?.toString() || '');
        setTimezone(u.timezone || '');
      } else {
        navigate('/login');
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLocationSearch = async (query: string) => {
    setLocation(query);
    setError('');
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const session = await authClient.getSession();
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/location/search`,
        { location: query },
        {
          headers: { Authorization: `Bearer ${session.data?.session.token}` },
          withCredentials: true,
        },
      );
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search error', err);
      setError('Failed to search locations');
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = async (res: LocationSearchResult) => {
    setLocation(res.complete_name);
    setLatitude(res.latitude.toFixed(4));
    setLongitude(res.longitude.toFixed(4));
    setSearchResults([]);
    setError('');

    setFetchingTimezone(true);
    const session = await authClient.getSession();
    try {
      const tzRes = await axios.post(
        `${BACKEND_URL}/api/location/timezone`,
        { latitude: res.latitude, longitude: res.longitude },
        {
          headers: { Authorization: `Bearer ${session.data?.session.token}` },
          withCredentials: true,
        },
      );
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
    const session = await authClient.getSession();
    try {
      await axios.post(
        `${BACKEND_URL}/api/user/profile`,
        { birthDate, birthTime, location, latitude, longitude, timezone },
        {
          headers: { Authorization: `Bearer ${session.data?.session.token}` },
          withCredentials: true,
        }
      );
      // Refresh session and user data
      await authClient.getSession();
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    navigate('/login');
  };

  return (
    <Page>
      <Navbar title="My Profile" />

      <Block strong className="flex flex-col items-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-3xl mb-4">
          👤
        </div>
        <div className="text-xl font-bold">{user?.name || 'User'}</div>
        <div className="text-gray-500 text-sm">{user?.email}</div>
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
          onInput={(e) => handleLocationSearch(e.target.value)}
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
          label="Timezone"
          type="text"
          value={timezone}
          onInput={(e) => setTimezone(e.target.value)}
          info={fetchingTimezone ? 'Fetching timezone...' : ''}
        />
      </List>

      <Block>
        <Button large onClick={handleUpdate} disabled={loading}>
          {loading ? 'Updating...' : 'Update & Recalculate'}
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
