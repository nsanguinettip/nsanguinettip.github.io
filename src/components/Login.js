import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import users from '../users.json';

const Login = ({ setAuth, intendedPath }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
  
    const handleSubmit = (e) => {
      e.preventDefault();
      const user = users.users.find(
        (user) => user.username === username && user.password === password
      );
  
      if (user) {
        setAuth({ isAuthenticated: true, username: user.username, teams: user.teams });
        
        if (intendedPath && user.teams.includes(intendedPath.split('/')[2])) {
          navigate(intendedPath);
        } else if (user.teams.length > 1) {
          navigate('/select-team');
        } else if (user.teams.length === 1) {
          navigate(`/dashboard/${user.teams[0]}`);
        } else {
          setError('User has no assigned teams');
        }
      } else {
        setError('Invalid username or password');
      }
    };
  
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Login</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Login</button>
        </form>
        {error && <p style={styles.error}>{error}</p>}
      </div>
    );
  };
  

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#4a90e2',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '300px',
  },
  input: {
    margin: '10px 0',
    padding: '10px',
    fontSize: '16px',
    borderRadius: '5px',
    border: '1px solid #ccc',
  },
  button: {
    margin: '10px 0',
    padding: '10px',
    fontSize: '16px',
    backgroundColor: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  error: {
    color: 'red',
    marginTop: '10px',
  },
};

export default Login;