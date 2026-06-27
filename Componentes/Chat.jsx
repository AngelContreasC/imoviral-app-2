import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext.js';

const ADMIN_ID = 'admin-id-0000';
const ADMIN_NAME = 'Administrador INMOVIRAL';
const ADMIN_EMAIL = 'admin@inmoviral.com';

const T = {
  gold: '#A07840',
  goldHover: '#C39B5F',
  bg: '#0A0A0A',
  bgAlt: '#111110',
  bgCard: '#161614',
  bgMsg: '#1D1B18',
  bgMsgOwn: 'rgba(160,120,64,0.15)',
  text: '#F5F5F0',
  textSub: '#8A8A84',
  border: 'rgba(255,255,255,0.08)',
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

function formatMsgTime(dateStr) {
  try {
    const d = new Date(dateStr);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '';
  }
}

function formatRoomDate(dateStr) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    return d.toLocaleDateString();
  } catch {
    return '';
  }
}

function RoomItem({ room, isActive, onPress, currentUserId }) {
  const [hovered, setHovered] = useState(false);
  const otherName = currentUserId === room.comprador_id ? room.vendedor_nombre : room.comprador_nombre;

  return (
    <Pressable
      onPress={onPress}
      onMouseEnter={() => Platform.OS === 'web' && setHovered(true)}
      onMouseLeave={() => Platform.OS === 'web' && setHovered(false)}
      style={[
        s.roomItem,
        isActive && s.roomItemActive,
        hovered && !isActive && s.roomItemHover,
      ]}
    >
      {room.propiedad_imagen ? (
        <Image source={{ uri: room.propiedad_imagen }} style={s.roomThumb} />
      ) : (
        <View style={[s.roomThumb, { backgroundColor: 'rgba(160,120,64,0.15)', justifyContent: 'center', alignItems: 'center' }]}>
          <Feather name="home" size={18} color={T.gold} />
        </View>
      )}
      <View style={s.roomInfo}>
        <Text style={s.roomName} numberOfLines={1}>{otherName || 'Chat'}</Text>
        <Text style={s.roomPropTitle} numberOfLines={1}>{room.propiedad_titulo || ''}</Text>
        <Text style={s.roomLastMsg} numberOfLines={1}>{room.ultimo_mensaje || ''}</Text>
      </View>
      <Text style={s.roomDate}>{formatRoomDate(room.ultimo_mensaje_at)}</Text>
    </Pressable>
  );
}

function MessageBubble({ msg, isOwn }) {
  return (
    <View style={[s.msgRow, isOwn && s.msgRowOwn]}>
      <View style={[s.msgBubble, isOwn ? s.msgBubbleOwn : s.msgBubbleOther]}>
        {!isOwn && <Text style={s.msgSenderName}>{msg.sender_name}</Text>}
        <Text style={s.msgText}>{msg.mensaje}</Text>
        <Text style={s.msgTime}>{formatMsgTime(msg.created_at)}</Text>
      </View>
    </View>
  );
}

export default function Chat({ initialRoomId, onVolver }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  const isAdmin = user?.isAdmin || user?.id === ADMIN_ID;
  const scrollRef = useRef(null);

  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [showList, setShowList] = useState(true);

  const cargarRooms = useCallback(async () => {
    if (!user) return;
    setLoadingRooms(true);
    try {
      let query = supabase.from('chat_rooms').select('*').order('ultimo_mensaje_at', { ascending: false });
      if (!isAdmin) {
        query = query.or(`comprador_id.eq.${user.id},vendedor_id.eq.${user.id}`);
      }
      const { data, error } = await query;
      if (!error && data) setRooms(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRooms(false);
    }
  }, [user, isAdmin]);

  const cargarMensajes = useCallback(async (roomId) => {
    if (!roomId) return;
    setLoadingMsgs(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      if (!error && data) {
        setMessages(data);
        setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 100);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    cargarRooms();
  }, [cargarRooms]);

  useEffect(() => {
    if (initialRoomId && rooms.length > 0) {
      const room = rooms.find(r => r.id === initialRoomId);
      if (room) {
        setActiveRoom(room);
        cargarMensajes(room.id);
        if (!isWide) setShowList(false);
      }
    }
  }, [initialRoomId, rooms, cargarMensajes, isWide]);

  // Realtime subscription
  useEffect(() => {
    if (!activeRoom) return;
    const channel = supabase
      .channel(`room-${activeRoom.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${activeRoom.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 100);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeRoom]);

  const openRoom = (room) => {
    setActiveRoom(room);
    cargarMensajes(room.id);
    if (!isWide) setShowList(false);
  };

  const goBackToList = () => {
    setShowList(true);
    setActiveRoom(null);
    setMessages([]);
    cargarRooms();
  };

  const enviarMensaje = async () => {
    if (!newMsg.trim() || !activeRoom || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from('chat_messages').insert({
        room_id: activeRoom.id,
        sender_id: user.id,
        sender_name: user.user_metadata?.full_name || user.email || 'Usuario',
        mensaje: newMsg.trim(),
      });
      if (error) throw error;
      await supabase.from('chat_rooms').update({
        ultimo_mensaje: newMsg.trim(),
        ultimo_mensaje_at: new Date().toISOString(),
      }).eq('id', activeRoom.id);
      setNewMsg('');
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleStartAdminChat = async () => {
    try {
      const dummyPropiedad = {
        id: '00000000-0000-0000-0000-000000000000',
        titulo: 'Soporte Inmoviral',
        user_id: ADMIN_ID,
        user_name: ADMIN_NAME,
        imagenes: []
      };
      const roomId = await Chat.crearSala(dummyPropiedad, user);
      // reload rooms list
      const { data: updatedRooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('ultimo_mensaje_at', { ascending: false });
      if (!error && updatedRooms) {
        setRooms(updatedRooms);
        const room = updatedRooms.find(r => r.id === roomId);
        if (room) {
          openRoom(room);
        }
      }
    } catch(e) {
      console.error("Error starting admin chat:", e);
    }
  };

  if (!user) {
    return (
      <ScrollView style={s.page} contentContainerStyle={s.pageCenter}>
        <Feather name="lock" size={40} color={T.gold} />
        <Text style={s.emptyTitle}>{t('reviews.login_required')}</Text>
      </ScrollView>
    );
  }

  const renderRoomsList = () => (
    <View style={[s.listPanel, isWide && { width: 360, borderRightWidth: 1, borderRightColor: T.border }]}>
      <View style={s.listHeader}>
        <Text style={s.listTitle}>{t('chat.title')}</Text>
      </View>
      {loadingRooms ? (
        <View style={s.pageCenter}><ActivityIndicator color={T.gold} /></View>
      ) : rooms.length === 0 ? (
        <View style={s.pageCenter}>
          <Feather name="message-circle" size={36} color={T.textSub} style={{ marginBottom: 8 }} />
          <Text style={s.emptyText}>{t('chat.no_conversations')}</Text>
          <Pressable
            onPress={handleStartAdminChat}
            style={s.supportBtn}
          >
            <Text style={s.supportBtnText}>CHATEAR CON SOPORTE</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {rooms.map(room => (
            <RoomItem
              key={room.id}
              room={room}
              isActive={activeRoom?.id === room.id}
              onPress={() => openRoom(room)}
              currentUserId={user.id}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderChatArea = () => (
    <View style={s.chatPanel}>
      {/* Chat Header */}
      <View style={s.chatHeader}>
        {!isWide && (
          <Pressable onPress={goBackToList} style={s.chatBackBtn}>
            <Feather name="arrow-left" size={20} color={T.gold} />
          </Pressable>
        )}
        {activeRoom && (
          <View style={{ flex: 1 }}>
            <Text style={s.chatHeaderName} numberOfLines={1}>
              {user.id === activeRoom.comprador_id ? activeRoom.vendedor_nombre : activeRoom.comprador_nombre}
            </Text>
            <Text style={s.chatHeaderProp} numberOfLines={1}>{activeRoom.propiedad_titulo}</Text>
          </View>
        )}
      </View>

      {/* Messages */}
      {!activeRoom ? (
        <View style={s.pageCenter}>
          <Feather name="message-circle" size={48} color="rgba(160,120,64,0.2)" />
          <Text style={s.emptyText}>{t('chat.no_messages')}</Text>
        </View>
      ) : loadingMsgs ? (
        <View style={s.pageCenter}><ActivityIndicator color={T.gold} /></View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={s.messagesScroll}
          contentContainerStyle={s.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={s.pageCenter}>
              <Text style={s.emptyText}>{t('chat.no_messages')}</Text>
            </View>
          )}
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} isOwn={msg.sender_id === user.id} />
          ))}
        </ScrollView>
      )}

      {/* Input */}
      {activeRoom && (
        <View style={s.inputBar}>
          <TextInput
            style={s.inputField}
            placeholder={t('chat.placeholder')}
            placeholderTextColor="rgba(242,237,229,0.3)"
            value={newMsg}
            onChangeText={setNewMsg}
            onSubmitEditing={enviarMensaje}
            returnKeyType="send"
          />
          <Pressable
            style={[s.sendBtn, !newMsg.trim() && { opacity: 0.4 }]}
            onPress={enviarMensaje}
            disabled={!newMsg.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Text style={s.sendBtnText}>{t('chat.send')}</Text>
                <Feather name="send" size={14} color="#000" style={{ marginLeft: 6 }} />
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );

  // Responsive layout
  if (isWide) {
    return (
      <View style={s.splitLayout}>
        {renderRoomsList()}
        {renderChatArea()}
      </View>
    );
  }

  return (
    <View style={s.splitLayout}>
      {showList ? renderRoomsList() : renderChatArea()}
    </View>
  );
}

// Static method to create a chat room
Chat.crearSala = async (propiedad, compradorUser) => {
  const compradorId = compradorUser.id;
  const compradorNombre = compradorUser.user_metadata?.full_name || compradorUser.email || 'Comprador';
  const vendedorId = propiedad.user_id || ADMIN_ID;
  const vendedorNombre = propiedad.user_name || 'Vendedor';

  // Check if room already exists
  const { data: existing } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('propiedad_id', propiedad.id)
    .eq('comprador_id', compradorId)
    .limit(1);

  if (existing && existing.length > 0) {
    return existing[0].id;
  }

  const { data, error } = await supabase.from('chat_rooms').insert({
    propiedad_id: propiedad.id,
    propiedad_titulo: propiedad.titulo || 'Propiedad',
    propiedad_imagen: propiedad.imagenes?.[0] || null,
    comprador_id: compradorId,
    comprador_nombre: compradorNombre,
    vendedor_id: vendedorId,
    vendedor_nombre: vendedorNombre,
  }).select('id').single();

  if (error) throw error;
  return data.id;
};

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  pageCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  splitLayout: { flex: 1, flexDirection: 'row', backgroundColor: T.bg },

  // List Panel
  listPanel: { flex: 1, backgroundColor: T.bgAlt },
  listHeader: {
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  listTitle: { color: T.text, fontSize: 20, fontFamily: T.serif, fontWeight: '400' },

  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 14,
    ...Platform.select({
      web: { transition: 'background-color 0.15s ease', cursor: 'pointer' },
      default: {},
    }),
  },
  roomItemActive: { backgroundColor: 'rgba(160,120,64,0.08)', borderLeftWidth: 3, borderLeftColor: T.gold },
  roomItemHover: { backgroundColor: 'rgba(255,255,255,0.03)' },
  roomThumb: { width: 50, height: 50, borderRadius: 6, overflow: 'hidden' },
  roomInfo: { flex: 1 },
  roomName: { color: T.text, fontSize: 13, fontWeight: '600', fontFamily: T.sans, marginBottom: 2 },
  roomPropTitle: { color: T.gold, fontSize: 10, fontFamily: T.sans, letterSpacing: 1, marginBottom: 3 },
  roomLastMsg: { color: T.textSub, fontSize: 12, fontFamily: T.sans },
  roomDate: { color: T.textSub, fontSize: 10, fontFamily: T.sans },

  // Chat Panel
  chatPanel: { flex: 1, backgroundColor: T.bg },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 12,
    backgroundColor: T.bgAlt,
  },
  chatBackBtn: { padding: 8 },
  chatHeaderName: { color: T.text, fontSize: 15, fontWeight: '600', fontFamily: T.sans },
  chatHeaderProp: { color: T.gold, fontSize: 10, fontFamily: T.sans, letterSpacing: 1, marginTop: 2 },

  messagesScroll: { flex: 1 },
  messagesContent: { padding: 20, gap: 8 },

  msgRow: { flexDirection: 'row', marginBottom: 4 },
  msgRowOwn: { justifyContent: 'flex-end' },
  msgBubble: { maxWidth: '75%', padding: 14, borderRadius: 2 },
  msgBubbleOwn: { backgroundColor: T.bgMsgOwn, borderWidth: 1, borderColor: 'rgba(160,120,64,0.2)' },
  msgBubbleOther: { backgroundColor: T.bgMsg, borderWidth: 1, borderColor: T.border },
  msgSenderName: { color: T.gold, fontSize: 10, fontFamily: T.sans, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  msgText: { color: T.text, fontSize: 13, fontFamily: T.sans, lineHeight: 20 },
  msgTime: { color: T.textSub, fontSize: 9, fontFamily: T.sans, textAlign: 'right', marginTop: 6 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: T.border,
    backgroundColor: T.bgAlt,
    gap: 12,
  },
  inputField: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.15)',
    color: T.text,
    fontFamily: T.sans,
    fontSize: 13,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.gold,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  sendBtnText: { color: '#000', fontSize: 12, fontFamily: T.sans, fontWeight: '600', letterSpacing: 1 },

  emptyTitle: { color: T.text, fontSize: 16, fontFamily: T.serif, marginTop: 16 },
  emptyText: { color: T.textSub, fontSize: 13, fontFamily: T.sans, fontStyle: 'italic', textAlign: 'center' },
  supportBtn: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: T.gold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: { transition: 'all 0.25s ease', cursor: 'pointer' },
      default: {},
    }),
  },
  supportBtnText: {
    color: T.gold,
    fontFamily: T.sans,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
});
