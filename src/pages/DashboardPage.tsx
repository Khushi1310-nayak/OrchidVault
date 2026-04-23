import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FolderOpen, Music, Play, FileText, Settings, BookOpen } from 'lucide-react';
import { useSettings } from '../store/useSettings';
import { useFiles } from '../store/useFiles';
import { useMusic } from '../store/useMusic';
import { usePlayer } from '../store/usePlayer';
import { useActivity } from '../store/useActivity';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CountUp from 'react-countup';

function Card({ title, children, className = "" }: { title: string, children: React.ReactNode, className?: string }) {
  return (
    <motion.div layout transition={{ duration: 0.3 }} className={`glass-panel p-[var(--card-padding)] hover:scale-[1.02] transition-all duration-300 ${className}`}>
      <motion.h2 layout="position" className="text-[var(--text-primary)] text-lg font-medium mb-4">{title}</motion.h2>
      {children}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Wanderer';
  const { folders } = useFiles();
  const { albums } = useMusic();
  const { playTrack } = usePlayer();
  const { activities } = useActivity();

  const recentFiles = folders.flatMap(f => f.files).sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
  const recentAlbums = [...albums].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

  // Parse today's activity
  const todayStr = new Date().toISOString().split('T')[0];
  const todayActivity = activities.find(a => a.date === todayStr) || { studyTime: 0, musicTime: 0, filesAdded: 0 };
  
  const studyMins = Math.floor((todayActivity.studyTime || 0) / 60);
  const musicMins = Math.floor((todayActivity.musicTime || 0) / 60);
  
  // Create last 7 days chart data
  const chartData = useMemo(() => {
    const data = [];
    for(let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const act = activities.find(a => a.date === dateStr);
      data.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        study: act ? Math.floor((act.studyTime || 0) / 60) : 0,
        music: act ? Math.floor((act.musicTime || 0) / 60) : 0,
      });
    }
    return data;
  }, [activities]);

  const focusScore = Math.floor((studyMins * 2 + musicMins) * 1.5);

  return (
    <div className="max-w-6xl mx-auto space-y-[var(--grid-gap)] pb-10">
      
      {/* 🔹 A. Welcome Section */}
      <motion.header 
        layout
        transition={{ duration: 0.3 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-[var(--grid-gap)] gap-4 md:gap-0"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 text-center sm:text-left">
          <div className="w-16 h-16 shrink-0 rounded-full flex items-center justify-center text-[var(--text-primary)] text-2xl font-serif shadow-[0_0_20px_var(--shadow-color)] ring-2 ring-[var(--border)] overflow-hidden" 
               style={{ background: `linear-gradient(to top right, var(--bg-primary), var(--accent))` }}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            ) : (
              <span>{userName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-serif text-[var(--text-primary)] mb-2">Welcome back, {userName} 🌙</h2>
            <p className="text-[var(--text-secondary)]">Everything you need. Nothing that distracts.</p>
          </div>
        </div>
        <Link to="/settings" className="hidden md:flex p-3 bg-[var(--card-bg)] border border-[var(--border)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all">
          <Settings size={20} />
        </Link>
      </motion.header>

      {/* 🔹 B. Quick Access Cards */}
      <motion.div 
        layout
        transition={{ duration: 0.3 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-[var(--grid-gap)]"
      >
        {/* 1. Recent Files */}
        <Card title="Recent Files 📁">
          <div className="space-y-[calc(var(--list-padding)*0.5)]">
            {recentFiles.length === 0 ? (
              <div className="text-center py-6 text-[var(--text-secondary)] opacity-70">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p>No files uploaded yet.</p>
              </div>
            ) : (
              recentFiles.map(file => (
                <motion.div layout transition={{ duration: 0.3 }} key={file.id} className="flex items-center gap-4 p-[var(--list-padding)] rounded-xl hover:bg-[var(--bg-primary)] opacity-90 cursor-pointer transition-colors group border border-transparent hover:border-[var(--accent)]/30" onClick={() => window.open(file.url, '_blank')}>
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] group-hover:scale-110 transition-transform">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[var(--text-primary)] text-sm font-medium truncate">{file.name}</h4>
                    <p className="text-xs text-[var(--text-secondary)] opacity-80">Added {new Date(file.createdAt).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </Card>

        {/* 2. Recent Albums */}
        <Card title="Recent Albums 🎧">
          <div className="space-y-[calc(var(--list-padding)*0.5)]">
            {recentAlbums.length === 0 ? (
              <div className="text-center py-6 text-[var(--text-secondary)] opacity-70">
                <Music size={40} className="mx-auto mb-3 opacity-30" />
                <p>No albums created yet.</p>
              </div>
            ) : (
              recentAlbums.map((album) => (
                <Link to="/music" state={{ activeAlbumId: album.id }} key={album.id}>
                  <motion.div layout transition={{ duration: 0.3 }} className="flex items-center gap-4 p-[var(--list-padding)] rounded-xl hover:bg-[var(--bg-primary)] opacity-90 cursor-pointer transition-colors group border border-transparent hover:border-[var(--accent)]/30">
                    <div className="w-10 h-10 shrink-0 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center border border-[var(--border)] relative overflow-hidden group-hover:scale-110 transition-transform shadow-sm">
                      {album.coverUrl ? (
                         <img src={album.coverUrl} className="w-full h-full object-cover" alt="cover" />
                      ) : (
                        <Music size={16} className="text-[var(--text-secondary)] opacity-50" />
                      )}
                      
                      {album.tracks[0] && (
                        <div 
                          className="absolute inset-0 bg-[var(--accent)]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.preventDefault(); playTrack(album.tracks, 0); }}
                        >
                          <Play size={16} className="text-white ml-0.5" fill="currentColor" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[var(--text-primary)] text-sm font-medium truncate">{album.name}</h4>
                      <p className="text-xs text-[var(--text-secondary)] opacity-80 truncate">{album.tracks.length} tracks</p>
                    </div>
                  </motion.div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </motion.div>
      
      {/* Workspace Activity UI */}
      <motion.div
        layout
        transition={{ duration: 0.3 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card title="Workspace Activity 📊" className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-[var(--accent)]/5 blur-3xl rounded-full pointer-events-none group-hover:bg-[var(--accent)]/10 transition-colors duration-1000"></div>
          
          <div className="flex flex-col lg:flex-row gap-6 relative z-10">
            {/* Main Graph (Hero) */}
            <div className="flex-1 min-w-0">
               <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorMusic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--text-primary)" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="var(--text-primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}m`} />
                      <Tooltip 
                         contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', backdropFilter: 'blur(10px)', color: 'var(--text-primary)' }}
                         itemStyle={{ color: 'var(--text-primary)' }}
                      />
                      <Area type="monotone" dataKey="music" stroke="var(--text-primary)" fillOpacity={1} fill="url(#colorMusic)" strokeWidth={2} />
                      <Area type="monotone" dataKey="study" stroke="var(--accent)" fillOpacity={1} fill="url(#colorStudy)" strokeWidth={3} activeDot={{ r: 6, fill: 'var(--accent)', stroke: 'var(--bg-primary)', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Secondary Metrics */}
            <div className="w-full lg:w-64 shrink-0 flex flex-col gap-3">
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm">
                 <div className="flex items-center gap-2 text-[var(--accent)] mb-1">
                   <BookOpen size={16} />
                   <span className="text-xs font-medium uppercase tracking-wider">Study Time Today</span>
                 </div>
                 <div className="text-2xl font-serif text-[var(--text-primary)]">
                   <CountUp end={studyMins} duration={2} separator="," /> <span className="text-sm font-sans text-[var(--text-secondary)]">min</span>
                 </div>
              </div>
              
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm">
                 <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
                   <Music size={16} />
                   <span className="text-xs font-medium uppercase tracking-wider">Music Time</span>
                 </div>
                 <div className="text-2xl font-serif text-[var(--text-primary)]">
                   <CountUp end={musicMins} duration={2} separator="," /> <span className="text-sm font-sans text-[var(--text-secondary)]">min</span>
                 </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 shadow-sm relative overflow-hidden group/score">
                 <div className="absolute right-[-10px] top-[-10px] text-[var(--accent)]/20 group-hover/score:scale-110 transition-transform duration-500">
                    🌟
                 </div>
                 <div className="flex items-center gap-2 text-[var(--accent)] mb-1 relative z-10">
                   <span className="text-xs font-medium uppercase tracking-wider">Focus Score</span>
                 </div>
                 <div className="text-2xl font-serif text-[var(--text-primary)] relative z-10">
                   <CountUp end={focusScore} duration={2.5} />
                 </div>
                 <p className="text-[10px] text-[var(--text-secondary)] mt-1 opacity-80 relative z-10">Consistency factor applied</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

    </div>
  );
}
