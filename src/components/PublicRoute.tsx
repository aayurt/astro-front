import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import { LoadingPlanet } from './LoadingPlanet';

const PublicRoute = () => {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <LoadingPlanet />;
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
