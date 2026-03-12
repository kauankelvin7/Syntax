/**
 * 🛰️ HUB SOCIAL PREMIUM — Syntax Theme
 * * Network Control Center: Orquestrador de conexões e squads.
 * - Navigation: Magic Sliding Tabs com física de mola tática.
 * - Transitions: Blur-Fade Synthesis (Efeito de compilação visual).
 * - Layout: Arquitetura focada em escalabilidade social.
 */

import React, { memo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Search, Terminal, Swords, Cpu, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext-firebase';
import { useSocial } from '../../features/social/context/SocialContext';
import { useFriends } from '../../features/social/hooks/useFriends';
import { useGroups } from '../../features/social/hooks/useGroups';
import { challengeService } from '../../features/social/services/challengeService';
import { chatService } from '../../features/social/services/chatService';
import { getStreakData } from '../../services/streakService';

// Componentes Refatorados Syntax
import FriendsList from '../../features/social/components/friends/FriendsList';
import FriendRequests from '../../features/social/components/friends/FriendRequests';
import FriendSearch from '../../features/social/components/friends/FriendSearch';
import FriendProfile from '../../features/social/components/friends/FriendProfile';
import GroupList from '../../features/social/components/groups/GroupList';
import GroupCreate from '../../features/social/components/groups/GroupCreate';
import GroupChat from '../../features/social/components/groups/GroupChat';
import GroupMembers from '../../features/social/components/groups/GroupMembers';
import ChallengeInvite from '../../features/social/components/challenges/ChallengeInvite';
import NotificationBadge from '../../features/social/components/shared/NotificationBadge';

const TABS = [
  { id: 'friends', label: 'Nodes', icon: Users },
  { id: 'requests', label: 'Handshakes', icon: UserPlus },
  { id: 'search', label: 'Scanner', icon: Search },
  { id: 'groups', label: 'Squads', icon: Terminal },
];

const Amigos = memo(() => {
  const { user } = useAuth();
  const { pendingRequestsCount, startChallenge, openConversation } = useSocial();
  
  const {
    friends, pendingRequests, sentRequests, friendsStatus,
    loading: friendsLoading, sendRequest, acceptRequest,
    declineRequest, removeFriend, blockUser, searchUsers,
  } = useFriends();
  
  const { groups, loading: groupsLoading, createGroup, leaveGroup, removeMember } = useGroups();

  const [myStreakDays, setMyStreakDays] = useState(0);
  const [activeTab, setActiveTab] = useState('friends');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showChallengeInvite, setShowChallengeInvite] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState(null);
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupMembers, setShowGroupMembers] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    getStreakData(user.uid)
      .then((data) => setMyStreakDays(data?.currentStreak ?? 0))
      .catch(() => {});
  }, [user?.uid]);

  const handleOpenProfile = useCallback((friend) => {
    setSelectedFriend(friend);
    setShowProfile(true);
  }, []);

  const handleMessage = useCallback(async (friend) => {
    try {
      const convId = await chatService.getOrCreateConversation(user.uid, friend.uid, user, friend);
      openConversation(convId);
    } catch (err) {
      toast.error('Erro ao estabelecer conexão.');
    }
  }, [user, openConversation]);

  const handleChallengeOpen = useCallback((friend) => {
    setChallengeTarget(friend);
    setShowChallengeInvite(true);
  }, []);

  const handleSendChallenge = useCallback(async (friend, deck) => {
    try {
      const convId = await chatService.getOrCreateConversation(user.uid, friend.uid, user, friend);
      const challengeId = await challengeService.createChallenge(user, friend, deck, convId);
      startChallenge(challengeId);
      toast.success('Battle Request enviada!');
    } catch (err) {
      toast.error('Falha ao inicializar duelo.');
    }
  }, [user, startChallenge]);

  const handleCreateGroup = useCallback(async ({ name, description, memberIds }) => {
    try {
      await createGroup(name, description, memberIds);
    } catch (err) {
      toast.error('Falha ao criar Squad.');
    }
  }, [createGroup]);

  const handleSelectGroup = useCallback((group) => {
    setSelectedGroup(group);
  }, []);

  const handleLeaveGroup = useCallback(async () => {
    if (!selectedGroup) return;
    try {
      await leaveGroup(selectedGroup.id);
      setSelectedGroup(null);
      setShowGroupMembers(false);
      toast.success('Conexão com Squad encerrada.');
    } catch (err) {
      toast.error('Erro ao desconectar.');
    }
  }, [selectedGroup, leaveGroup]);

  const handleRemoveMember = useCallback(async (memberId) => {
    if (!selectedGroup) return;
    try {
      await removeMember(selectedGroup.id, memberId);
      toast.success('Node removido do Squad.');
    } catch (err) {
      toast.error('Falha na operação de expurgo.');
    }
  }, [selectedGroup, removeMember]);

  // Se Squad selecionado, renderiza o Terminal de Grupo
  if (selectedGroup) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-slate-950">
        <GroupChat
          group={selectedGroup}
          onBack={() => setSelectedGroup(null)}
          onShowMembers={() => setShowGroupMembers(true)}
        />
        <GroupMembers
          isOpen={showGroupMembers}
          onClose={() => setShowGroupMembers(false)}
          group={selectedGroup}
          membersData={selectedGroup?.participantsData ? Object.values(selectedGroup.participantsData) : []}
          onRemoveMember={handleRemoveMember}
          onLeaveGroup={handleLeaveGroup}
          onMessage={handleMessage}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 pb-28 lg:pb-12">
      {/* ─── Header (Network Core) ─── */}
      <div className="flex items-center gap-5 mb-10">
        <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-[0_15px_35px_rgba(79,70,229,0.25)] text-white shrink-0 border-2 border-white/20">
          <Cpu size={32} strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
            Network_Center
          </h1>
          <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-[0.2em] flex items-center gap-2">
            <Activity size={14} className="text-cyan-500 animate-pulse" />
            Manage nodes and code collaborations
          </p>
        </div>
      </div>

      {/* ─── Magic Sliding Tabs (Syntax Style) ─── */}
      <div className="flex gap-2 p-2 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-[24px] mb-10 overflow-x-auto no-scrollbar shadow-inner">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const showBadge = tab.id === 'requests' && pendingRequestsCount > 0;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex-1 flex items-center justify-center gap-3 py-3.5 px-6 rounded-[18px] text-[13px] font-black uppercase tracking-widest transition-all z-10 whitespace-nowrap min-w-[140px]
                ${isActive ? 'text-indigo-600 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-300'}
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabSyntax"
                  className="absolute inset-0 bg-white dark:bg-slate-800 rounded-[18px] shadow-lg border border-slate-200 dark:border-slate-700"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2.5">
                <Icon size={18} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-cyan-500' : 'text-current'} />
                {tab.label}
              </span>
              
              {showBadge && (
                <div className="relative z-10 ml-1 scale-90">
                  <NotificationBadge count={pendingRequestsCount} pulse />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Tab Content Viewport ─── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="min-h-[500px]"
        >
          {activeTab === 'friends' && (
            <FriendsList
              friends={friends}
              friendsStatus={friendsStatus}
              loading={friendsLoading}
              onViewProfile={handleOpenProfile}
              onMessage={handleMessage}
              onChallenge={handleChallengeOpen}
              onRemove={removeFriend}
              onNavigateSearch={() => setActiveTab('search')}
            />
          )}

          {activeTab === 'requests' && (
            <FriendRequests
              pendingRequests={pendingRequests}
              sentRequests={sentRequests}
              onAccept={acceptRequest}
              onDecline={declineRequest}
            />
          )}

          {activeTab === 'search' && (
            <FriendSearch
              onSearch={searchUsers}
              onSendRequest={sendRequest}
              sentRequests={sentRequests}
              friends={friends}
            />
          )}

          {activeTab === 'groups' && (
            <GroupList
              groups={groups}
              onSelectGroup={handleSelectGroup}
              onCreateGroup={() => setShowGroupCreate(true)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ─── Overlay Handlers (Modais) ─── */}
      <FriendProfile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        friend={selectedFriend}
        friendStatus={selectedFriend ? friendsStatus[selectedFriend.uid] : null}
        onMessage={handleMessage}
        onChallenge={handleChallengeOpen}
        onRemove={removeFriend}
        myStreak={myStreakDays}
      />

      <ChallengeInvite
        isOpen={showChallengeInvite}
        onClose={() => setShowChallengeInvite(false)}
        friend={challengeTarget}
        onSendChallenge={handleSendChallenge}
      />

      <GroupCreate
        isOpen={showGroupCreate}
        onClose={() => setShowGroupCreate(false)}
        friends={friends}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
});

Amigos.displayName = 'Amigos';
export default Amigos;