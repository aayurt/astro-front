import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '../lib/api-client';
import { useAstroStore } from '../store/astroStore';
import { useChatStore } from '../store/chatStore';
import { debounce } from '../utils/debounce';
import { LocationSearchResult, Profile as ProfileType } from '../types/api';
import { Page } from '../components/ui/page';
import { Navbar } from '../components/ui/navbar';
import { Input } from '../components/modern-ui/input';
import { Button } from '../components/modern-ui/button';
import { Dialog, DialogContent } from '../components/modern-ui/dialog';
import { AvatarDisplay, AvatarPicker } from '../components/AvatarPicker';

export default function ProfilePage() {
  const { user: storeUser, hydrated, refreshData, fetchAllTransitData, profiles, activeProfileId, setActiveProfile, fetchProfiles, addProfile, updateProfile, deleteProfile, coins, fetchCoinStatus, redeemCoupon } = useAstroStore();
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
  const [profileDialog, setProfileDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ProfileType | null>(null);
  const [pfName, setPfName] = useState('');
  const [pfRelation, setPfRelation] = useState('self');
  const [pfAvatar, setPfAvatar] = useState('cat');
  const [pfColor, setPfColor] = useState('indigo');
  const [pfBirthDate, setPfBirthDate] = useState('');
  const [pfBirthTime, setPfBirthTime] = useState('');
  const [pfLocation, setPfLocation] = useState('');
  const [pfLatitude, setPfLatitude] = useState('');
  const [pfLongitude, setPfLongitude] = useState('');
  const [pfTimezone, setPfTimezone] = useState('5.5');
  const [pfSaving, setPfSaving] = useState(false);
  const [pfSearchResults, setPfSearchResults] = useState<LocationSearchResult[]>([]);
  const [pfSearching, setPfSearching] = useState(false);
  const [pfFetchingTz, setPfFetchingTz] = useState(false);
  const [pfError, setPfError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated) return;
    if (activeProfileId && profiles.length > 0) {
      const p = profiles.find(p => p.id === activeProfileId);
      if (p) {
        setBirthDate(p.birthDate ? new Date(p.birthDate).toISOString().split('T')[0] : '');
        setBirthTime(p.birthTime || '');
        setLocation(p.location || '');
        setLatitude(p.latitude?.toString() || '');
        setLongitude(p.longitude?.toString() || '');
        setTimezone(p.timezone || '');
        return;
      }
    }
    if (storeUser) {
      setBirthDate(storeUser.birthDate ? new Date(storeUser.birthDate).toISOString().split('T')[0] : '');
      setBirthTime(storeUser.birthTime || '');
      setLocation(storeUser.location || '');
      setLatitude(storeUser.latitude?.toString() || '');
      setLongitude(storeUser.longitude?.toString() || '');
      setTimezone(storeUser.timezone || '');
    }
  }, [hydrated, storeUser, activeProfileId, profiles]);

  useEffect(() => {
    if (hydrated) {
      fetchProfiles();
      fetchCoinStatus();
    }
  }, [hydrated]);

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
      if (activeProfileId && profiles.find(p => p.id === activeProfileId)) {
        await updateProfile(activeProfileId, {
          birthDate,
          birthTime,
          location,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          timezone,
        });
        await fetchProfiles();
        await useAstroStore.getState().recalculateChart();
      } else {
        await apiClient.post('/api/user/profile', {
          birthDate,
          birthTime,
          location,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          timezone,
        });
        const { updateUserAndRefresh } = useAstroStore.getState();
        await updateUserAndRefresh({
          birthDate,
          birthTime,
          location,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          timezone,
        });
      }
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

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) return;
    setRedeeming(true);
    try {
      const newCoins = await redeemCoupon(couponCode.trim());
      toast.success(`Coupon redeemed! You now have ${newCoins} coins.`);
      setCouponCode('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to redeem coupon');
    } finally {
      setRedeeming(false);
    }
  };

  const openProfileDialog = (profile?: ProfileType) => {
    if (profile) {
      setEditingProfile(profile);
      setPfName(profile.name);
      setPfRelation(profile.relation);
      setPfAvatar(profile.avatar || 'cat');
      setPfColor(profile.color || 'indigo');
      setPfBirthDate(profile.birthDate ? new Date(profile.birthDate).toISOString().split('T')[0] : '');
      setPfBirthTime(profile.birthTime || '');
      setPfLocation(profile.location || '');
      setPfLatitude(profile.latitude?.toString() || '');
      setPfLongitude(profile.longitude?.toString() || '');
      setPfTimezone(profile.timezone || '5.5');
    } else {
      setEditingProfile(null);
      setPfName('');
      setPfRelation('self');
      setPfAvatar('cat');
      setPfColor('indigo');
      setPfBirthDate('');
      setPfBirthTime('');
      setPfLocation('');
      setPfLatitude('');
      setPfLongitude('');
      setPfTimezone('5.5');
    }
    setPfSearchResults([]);
    setPfError('');
    setProfileDialog(true);
  };

  const debouncedPfSearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (query.length < 3) {
          setPfSearchResults([]);
          return;
        }
        setPfSearching(true);
        try {
          const res = await apiClient.post('/api/location/search', {
            location: query,
          });
          setPfSearchResults(res.data);
        } catch (err) {
          console.error('Profile search error', err);
        } finally {
          setPfSearching(false);
        }
      }, 1000),
    [],
  );

  const handlePfLocationInput = (val: string) => {
    setPfLocation(val);
    setPfError('');
    debouncedPfSearch(val);
  };

  const selectPfLocation = async (res: LocationSearchResult) => {
    setPfLocation(res.complete_name);
    setPfLatitude(res.latitude.toFixed(4));
    setPfLongitude(res.longitude.toFixed(4));
    setPfSearchResults([]);
    setPfError('');

    setPfFetchingTz(true);
    try {
      const tzRes = await apiClient.post('/api/location/timezone', {
        latitude: res.latitude,
        longitude: res.longitude,
      });
      setPfTimezone(tzRes.data.timezone_offset.toString());
    } catch (err) {
      console.error('Timezone error', err);
    } finally {
      setPfFetchingTz(false);
    }
  };

  const handleProfileSave = async () => {
    setPfError('');
    if (!pfName) { setPfError('Name is required'); return; }
    if (!pfBirthDate) { setPfError('Birth date is required'); return; }
    if (!pfBirthTime) { setPfError('Birth time is required'); return; }
    if (!pfLatitude || !pfLongitude) { setPfError('Please select a location'); return; }

    setPfSaving(true);
    try {
      const data = {
        name: pfName,
        relation: pfRelation,
        avatar: pfAvatar,
        color: pfColor,
        birthDate: pfBirthDate,
        birthTime: pfBirthTime,
        location: pfLocation || undefined,
        latitude: parseFloat(pfLatitude),
        longitude: parseFloat(pfLongitude),
        timezone: pfTimezone || undefined,
      };
      if (editingProfile) {
        await updateProfile(editingProfile.id, data);
      } else {
        await addProfile(data);
      }
      setProfileDialog(false);
    } catch (err) {
      setPfError('Failed to save profile');
    } finally {
      setPfSaving(false);
    }
  };

  const handleProfileDelete = async (id: string) => {
    if (!confirm('Delete this profile?')) return;
    await deleteProfile(id);
  };

  return (
    <Page>
      <Navbar title="My Profile" />

      <div className="p-4 flex flex-col items-center relative">
        <div className="relative">
          <AvatarDisplay
            id={
              activeProfileId && profiles.find(p => p.id === activeProfileId)
                ? profiles.find(p => p.id === activeProfileId)!.avatar
                : undefined
            }
            color={
              activeProfileId && profiles.find(p => p.id === activeProfileId)
                ? profiles.find(p => p.id === activeProfileId)!.color
                : undefined
            }
            size="lg"
          />
          <button
            onClick={() => {
              const p = profiles.find(p => p.id === activeProfileId);
              if (p) openProfileDialog(p);
            }}
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center shadow-md border-2 border-white hover:bg-primary-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
          </button>
        </div>
        <div className="text-xl font-bold">
          {activeProfileId && profiles.find(p => p.id === activeProfileId)
            ? profiles.find(p => p.id === activeProfileId)!.name
            : storeUser?.name || 'User'}
        </div>
        <div className="text-gray-500 text-sm">
          {activeProfileId && profiles.find(p => p.id === activeProfileId)
            ? profiles.find(p => p.id === activeProfileId)!.relation
            : storeUser?.email}
        </div>
      </div>

      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-4 mb-2">
        {activeProfileId && profiles.find(p => p.id === activeProfileId)
          ? `Birth Details — ${profiles.find(p => p.id === activeProfileId)!.name}`
          : 'Edit Birth Details'}
      </h2>
      <div className="space-y-4 px-4">
        <Input
          label="Birth Date"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
        <Input
          label="Birth Time"
          type="time"
          value={birthTime}
          onChange={(e) => setBirthTime(e.target.value)}
        />
        <div>
          <Input
            label="Location"
            type="text"
            placeholder="Search birthplace"
            value={location}
            onChange={(e) => handleLocationInput(e.target.value)}
          />
          {searching && <p className="text-xs text-gray-500 mt-1">Searching...</p>}
        </div>
        {searchResults.length > 0 && (
          <div className="bg-white border rounded-md shadow-lg overflow-y-auto max-h-40">
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
        <div>
          <Input
            label="Timezone (Auto-detected from the location search)"
            type="text"
            value={timezone}
            disabled
            onChange={(e) => setTimezone(e.target.value)}
          />
          {fetchingTimezone && <p className="text-xs text-gray-500 mt-1">Fetching timezone...</p>}
        </div>
      </div>

      <div className="px-4 mt-4">
        <Button size="lg" className="w-full" onClick={handleUpdate} disabled={fetchingTimezone || loading}>
          {loading ? 'Updating...' : 'Update & Recalculate'}
        </Button>
      </div>

      <div className="px-4 mt-4">
        <Button size="lg" variant="outline" className="w-full" onClick={async () => { await refreshData(); await fetchAllTransitData(true); }}>
          Sync Now
        </Button>
      </div>

      <div className="px-4 mt-2">
        <Button size="lg" variant="destructive" className="w-full" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-800">Coins</span>
            <span className="text-sm font-semibold text-primary-600">{coins} Coins</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <Button onClick={handleRedeemCoupon} disabled={redeeming || !couponCode.trim()}>
              {redeeming ? 'Redeeming...' : 'Redeem'}
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 my-6" />

      <div className="px-4 mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Family Profiles</h2>
        <Button size="sm" onClick={() => openProfileDialog()}>Add Profile</Button>
      </div>

      {profiles.length === 0 ? (
        <p className="px-4 text-sm text-gray-400">No additional profiles. Add family members to view their charts.</p>
      ) : (
        <div className="space-y-2 px-4 mb-6">
          {profiles.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                p.id === activeProfileId
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-gray-100 bg-white'
              }`}
            >
              <AvatarDisplay id={p.avatar} color={p.color} size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 text-sm">{p.name}</div>
                <div className="text-xs text-gray-400 capitalize">{p.relation}</div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setActiveProfile(p.id); fetchProfiles(); }}>Switch</Button>
                <Button size="sm" variant="ghost" onClick={() => openProfileDialog(p)}>Edit</Button>
                {profiles.length > 1 && <Button size="sm" variant="ghost" onClick={() => handleProfileDelete(p.id)}>Del</Button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="px-4 text-center text-red-500 text-sm mt-4">
          {error}
        </div>
      )}

      <Dialog open={profileDialog} onOpenChange={setProfileDialog}>
        <DialogContent title={editingProfile ? 'Edit Profile' : 'Add Profile'}>
          <div className="space-y-3 p-4">
            {pfError && (
              <div className="bg-red-50 text-red-600 text-xs rounded-lg p-2">{pfError}</div>
            )}
            <Input label="Name" value={pfName} onChange={(e) => setPfName(e.target.value)} />
            <div>
              <label className="text-xs text-gray-500 block mb-1">Relation</label>
              <select
                value={pfRelation}
                onChange={(e) => setPfRelation(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="self">Self</option>
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="friend">Friend</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-2">Avatar</label>
              <AvatarPicker avatar={pfAvatar} color={pfColor} onAvatarChange={setPfAvatar} onColorChange={setPfColor} />
            </div>
            <Input label="Birth Date" type="date" value={pfBirthDate} onChange={(e) => setPfBirthDate(e.target.value)} />
            <Input label="Birth Time" type="time" value={pfBirthTime} onChange={(e) => setPfBirthTime(e.target.value)} />
            <div>
              <Input
                label="Location"
                placeholder="Search birthplace (e.g. Kathmandu)"
                value={pfLocation}
                onChange={(e) => handlePfLocationInput(e.target.value)}
              />
              {pfSearching && <p className="text-xs text-gray-500 mt-1">Searching...</p>}
            </div>
            {pfSearchResults.length > 0 && (
              <div className="bg-white border rounded-md shadow-lg overflow-y-auto max-h-40">
                {pfSearchResults.map((res, i) => (
                  <div
                    key={i}
                    className="p-3 border-b last:border-0 cursor-pointer hover:bg-gray-100 text-sm"
                    onClick={() => selectPfLocation(res)}
                  >
                    {res.complete_name}
                  </div>
                ))}
              </div>
            )}
            <Input label="Latitude" type="number" value={pfLatitude} disabled onChange={() => {}} />
            <Input label="Longitude" type="number" value={pfLongitude} disabled onChange={() => {}} />
            <Input label="Timezone" type="number" value={pfTimezone} disabled onChange={() => {}} />
            {pfFetchingTz && <p className="text-xs text-gray-500">Fetching timezone...</p>}
            <Button size="lg" className="w-full" onClick={handleProfileSave} disabled={pfSaving || pfSearching || pfFetchingTz}>
              {pfSaving ? 'Saving...' : editingProfile ? 'Update Profile' : 'Create Profile'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
