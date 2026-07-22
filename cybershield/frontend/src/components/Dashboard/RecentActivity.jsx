export default function RecentActivity({ data = [] }) {
  return (
    <div className="activity-card">
      <h2>Recent Activity</h2>
      {data.length > 0 ? (
        data.map((item, index) => (
          <div key={index} className="activity-item">
            <h4>{item.title}</h4>
            <p>{item.time}</p>
          </div>
        ))
      ) : (
        <p className="no-activity">No recent activities available.</p>
      )}
    </div>
  );
}