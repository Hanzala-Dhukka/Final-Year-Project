import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Tooltip, Badge } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { getChallengeCalendar } from '../api/api';

const { Title, Text } = Typography;

const ProgressCalendar = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState([]);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchCalendar();
  }, [userId]);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const response = await getChallengeCalendar(userId);
      setCalendarData(response.days || []);
      setStatistics(response.statistics || {});
    } catch (error) {
      console.error('Error fetching calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get color based on completion
  const getDayColor = (completed) => {
    return completed ? '#52c41a' : '#f5f5f5';
  };

  // Get current month's days
  const getDaysInMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayData = calendarData.find(d => d.date === dateStr);
      days.push({
        date: dateStr,
        day: i,
        completed: dayData ? dayData.completed : false
      });
    }
    return days;
  };

  if (loading) {
    return (
      <Card style={{ textAlign: 'center' }}>
        <Spin tip="Loading calendar..." />
      </Card>
    );
  }

  const days = getDaysInMonth();
  const today = new Date();
  const monthName = today.toLocaleString('default', { month: 'long' });

  return (
    <Card>
      <Title level={4}>
        <CalendarOutlined /> Challenge Progress - {monthName}
      </Title>
      
      {statistics && (
        <div style={{ marginBottom: 16 }}>
          <Text>Completion Rate: </Text>
          <Text strong style={{ color: '#52c41a' }}>
            {statistics.completion_rate}%
          </Text>
          <Text> ({statistics.completed_days}/{statistics.total_days} days) </Text>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: 8,
        marginTop: 16
      }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{ textAlign: 'center', fontWeight: 'bold' }}>
            {day}
          </div>
        ))}
        
        {days.map((day) => (
          <Tooltip 
            key={day.date} 
            title={`${day.date}: ${day.completed ? 'Completed' : 'Not completed'}`}
          >
            <div
              style={{
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: getDayColor(day.completed),
                borderRadius: 4,
                cursor: 'pointer',
                border: '1px solid #d9d9d9'
              }}
            >
              <Text>{day.day}</Text>
            </div>
          </Tooltip>
        ))}
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 20, height: 20, backgroundColor: '#52c41a', borderRadius: 4 }} />
          <Text>Completed</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 20, height: 20, backgroundColor: '#f5f5f5', borderRadius: 4, border: '1px solid #d9d9d9' }} />
          <Text>Missed</Text>
        </div>
      </div>
    </Card>
  );
};

export default ProgressCalendar;