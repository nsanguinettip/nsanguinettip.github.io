import React from 'react';
import { useSpring, animated, config } from 'react-spring';

const LoadingComponent = ({team}) => {
  const fadeIn = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: config.molasses,
  });

  const bounce = useSpring({
    from: { transform: 'translateY(0px)' },
    to: [
      { transform: 'translateY(-10px)' },
      { transform: 'translateY(0px)' }
    ],
    loop: true,
    config: config.wobbly,
  });

  const dots = useSpring({
    from: { opacity: 0.5, transform: 'scale(1)' },
    to: [
      { opacity: 1, transform: 'scale(1.2)' },
      { opacity: 0.5, transform: 'scale(1)' }
    ],
    loop: true,
    config: config.gentle,
  });
  
  const capitalizeTeam = (teamName) => {
    return teamName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <animated.div style={{ ...styles.container, ...fadeIn }}>
      <animated.div style={bounce}>
        <h2 style={styles.title}>Loading {capitalizeTeam(team)} Promoters Data</h2>      </animated.div>
      <p style={styles.subtitle}>Preparing your dashboard with stellar insights...</p>
      <div style={styles.dotsContainer}>
        {[0, 1, 2].map((i) => (
          <animated.div
            key={i}
            style={{
              ...styles.dot,
              ...dots,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </animated.div>
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
    color: '#4a90e2',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#2c3e50',
    marginBottom: '20px',
  },
  dotsContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#4a90e2',
    margin: '0 5px',
    animationDuration: '1s',
    animationIterationCount: 'infinite',
  },
};

export default LoadingComponent;