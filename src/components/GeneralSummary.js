import React from 'react';
import { Pie, Cell, PieChart, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';

const GeneralSummary = ({ data = {} , includeFollowing}) => {
  const calculateGeneralMetrics = () => {
    const { users, weeklyData, hourlyData, detailedData } = data;

    const totalContacts = users.reduce((sum, user) => sum + (detailedData[user]?.length || 0), 0);
    const averageContactsPerUser = users.length > 0 ? totalContacts / users.length : 0;

    let globalFirstContactHour = 24;
    let totalWorkingHours = 0;

    const contactsByDate = {};
    let mostActiveDate = { date: null, count: 0 };

    let globalHourlyData = Array(24).fill().map(() => ({ Follow: 0, Comment: 0, total: 0 }));

    users.forEach(user => {
      const userDetailedData = detailedData[user] || [];

      // Aggregate hourly data across all users
      userDetailedData.forEach(contact => {
        const hour = new Date(contact.date_created).getHours();
        globalHourlyData[hour][contact.origin_type]++;
        globalHourlyData[hour].total++;
      });


      // Aggregate contacts by date
      userDetailedData.forEach(contact => {
        const date = new Date(contact.date_created).toISOString().split('T')[0];
        contactsByDate[date] = (contactsByDate[date] || 0) + 1;
        if (contactsByDate[date] > mostActiveDate.count) {
          mostActiveDate = { date, count: contactsByDate[date] };
        }
      });
    });

    // Find the global peak activity hour
    let globalPeakActivityHour = 0;
    let maxPeakActivityCount = 0;

    Object.entries(globalHourlyData).forEach(([hour, data]) => {
      if (data.total > maxPeakActivityCount) {
        globalPeakActivityHour = Number(hour);
        maxPeakActivityCount = data.total;
      }
    });

    const averageContactsPerHour = totalWorkingHours > 0 ? totalContacts / totalWorkingHours : 0;
    const uniqueDays = Object.keys(contactsByDate).length;
    const averageContactsPerDay = uniqueDays > 0 ? totalContacts / uniqueDays : 0;

    const contactsByAccount = users.reduce((acc, user) => {
      acc[user] = detailedData[user]?.length || 0;
      return acc;
    }, {});

    const userRanking = Object.entries(contactsByAccount)
      .sort(([, a], [, b]) => b - a)
      .map(([username, contacts], index) => ({ rank: index + 1, username, contacts }));
    
    const contactsByHour = Array(24).fill(0);
    Object.entries(globalHourlyData).forEach(([hour, data]) => {
      contactsByHour[Number(hour)] = data.total;
    });

    return {
      totalContacts,
      averageContactsPerUser,
      mostActiveDate: mostActiveDate.date,
      averageContactsPerHour,
      averageContactsPerDay,
      globalFirstContactHour,
      globalPeakActivityHour,
      totalUsers: users.length,
      contactsByDate,
      contactsByAccount,
      userRanking,
      contactsByHour: globalHourlyData
    };
  };

  const generalMetrics = calculateGeneralMetrics();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  const formatHour = (hour) => {
    return `${((hour)%24).toString().padStart(2, '0')}:00`;
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const hourlyContactsData = generalMetrics.contactsByHour.map((data, hour) => ({
    hour: formatHour(hour),
    Follow: data.Follow,
    Comment: data.Comment,
    total: data.total
  }));

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>General Summary</h2>
      <div style={styles.metricsContainer}>
        <MetricCard 
          title="🌅 Global Work Start Time" 
          value={formatHour(generalMetrics.globalFirstContactHour)}
          subtext="Earliest activity across all users"
        />
        <MetricCard 
          title="🌟 Global Peak Activity Hour" 
          value={formatHour(generalMetrics.globalPeakActivityHour)}
          subtext="Busiest hour across all users"
        />
        <MetricCard 
          title="📞 Total Contacts" 
          value={generalMetrics.totalContacts.toLocaleString()} 
          subtext="Last 30 days"
        />
        <MetricCard 
          title="👥 Average Contacts per User" 
          value={generalMetrics.averageContactsPerUser.toFixed(2)} 
          subtext="Based on last 30 days"
        />
        <MetricCard 
          title="📅 Most Active Date" 
          value={formatDate(generalMetrics.mostActiveDate)} 
          subtext="Highest contact volume"
        />
        <MetricCard 
          title="⏰ Avg Contacts per Hour" 
          value={generalMetrics.averageContactsPerHour.toFixed(2)} 
          subtext="During active hours"
        />
      </div>
      <div style={styles.chartsRow}>
        <div style={styles.chartContainer}>
          <h3 style={styles.chartTitle}>Total Contacts by Date</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={Object.entries(generalMetrics.contactsByDate)
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => new Date(a.date) - new Date(b.date))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => formatDate(date)}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis />
              <Tooltip labelFormatter={(date) => formatDate(date)} />
              <Bar dataKey="count" fill="#8884d8">
                <LabelList dataKey="count" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.rankingContainer}>
          <h3 style={styles.chartTitle}>User Ranking</h3>
          <div style={styles.rankingList}>
            {generalMetrics.userRanking.map((user, index) => (
              <div key={user.username} style={{...styles.rankingCard, ...(index < 3 ? styles.topThree : {})}}>
                <div style={styles.rankBadge}>
                  {index < 3 ? 
                    <span style={styles.medal}>{['🥇', '🥈', '🥉'][index]}</span> : 
                    <span>{user.rank}</span>
                  }
                </div>
                <div style={styles.userInfo}>
                  <div style={styles.username}>{user.username}</div>
                  <div style={styles.contactCount}>{user.contacts} contacts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={styles.chartContainerSquare}>
        <h3 style={styles.chartTitle}>Contacts by Hour of Day (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={450}>
          <BarChart data={hourlyContactsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            {includeFollowing && (
            <Bar dataKey="Follow" stackId="a" fill="#8884d8" name="Follow">
              <LabelList dataKey="Follow" position="inside" fill="#FFFFFF" />
            </Bar>
            )}
            <Bar dataKey="Comment" stackId="a" fill="#82ca9d" name="Comment">
              <LabelList dataKey="Comment" position="inside" fill="#FFFFFF" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subtext }) => (
  <div style={styles.metricCard}>
    <h3 style={styles.metricTitle}>{title}</h3>
    <p style={styles.metricValue}>{value}</p>
    <p style={styles.metricSubtext}>{subtext}</p>
  </div>
);

const styles = {
  container: {
    padding: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
  },
  metricsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  metricCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    backgroundColor: '#007bff',
    color: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '140px',
  },
  metricTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#E2E3EB',
    marginBottom: '5px',
    textAlign: 'right',
  },
  metricSubtext: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  chartContainer: {
    flex: '1',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  chartContainerSquare: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#333',
  },
  tableContainer: {
    flex: '1',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflowY: 'auto',
    maxHeight: '375px',
  },
  tableWrapper: {
    overflowY: 'auto',
    maxHeight: '300px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #dee2e6',
    color: '#495057',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  tableCell: {
    padding: '12px',
    borderBottom: '1px solid #dee2e6',
  },
  chartsRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
  },
  rankingContainer: {
    flex: 1,
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflowY: 'auto',
    maxHeight: '375px',
  },
  rankingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  rankingCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa',
    transition: 'all 0.3s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
  },
  topThree: {
    backgroundColor: '#e3f2fd',
    borderLeft: '4px solid #2196f3',
  },
  rankBadge: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
    marginRight: '15px',
  },
  medal: {
    fontSize: '24px',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontWeight: 'bold',
    fontSize: '28px',
    color: '#333',
  },
  contactCount: {
    fontSize: '18px',
    color: '#666',
  },
};

export default GeneralSummary;
