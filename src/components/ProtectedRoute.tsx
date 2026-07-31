import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import { LoadingPlanet } from './LoadingPlanet';
import { PageTransition } from './PageTransition';
import { useAstroStore } from '../store/astroStore';
import { useChatStore } from '../store/chatStore';

const ProtectedRoute = () => {
  const { data: session, isPending } = authClient.useSession();
  const {
    fetchAstroData,
    hydrated: astroHydrated,
    updateUser,
    user,
  } = useAstroStore();
  const { fetchConversations, hydrated: chatHydrated } = useChatStore();

  const token = session?.session?.token;
  const sessionUserId = session?.user?.id;

  useEffect(() => {
    if (token) {
      if (session.user) {
        updateUser(session.user);
      }
      if (astroHydrated) {
        // Pre-fetch astro data as soon as we have a session
        fetchAstroData(false, token);
      }
      if (chatHydrated) {
        // Pre-fetch chat history
        fetchConversations();
      }
    }
  }, [token, sessionUserId, astroHydrated, chatHydrated, fetchAstroData, fetchConversations, updateUser]);

  if (isPending) {
    return <LoadingPlanet />;
  }

  if (!session) {
    return <Navigate to='/login' replace />;
  }

  return (
    <PageTransition>
      <Outlet />
    </PageTransition>
  );
};

export default ProtectedRoute;
