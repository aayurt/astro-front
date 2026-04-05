import React, { useMemo } from 'react';
import { Page, Navbar, List, ListInput, Button, Block } from 'konsta/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authClient } from '../lib/auth-client';
import { useAstroStore } from '../store/astroStore';
import { useChatStore } from '../store/chatStore';
import { debounce } from '../utils/debounce';

import { LocationSearchResult } from '../types/api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function OnboardingPage() {
  const { clearAstroData, updateUser } = useAstroStore();
  const { clearChatData } = useChatStore();
  const [birthDate, setBirthDate] = React.useState('');
  const [birthTime, setBirthTime] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [latitude, setLatitude] = React.useState('');
  const [longitude, setLongitude] = React.useState('');
  const [timezone, setTimezone] = React.useState('5.5');
  const [timezoneName, setTimezoneName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [searching, setSearching] = React.useState(false);
  const [fetchingTimezone, setFetchingTimezone] = React.useState(false);
  const [detecting, setDetecting] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<LocationSearchResult[]>([]);
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  const debouncedSearch = useMemo(
    () =>
      debounce(async (query: string) => {
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
      }, 1000),
    [],
  );

  const handleLocationInput = (val: string) => {
    setLocation(val);
    setError('');
    debouncedSearch(val);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setDetecting(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLatitude(latitude.toFixed(4));
        setLongitude(longitude.toFixed(4));
        setLocation(
          `Detected Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`,
        );
        setTimezone((-(new Date().getTimezoneOffset() / 60)).toString());
        setTimezoneName(Intl.DateTimeFormat().resolvedOptions().timeZone);
        setDetecting(false);
      },
      (err) => {
        setError('Error detecting location: ' + err.message);
        setDetecting(false);
      },
    );
  };

  const selectLocation = async (res: LocationSearchResult) => {
    setLocation(res.complete_name);
    setLatitude(res.latitude.toFixed(4));
    setLongitude(res.longitude.toFixed(4));
    setSearchResults([]);
    setError('');

    // Fetch timezone for the selected location
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
      setTimezoneName(tzRes.data.timezone_id || '');
    } catch (err) {
      console.error('Timezone error', err);
      // Fallback is already handled by backend or kept at default
    } finally {
      setFetchingTimezone(false);
    }
  };

  const handleSave = async () => {
    if (!birthDate || !birthTime || !latitude || !longitude) {
      setError('Please fill in all birth details');
      return;
    }
    setLoading(true);
    setError('');

    const session = await authClient.getSession();
    if (!session || !session.data) {
      setError('You must be logged in');
      navigate('/login');
      return;
    }

    try {
      await axios.post(
        `${BACKEND_URL}/api/user/profile`,
        {
          birthDate,
          birthTime,
          location,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          timezone,
        },
        {
          headers: {
            Authorization: `Bearer ${session.data.session.token}`,
          },
          withCredentials: true,
        },
      );
      // Update local store user
      updateUser({
        birthDate,
        birthTime,
        location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timezone,
      });
      clearAstroData();
      clearChatData();
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        'Failed to save details: ' + (err.response?.data?.error || err.message),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <Navbar title='Birth Details' />
      <Block strong>
        {error && (
          <div className='bg-red-100 text-red-600 p-3 mb-4 rounded-lg text-sm'>
            {error}
          </div>
        )}
        <p>Please enter your birth details to generate your charts.</p>
        <div className='mb-4'>
          <Button
            small
            outline
            onClick={handleUseCurrentLocation}
            disabled={detecting}
          >
            {detecting ? 'Detecting...' : 'Use Current Location'}
          </Button>
        </div>
        <List strongIos insetIos>
          <ListInput
            label='Birth Date'
            type='date'
            placeholder='Select date'
            value={birthDate}
            onInput={(e) => setBirthDate(e.target.value)}
          />
          <ListInput
            label='Birth Time'
            type='time'
            placeholder='Select time'
            value={birthTime}
            onInput={(e) => setBirthTime(e.target.value)}
          />
          <ListInput
            label='Location'
            type='text'
            placeholder='Search for your birthplace (e.g. Kathmandu)'
            value={location}
            onInput={(e) => handleLocationInput(e.target.value)}
            info={searching ? 'Searching...' : ''}
          />
          {searchResults.length > 0 && (
            <div className='bg-white border-x border-b max-h-40 overflow-y-auto mx-4 rounded-b-lg shadow-sm'>
              {searchResults.map((res, i) => (
                <div
                  key={i}
                  className='p-3 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-b-0'
                  onClick={() => selectLocation(res)}
                >
                  {res.complete_name}
                </div>
              ))}
            </div>
          )}
          <ListInput
            label='Latitude'
            type='number'
            placeholder='e.g. 27.7172'
            value={latitude}
            onInput={(e) => setLatitude(e.target.value)}
          />
          <ListInput
            label='Longitude'
            type='number'
            placeholder='e.g. 85.3240'
            value={longitude}
            onInput={(e) => setLongitude(e.target.value)}
          />
          <ListInput
            label='Timezone (Auto-detected from the location search)'
            type='number'
            placeholder='e.g. 5.5'
            value={timezone}
            disabled={true}
            onInput={(e) => setTimezone(e.target.value)}
            info={fetchingTimezone ? 'Fetching timezone...' : (timezoneName ? `Zone: ${timezoneName}` : '')}
          />
        </List>
        <Block>
          <Button large onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save and View Charts'}
          </Button>
        </Block>
      </Block>
    </Page>
  );
}
