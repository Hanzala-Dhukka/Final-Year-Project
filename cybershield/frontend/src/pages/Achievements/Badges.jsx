import { useState, useEffect } from "react";
import gamificationApi from "../../api/gamificationApi";
import XPCard from "../../components/Gamification/XPCard";
import StreakCard from "../../components/Gamification/StreakCard";
import AchievementGrid from "../../components/Gamification/AchievementGrid";
import BadgeGrid from "../../components/Gamification/BadgeGrid";
import CertificateCard from "../../components/Gamification/CertificateCard";

/**
 * Badges & Achievements view (spec Step 13/14). Uses the Module 7.5
 * gamification API to show XP, streak, badges, achievements, and certificates.
 */
export default function Badges({ onBack }) {
  const [progress, setProgress] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [badges, setBadges] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      gamificationApi.progress().catch(() => null),
      gamificationApi.achievements().catch(() => []),
      gamificationApi.badges().catch(() => []),
      gamificationApi.certificates().catch(() => []),
    ]).then(([p, a, b, c]) => {
      setProgress(p?.data || null);
      setAchievements(a?.data || []);
      setBadges(b?.data || []);
      setCertificates(c?.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const download = async (id) => {
    try {
      const r = await gamificationApi.downloadCertificate(id);
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `certificate_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert("Failed to download certificate.");
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-gray-400">Loading…</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {onBack && (
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 mb-4">← Back</button>
      )}
      <h1 className="text-3xl font-bold text-gray-900 mb-6">🎖️ Achievements & Badges</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <XPCard progress={progress} />
        <StreakCard progress={progress} />
      </div>

      <h2 className="text-xl font-semibold text-gray-800 mb-3">🏅 Badges</h2>
      <BadgeGrid badges={badges} />

      <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-3">🏆 Achievements</h2>
      <AchievementGrid achievements={achievements} />

      <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-3">📜 Certificates</h2>
      {certificates.length === 0 ? (
        <p className="text-gray-400 text-sm">No certificates yet. Complete a learning path to earn one.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {certificates.map((c) => (
            <CertificateCard key={c.certificate_id} certificate={c} onDownload={download} />
          ))}
        </div>
      )}
    </div>
  );
}
