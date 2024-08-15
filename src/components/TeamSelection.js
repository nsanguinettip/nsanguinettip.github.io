import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpring, animated } from 'react-spring';

const TeamSelection = ({ teams }) => {
  const navigate = useNavigate();

  const fadeIn = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { duration: 1000 }
  });

  const capitalizeTeam = (teamName) => {
    return teamName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  const handleTeamSelect = (team) => {
    navigate(`/dashboard/${team}`);
  };

  return (
    <animated.div style={{ ...styles.container, ...fadeIn }}>
      <h2 style={styles.title}>Select a Team</h2>
      <div style={styles.teamList}>
        {teams.map((team, index) => (
          <TeamButton
            key={team}
            team={team}
            index={index}
            onClick={() => handleTeamSelect(team)}
          />
        ))}
      </div>
    </animated.div>
  );
};

const TeamButton = ({ team, index, onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const buttonAnimation = useSpring({
    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
    boxShadow: isHovered ? '0 5px 15px rgba(0,0,0,0.3)' : '0 2px 5px rgba(0,0,0,0.1)',
    config: { tension: 300, friction: 10 }
  });

  const slideIn = useSpring({
    from: { transform: 'translateX(-50px)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
    delay: index * 100,
    config: { tension: 300, friction: 10 }
  });

  return (
    <animated.button
      onClick={onClick}
      style={{ ...styles.teamButton, ...buttonAnimation, ...slideIn }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {team}
    </animated.button>
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
    fontSize: '32px',
    marginBottom: '30px',
    color: '#4a90e2',
    fontWeight: 'bold',
    textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
  },
  teamList: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '300px',
  },
  teamButton: {
    margin: '10px 0',
    padding: '15px 30px',
    fontSize: '18px',
    fontWeight: 'bold',
    backgroundColor: '#4a90e2',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    width: '100%',
  },
};

export default TeamSelection;