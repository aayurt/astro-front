import React from 'react';
import { Page, Navbar, List, ListInput, Button, Block } from 'konsta/react';
import { authClient } from '../lib/auth-client';
import { useNavigate, Link } from 'react-router-dom';
import { LoadingPlanet } from '../components/LoadingPlanet';

export default function SignupPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
      });
      if (!error) {
        navigate('/onboarding');
      } else {
        setErrorMessage(error.message || 'The cosmic connection failed. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage('I am sorry, I am currently unable to access my celestial insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: (import.meta.env.VITE_FRONTEND_URL || window.location.origin) + (import.meta.env.VITE_BASE_PATH || '') + '/onboarding',
    });
  };

  return (
    <Page>
      <Navbar title="Sign Up" />
      {loading && <LoadingPlanet />}
      <Block strong>
        {errorMessage && (
          <Block className="text-red-500 text-sm text-center mb-4 italic">
            {errorMessage}
          </Block>
        )}
        <List strongIos insetIos>
          <ListInput
            label="Name"
            type="text"
            placeholder="Your name"
            value={name}
            onInput={(e) => setName(e.target.value)}
          />
          <ListInput
            label="Email"
            type="email"
            placeholder="Your email"
            value={email}
            onInput={(e) => setEmail(e.target.value)}
          />
          <ListInput
            label="Password"
            type="password"
            placeholder="Your password"
            value={password}
            onInput={(e) => setPassword(e.target.value)}
          />
        </List>
        <Block>
          <Button large onClick={handleSignup} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </Block>
        {/* <Block>
          <Button large outline onClick={handleGoogleLogin}>
            Sign up with Google
          </Button>
        </Block> */}
        <Block className="text-center">
          <Link to="/login">Already have an account? Login</Link>
        </Block>
      </Block>
    </Page>
  );
}
