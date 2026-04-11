import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import { LoadingPlanet } from './LoadingPlanet';
import { PageTransition } from './PageTransition';

const PublicRoute = () => {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <LoadingPlanet />;
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PageTransition>
      <Outlet />
    </PageTransition>
  );
};

export default PublicRoute;
