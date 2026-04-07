import { API } from '../../services/api';
import { Helmet } from 'react-helmet-async';
import { authFetch } from '../../services/authFetch';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
import { useAuthUser } from '../../hooks/useAuthUser';
import { Send } from 'lucide-react';

const DialogMessagePage = () => {
  const { user }   = useAuthUser();
  const { dialog_slug }   = useParams();
  const navigate   = useNavigate();

  const [dialog, setDialog]     = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [wsReady, setWsReady]   = useState(false);

  const wsRef       = useRef(null);
  const bottomRef   = useRef(null);
  const messagesRef = useRef(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    const fetchDialog = async () => {
      try {
        const response = await authFetch(API.dialog(dialog_slug));
        if (!response.ok) throw new Error('Диалог не найден');
        const data = await response.json();
        setDialog(data);
      } catch (err) {
        toast.error(err.message);
        navigate('/dialog');
      } finally {
        setLoading(false);
      }
    };
    fetchDialog();
  }, [dialog_slug, navigate]);

  useEffect(() => {
    if (!dialog_slug) return;
    const token = localStorage.getItem('access_token');
    const ws = new WebSocket(`${API.ws_dialog(dialog_slug)}?token=${token}`);
    wsRef.current = ws;
    let closed = false;

    ws.onopen    = () => { if (!closed) setWsReady(true); };
    ws.onmessage = (e) => {
      if (closed) return;
      const data = JSON.parse(e.data);
      if (data.type === 'history')      setMessages(data.messages);
      else if (data.type === 'message') setMessages(prev => [...prev, data]);
      else if (data.type === 'error')   toast.error(data.detail);
    };
    ws.onerror = () => toast.error('Ошибка соединения');
    ws.onclose = () => setWsReady(false);

    return () => { closed = true; ws.close(); };
  }, [dialog_slug]);

  useEffect(() => {
    if (!messagesRef.current) return;
    const el = messagesRef.current;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;

    if (prevLengthRef.current === 0 && messages.length > 0) {
      el.scrollTop = el.scrollHeight;
    } else if (messages.length > prevLengthRef.current && isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLengthRef.current = messages.length;
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !wsReady) return;
    wsRef.current.send(JSON.stringify({ type: 'message', content: text.trim() }));
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (iso) => {
    const d = new Date(iso);
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString())     return 'Сегодня';
    if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const groupedMessages = messages.reduce((acc, msg) => {
    const key = new Date(msg.created_at).toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Helmet>
        <title>{dialog.name}</title>
      </Helmet>
      <Header />
      <Toaster position="top-center" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pt-5 pb-4 flex flex-col min-h-0 gap-3">
        <button
          onClick={() => navigate('/dialog')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors shrink-0"
        >
          ← Назад к диалогам
        </button>

        {/* Шапка диалога */}
        <div className="bg-card rounded-2xl border border-border p-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
              {dialog?.image ? (
                <img
                  src={dialog.image}
                  alt={dialog.name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-primary">
                  {getInitials(dialog?.name)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">{dialog?.name}</h1>
              {dialog?.course && (
                <p className="text-muted-foreground mt-1">{dialog.course.name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${wsReady ? 'bg-green-500' : 'bg-muted-foreground'}`} />
              <span className="text-sm text-muted-foreground">{wsReady ? 'Онлайн' : 'Офлайн'}</span>
            </div>
          </div>
        </div>

        {/* Область сообщений */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col flex-1 min-h-0">

          {/* Лента сообщений */}
          <div
            ref={messagesRef}
            className="p-5 space-y-1 overflow-y-auto flex-1 min-h-0"
            style={{ overscrollBehavior: 'contain' }}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Send className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Нет сообщений. Начните общение!</p>
              </div>
            ) : (
              Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
                <div key={dateKey}>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground px-2 shrink-0">
                      {formatDate(dayMessages[0].created_at)}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {dayMessages.map((msg, idx) => {
                    const isOwn       = msg.sender_id === user?.user_id?.toString();
                    const isSameSender = dayMessages[idx - 1]?.sender_id === msg.sender_id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''} ${isSameSender ? 'mt-0.5' : 'mt-3'}`}
                      >
                        <div className="w-8 shrink-0">
                        {!isSameSender && (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-foreground overflow-hidden">
                            {msg.sender_avatar ? (
                              <img 
                                src={msg.sender_avatar} 
                                alt={msg.sender_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Если аватар не загрузился, показываем инициалы
                                  e.target.style.display = 'none';
                                  e.target.parentElement.textContent = getInitials(msg.sender_name);
                                  e.target.parentElement.classList.add('bg-muted');
                                }}
                              />
                            ) : (
                              getInitials(msg.sender_name)
                            )}
                          </div>
                        )}
                        </div>

                        <div className={`max-w-[65%] flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
                          {!isSameSender && !isOwn && (
                            <span className="text-xs text-muted-foreground px-1">{msg.sender_name}</span>
                          )}
                          <div className="flex items-end gap-1.5">
                            {isOwn && (
                              <span className="text-[11px] text-muted-foreground mb-0.5 shrink-0">
                                {formatTime(msg.created_at)}
                              </span>
                            )}
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap ${
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                : 'bg-muted text-foreground rounded-tl-sm'
                            }`}>
                              {msg.content}
                            </div>
                            {!isOwn && (
                              <span className="text-[11px] text-muted-foreground mb-0.5 shrink-0">
                                {formatTime(msg.created_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Поле ввода */}
          <div className="border-t border-border p-4">
            <div className="flex gap-3 items-end">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ваше сообщение... (Enter — отправить, Shift+Enter — перенос)"
                rows={1}
                className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none transition"
                style={{ maxHeight: 100, overflowY: 'auto' }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim() || !wsReady}
                className="bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none shrink-0"
              >
                <Send className="w-4 h-4" />
                Отправить
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DialogMessagePage;
