import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserDashboard from './UserDashboard';
import GeneralSummary from './GeneralSummary';
import LoadingComponent from './LoadingComponent';

const Dashboard = ({ auth, setAuth }) => {
  const { team } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('user');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [includeFollowing, setIncludeFollowing] = useState(false);

  useEffect(() => {
    if (!auth.teams.includes(team)) {
      navigate('/unauthorized');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://192.168.0.17:19421/api/v1/GalaxyPromoters/optimized/?team=${team}&include_following=${includeFollowing ? 1 : 0}`);
        const apiData = await response.json();
        const processedData = processApiData(apiData);
        setData(processedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [team, auth.teams, navigate, includeFollowing]);

  const processApiData = (apiData) => {
    const processedUserData = apiData.users.reduce((acc, username) => {
      acc[username] = calculateMetrics(username, apiData);
      return acc;
    }, {});

    const generalSummaryData = calculateGeneralSummary(processedUserData, apiData);

    return { ...apiData, processedUserData, generalSummaryData };
  };

  const calculateMetrics = (username, data) => {
    const userHourlyData = data.hourlyData[username];
    const userWeeklyData = data.weeklyData[username];

    if (!userHourlyData || !userWeeklyData) {
      return null;
    }

    let totalContacts = 0;
    const uniqueHourDays = new Set();
    Object.entries(userHourlyData).forEach(([hour, data]) => {
      totalContacts += data.total;
      data.days.forEach(day => uniqueHourDays.add(`${day}-${hour}`));
    });

    const hoursWorked = uniqueHourDays.size;

    const hourlyAverages = Object.entries(userHourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      average: data.total / data.days.length
    }));
    
    const firstHour = Math.min(...hourlyAverages.map(item => item.hour));
    const peakHour = hourlyAverages.reduce((max, item) => item.average > max.average ? item : max).hour;

    const weeklyTotals = Object.values(userWeeklyData).reduce((sum, count) => sum + count, 0);

    const allUserTotals = data.users.map(user => 
      Object.values(data.weeklyData[user] || {}).reduce((sum, count) => sum + count, 0)
    );
    const sortedTotals = allUserTotals.sort((a, b) => b - a);
    const userRank = sortedTotals.indexOf(weeklyTotals) + 1;
    const userPercentile = ((data.users.length - userRank + 1) / data.users.length * 100).toFixed(2);
    const daysWithActivity = Object.values(userWeeklyData).filter(count => count > 0).length;
    const consistencyScore = (daysWithActivity / 7 * 100).toFixed(2);

    return {
      firstHour,
      hoursWorked,
      contactsPerHour: (weeklyTotals / hoursWorked).toFixed(2),
      peakHour,
      weeklyTotals,
      hourlyAverages: hourlyAverages.sort((a, b) => a.hour - b.hour),
      weeklyData: userWeeklyData,
      userPercentile,
      userRank,
      consistencyScore
    };
  };
  
  const calculateGeneralSummary = (processedUserData, initialData) => {
    const totalUsers = initialData.users.length;
    const totalContacts = Object.values(processedUserData).reduce((sum, user) => sum + user.weeklyTotals, 0);
    const averageContactsPerUser = totalContacts / totalUsers;
    
    const topPerformers = initialData.users
      .map(username => ({
        username,
        contacts: processedUserData[username].weeklyTotals
      }))
      .sort((a, b) => b.contacts - a.contacts)
      .slice(0, 5);

    const hourlyDistribution = Object.values(processedUserData).reduce((acc, user) => {
      user.hourlyAverages.forEach(({ hour, average }) => {
        if (!acc[hour]) acc[hour] = 0;
        acc[hour] += average;
      });
      return acc;
    }, {});

    const peakHour = Object.entries(hourlyDistribution)
      .reduce((max, [hour, total]) => total > max.total ? { hour, total } : max, { hour: 0, total: 0 })
      .hour;

    return {
      totalUsers,
      totalContacts,
      averageContactsPerUser,
      topPerformers,
      hourlyDistribution,
      peakHour
    };
  };


  const handleTeamChange = (newTeam) => {
    if (auth.teams.includes(newTeam)) {
      navigate(`/dashboard/${newTeam}`);
    } else {
      navigate('/unauthorized');
    }
  };

  const handleLogout = () => {
    setAuth({ isAuthenticated: false, username: '', teams: [] });
    navigate('/login');
  };

  const handleIncludeFollowingChange = (event) => {
    setIncludeFollowing(event.target.checked);
  };


  if (loading) {
    return <LoadingComponent team={team}/>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle}>Dashboard de Métricas de Influencers - {team}</h1>
      <div style={styles.controlsContainer}>
        <div style={styles.teamSelector}>
          <select 
            onChange={(e) => handleTeamChange(e.target.value)} 
            value={team}
            style={styles.select}
          >
            {auth.teams.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div style={styles.arrowIcon}></div>
        </div>
        <div style={styles.checkboxContainer}>
          <label style={styles.checkboxLabel}>
            Include Following
            <input
              type="checkbox"
              checked={includeFollowing}
              onChange={handleIncludeFollowingChange}
              style={styles.checkbox}
            />
            <span style={styles.checkmark}></span>
          </label>
        </div>
      </div>
      <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      <div style={styles.tabContainer}>
        <button
          style={activeTab === 'user' ? {...styles.tab, ...styles.activeTab} : styles.tab}
          onClick={() => setActiveTab('user')}
        >
          User Dashboard
        </button>
        <button
          style={activeTab === 'general' ? {...styles.tab, ...styles.activeTab} : styles.tab}
          onClick={() => setActiveTab('general')}
        >
          General Summary
        </button>
      </div>
      
      <div style={styles.contentContainer}>
        {activeTab === 'user' && (
          <UserDashboard data={data} includeFollowing={includeFollowing}/>
        )}
        {activeTab === 'general' && (
          <GeneralSummary data={data} includeFollowing={includeFollowing}/>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    backgroundColor: '#f0f4f8',
    borderRadius: '10px',
    color: '#2c3e50',
    minHeight: '100vh',
  },
  mainTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#4a90e2',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  controlsContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px',
  },
  teamSelector: {
    position: 'relative',
    width: '200px',
    marginRight: '20px',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#2c3e50',
    position: 'relative',
    paddingLeft: '35px',
  },
  checkbox: {
    position: 'relative',
    opacity: 10,
    right: '-5px',
    cursor: 'pointer',
    height: 20,
    width: 20,
  },
  checkmark: {
    position: 'absolute',
    top: '0',
    left: '0',
    height: '25px',
    width: '25px',
    backgroundColor: '#eee',
    
  },
  select: {
    width: '100%',
    padding: '10px 15px',
    fontSize: '24px',
    fontWeight: 'bold',
    borderRadius: '25px',
    border: '2px solid #4a90e2',
    backgroundColor: '#fff',
    color: '#2c3e50',
    appearance: 'none',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  arrowIcon: {
    content: "''",
    position: 'absolute',
    top: '50%',
    right: '15px',
    width: '0',
    height: '0',
    border: '6px solid transparent',
    borderTopColor: '#4a90e2',
    transform: 'translateY(-25%)',
    pointerEvents: 'none',
  },
  logoutButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    padding: '5px 10px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  tabContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  tab: {
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#fff',
    border: 'none',
    borderRadius: '25px',
    margin: '0 10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    color: '#2c3e50',
  },
  activeTab: {
    backgroundColor: '#4a90e2',
    color: '#fff',
  },
  contentContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  checkboxContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#2c3e50',
  },
  
};

export default Dashboard;