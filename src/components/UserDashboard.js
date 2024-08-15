import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell, Legend} from 'recharts';
import { Link, Star, ChevronDown } from 'lucide-react';

const CustomSelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);

  const handleKeyDown = (e) => {
    const currentIndex = options.findIndex(option => option.value === value);
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prevIndex) => 
            prevIndex < options.length - 1 ? prevIndex + 1 : prevIndex
          );
        } else if (currentIndex < options.length - 1) {
          onChange(options[currentIndex + 1].value);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex((prevIndex) => 
            prevIndex > 0 ? prevIndex - 1 : 0
          );
        } else if (currentIndex > 0) {
          onChange(options[currentIndex - 1].value);
        }
        break;
      case 'Enter':
        if (isOpen && highlightedIndex !== -1) {
          onChange(options[highlightedIndex].value);
          setIsOpen(false);
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, highlightedIndex]);

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="inline-flex justify-center w-64 rounded-full border border-gray-300 shadow-sm px-4 py-2 bg-white text-xl font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
        >
          {value}
          <ChevronDown className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      {isOpen && (
        <div
          ref={dropdownRef}
          className="origin-top-right absolute right-0 mt-2 w-64 rounded-2xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 overflow-hidden z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          <div className="py-1 max-h-80 overflow-y-auto" role="none">
            {options.map((option, index) => (
              <a
                key={option.value}
                href="#"
                className={`block px-4 py-2 text-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${
                  index === highlightedIndex ? 'bg-gray-100' : ''
                }`}
                role="menuitem"
                data-index={index}
                onClick={(e) => {
                  e.preventDefault();
                  onChange(option.value);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const UserDashboard = ({ data, includeFollowing }) => {
  const sortedUsers = useMemo(() => {
    return data.users.map(user => ({
      value: user,
      label: `${user} (${data.processedUserData[user].userRank})`,
      rank: data.processedUserData[user].userRank
    })).sort((a, b) => a.rank - b.rank);
  }, [data]);

  const [selectedUser, setSelectedUser] = useState(sortedUsers[0]?.value || '');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = sortedUsers.findIndex(user => user.value === selectedUser);
        if (e.key === 'ArrowUp' && currentIndex > 0) {
          setSelectedUser(sortedUsers[currentIndex - 1].value);
        } else if (e.key === 'ArrowDown' && currentIndex < sortedUsers.length - 1) {
          setSelectedUser(sortedUsers[currentIndex + 1].value);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedUser, sortedUsers]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const metrics = data.processedUserData[selectedUser];
  const detailedContacts = useMemo(() => {
    return (data.detailedData[selectedUser] || [])
      .sort((a, b) => new Date(b.date_created) - new Date(a.date_created))
      .slice(0, 200);
  }, [data.detailedData, selectedUser]);

  const hourlyContactsByType = useMemo(() => {
    const hourlyData = {};
    const daysWithData = {};
  
    data.detailedData[selectedUser].forEach(contact => {
      const date = new Date(contact.date_created);
      const hour = (date.getHours()) % 24;
      const dayKey = date.toISOString().split('T')[0];
  
      if (!hourlyData[hour]) {
        hourlyData[hour] = { hour, Follow: 0, Comment: 0 };
        daysWithData[hour] = new Set();
      }
      hourlyData[hour][contact.origin_type]++;
      daysWithData[hour].add(dayKey);
    });
  
    return Object.entries(hourlyData).map(([hour, data]) => {
      const daysCount = daysWithData[hour].size;
      return {
        ...data,
        hour: `${hour}:00`,
        Follow: (data.Follow / daysCount).toFixed(2),
        Comment: (data.Comment / daysCount).toFixed(2),
        total: ((data.Follow + data.Comment) / daysCount).toFixed(2)
      };
    });
  }, [data.detailedData, selectedUser]);

  const weeklyContactsByType = useMemo(() => {
    const weeklyData = {
      Monday: { day: 'Monday', Follow: 0, Comment: 0 },
      Tuesday: { day: 'Tuesday', Follow: 0, Comment: 0 },
      Wednesday: { day: 'Wednesday', Follow: 0, Comment: 0 },
      Thursday: { day: 'Thursday', Follow: 0, Comment: 0 },
      Friday: { day: 'Friday', Follow: 0, Comment: 0 },
      Saturday: { day: 'Saturday', Follow: 0, Comment: 0 },
      Sunday: { day: 'Sunday', Follow: 0, Comment: 0 },
    };
    data.detailedData[selectedUser].forEach(contact => {
      const day = new Date(contact.date_created).toLocaleString('en-US', { weekday: 'long' });
      weeklyData[day][contact.origin_type]++;
    });
    return Object.values(weeklyData).map(data => ({
      ...data,
      total: data.Follow + data.Comment
    }));
  }, [data.detailedData, selectedUser]);

  if (!metrics) {
    return <div style={styles.loadingContainer}>No data available for selected user</div>;
  }

  
  const renderStarRating = (percentile, rank) => {
    const starCount = Math.round(percentile / 20);
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            size={20}
            fill={index < starCount ? "#FFD700" : "none"}
            stroke="#FFD700"
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">TOP {rank}</span>
      </div>
    );
  };

  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const daysUntilToday = Math.floor((today - firstDayOfMonth) / (24 * 60 * 60 * 1000)) + 1;

  const today_contacts = new Date().toISOString().split('T')[0];
  const contactsMadeToday = (data.dailyData[selectedUser] && data.dailyData[selectedUser][today_contacts]) || 0;

  
  const historicalContacts = Array.from({ length: daysUntilToday }, (_, index) => {
    const date = new Date(firstDayOfMonth);
    date.setDate(date.getDate() + index);
    const dateString = date.toISOString().split('T')[0];
    return {
      date: dateString,
      count: (data.dailyData[selectedUser] && data.dailyData[selectedUser][dateString]) || 0
    };
  });

  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weeklyContacts = daysOrder.map(day => ({
    day,
    count: metrics.weeklyData[day] || 0
  }));

  const weeklyColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'];

  return (
    <div style={styles.container}>
      <div className="flex flex-col items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedUser}</h2>
        {renderStarRating(parseFloat(metrics.userPercentile), metrics.userRank)}
        <div className="mt-4">
          <CustomSelect style={styles.select}
            value={selectedUser}
            onChange={setSelectedUser}
            options={sortedUsers}
          />
        </div>
      </div>
      <div style={styles.metricsContainer}>
        <MetricCard 
          title="⏰ Primera Hora de Contacto" 
          value={`${metrics.firstHour}:00`} 
          subtitle="Primer contacto del día"
        />
        <MetricCard 
          title="🔝 Hora Pico de Actividad" 
          value={`${metrics.peakHour}:00`} 
          subtitle="Hora con más contactos"
        />
        <MetricCard 
          title="📊 Contactos Hoy" 
          value={contactsMadeToday} 
          subtitle="Contactos realizados hoy"
        />
        <MetricCard 
          title="📅 Contactos Últimos 30 Días" 
          value={metrics.weeklyTotals} 
          subtitle="Total de contactos"
        />
        <MetricCard 
          title="🎯 Consistencia Semanal" 
          value={`${metrics.consistencyScore}%`} 
          subtitle="Regularidad en los contactos"
        />
        <MetricCard 
          title="📈 Contactos por Hora" 
          value={metrics.contactsPerHour} 
          subtitle="Promedio realizado por hora"
        />
      </div>
      <div style={styles.chartContainer}>
        <h3 style={styles.chartTitle}>Contactos Históricos (Este mes)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={historicalContacts}  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#82ca9d">
              {
                historicalContacts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.count < 200 ? '#FF4500' : '#82ca9d'} />
                ))
              }
              <LabelList dataKey="count" position="top" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={styles.chartContainer}>
        <h3 style={styles.chartTitle}>Promedio de Contactos por Hora</h3>
        <ResponsiveContainer width="100%" height={400} >
          <BarChart data={hourlyContactsByType} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            {includeFollowing && (
                <Bar dataKey="Follow" fill="#8884d8" stackId="a" />
              )}
            <Bar dataKey="Comment" fill="#82ca9d" stackId="a">
              <LabelList dataKey="total" position="top" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={styles.flexContainer}>
        <div style={styles.flexItem}>
          <h3 style={styles.chartTitle}>Contactos por Día de la Semana (Últimos 30 Días)</h3>
          <ResponsiveContainer width="100%" height={400} >
            <BarChart data={weeklyContactsByType} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              {includeFollowing && (
                <Bar dataKey="Follow" fill="#8884d8" stackId="a" />
              )}
              <Bar dataKey="Comment" fill="#82ca9d" stackId="a">
                <LabelList dataKey="total" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={styles.flexItem2}>
          <h3 style={styles.chartTitle}>Detalles de Contactos (Top 200)</h3>
          <div style={styles.tableWrapper} >
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Fecha</th>
                  <th style={styles.tableHeader}>Proyecto</th>
                  <th style={styles.tableHeader}>Tipo</th>
                  <th style={styles.tableHeader}>Enlace</th>
                </tr>
              </thead>
              <tbody>
                {detailedContacts.map((contact) => (
                  <tr key={contact.id}>
                    <td style={styles.tableCell}>{formatDate(contact.date_created)}</td>
                    <td style={styles.tableCell}>{contact.project_username}</td>
                    <td style={styles.tableCell}>{contact.origin_type}</td>
                    <td style={styles.tableCell}>
                      <a 
                        href={contact.origin_type === 'Follow' 
                          ? `https://www.x.com/${contact.project_username}` 
                          : `https://www.x.com/${selectedUser}/status/${contact.id}`
                        } 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Link size={20} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, subtitle }) => (
  <div style={styles.metricCard}>
    <h3 style={styles.metricTitle}>{title}</h3>
    <p style={styles.metricValue}>{value}</p>
    <p style={styles.metricSubtitle}>{subtitle}</p>
  </div>
);


const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    backgroundColor: '#f0f2f5',
    borderRadius: '10px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  mainTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
  },
  subtitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#4a4a4a',
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
  metricsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
    height: '150px', // Increased height to accommodate subtitle
  },
  metricSubtitle: {
    fontSize: '12px',
    color: '#E2E3EB',
    marginTop: '5px',
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
  chartContainer: {
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
  flexContainer: {
    display: 'flex',
    gap: '20px',

    marginBottom: '20px',
  },
  flexItem: {
    flex: 1,
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  flexItem2: {
    flex: 1,
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  tableWrapper: {
    overflowX: 'auto',
    maxHeight: '400px',
    overflowY: 'auto',
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
    zIndex: 10,
  },
  tableCell: {
    padding: '12px',
    borderBottom: '1px solid #dee2e6',
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  userRating: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  starRating: {
    display: 'flex',
    alignItems: 'center',
  },
  percentile: {
    marginLeft: '5px',
    fontSize: '14px',
    color: '#666',
  },
  selectWrapper: {
    position: 'relative',
    display: 'inline-block',
    minWidth: '200px',
  },

};

export default UserDashboard;