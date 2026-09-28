import React, { useState, useEffect, useMemo } from 'react';
import heroPhuketImg from './assets/images/hero_phuket_luxury_1790578287782.jpg';
import villaSanctuaryImg from './assets/images/villa_private_sanctuary_1790578302557.jpg';
import yachtCharterImg from './assets/images/yacht_andaman_charter_1790578314849.jpg';
import vipNightlifeImg from './assets/images/vip_nightlife_lounge_1790578328455.jpg';
import {
  PHUKET_PACKAGES,
  INITIAL_IBAN_POOL,
  SUPABASE_SQL_AND_CRON_BLUEPRINT,
  PhuketPackage,
  FlightOption,
  IbanAccount,
  ReservationRecord,
  SupportConversation,
  SupportChatMessage,
  generatePhuketReferenceCode,
  calculateFiveDayReminderDate,
  buildFiveDayReminderEmailTemplate,
  formatTelegramNotification,
  triggerAIBotCall,
  loadReservationsFromSupabaseStore,
  saveReservationsToSupabaseStore,
  loadFlightsFromStore,
  saveFlightsToStore,
  loadSupportConversationsFromStore,
  saveSupportConversationsToStore
} from './services/phuketAutomation';

const ADMIN_USER = 'bounce2061';
const ADMIN_PASS = '25992599Chen.';

export default function App() {
  // Theme state (Dark-mode default, high-contrast Light-mode supported)
  const [isDark, setIsDark] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Secret Admin Portal Routing & Auth State
  const [viewMode, setViewMode] = useState<'customer' | 'admin_login' | 'admin_dashboard'>('customer');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Dynamic Flight Schedule State (Editable from Admin)
  const [flights, setFlights] = useState<FlightOption[]>(() => loadFlightsFromStore());
  const [originFilter, setOriginFilter] = useState<string>('ALL');
  const [cabinFilter, setCabinFilter] = useState<string>('ALL');
  const [flightTravelDate, setFlightTravelDate] = useState<string>('2026-11-20');
  const [flightPassengers, setFlightPassengers] = useState<number>(2);
  const [selectedFlight, setSelectedFlight] = useState<FlightOption | null>(null);

  // IBAN Pool State (Simulated Supabase / Excel Sync)
  const [ibanPool, setIbanPool] = useState<IbanAccount[]>(INITIAL_IBAN_POOL);
  const [selectedIbanIndex, setSelectedIbanIndex] = useState<number>(0);

  // Reservations & Automation Logs State (Supabase Store)
  const [reservations, setReservations] = useState<ReservationRecord[]>(() =>
    loadReservationsFromSupabaseStore()
  );
  const [activeAdminTab, setActiveAdminTab] = useState<
    'reservations' | 'live_support' | 'flights_manager' | 'iban_pool' | 'cron_mail' | 'sql_code'
  >('reservations');

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [activePackage, setActivePackage] = useState<PhuketPackage>(PHUKET_PACKAGES[1]); // Default Gold
  const [includeSelectedFlight, setIncludeSelectedFlight] = useState<boolean>(false);
  const [referenceCode, setReferenceCode] = useState<string>(() => generatePhuketReferenceCode());
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [travelDate, setTravelDate] = useState<string>('2026-11-20');
  const [passengers, setPassengers] = useState<number>(2);
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastSubmittedReservation, setLastSubmittedReservation] =
    useState<ReservationRecord | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Admin Toast / Action Notification (Visible ONLY inside Admin Panel)
  const [adminToast, setAdminToast] = useState<{
    title: string;
    detail: string;
  } | null>(null);

  // New IBAN Form in Admin Pool
  const [newBankName, setNewBankName] = useState<string>('');
  const [newIbanNumber, setNewIbanNumber] = useState<string>('');

  // New Flight Form in Admin Flight Manager
  const [newFlightAirline, setNewFlightAirline] = useState<string>('Türk Hava Yolları (THY)');
  const [newFlightNo, setNewFlightNo] = useState<string>('TK 174 · Özel Sefer');
  const [newFlightOrigin, setNewFlightOrigin] = useState<string>('IST');
  const [newFlightDepTime, setNewFlightDepTime] = useState<string>('02:15');
  const [newFlightArrTime, setNewFlightArrTime] = useState<string>('15:50');
  const [newFlightPrice, setNewFlightPrice] = useState<number>(29500);

  // Real-Time Support Conversations (Shared between Customer Widget & Admin Panel)
  const [supportConversations, setSupportConversations] = useState<SupportConversation[]>(() =>
    loadSupportConversationsFromStore()
  );
  const [activeSupportConvId, setActiveSupportConvId] = useState<string>('chat-active-visitor');
  const [adminReplyInput, setAdminReplyInput] = useState<string>('');

  // Customer Live Support Widget State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [visitorNameInput, setVisitorNameInput] = useState<string>('');
  const [visitorPhoneInput, setVisitorPhoneInput] = useState<string>('');
  const [isVisitorProfileSet, setIsVisitorProfileSet] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedFlight && flights.length > 0) {
      setSelectedFlight(flights[0]);
    }
  }, [flights, selectedFlight]);

  useEffect(() => {
    saveReservationsToSupabaseStore(reservations);
  }, [reservations]);

  useEffect(() => {
    saveFlightsToStore(flights);
  }, [flights]);

  useEffect(() => {
    saveSupportConversationsToStore(supportConversations);
  }, [supportConversations]);

  // Listen for URL hash (#admin or #yonetim) or Keyboard Shortcut (Ctrl+Shift+A / Cmd+Shift+A)
  useEffect(() => {
    const checkHash = () => {
      const h = window.location.hash.toLowerCase();
      if (h === '#admin' || h === '#yonetim') {
        setViewMode(isAdminAuthenticated ? 'admin_dashboard' : 'admin_login');
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setViewMode((prev) =>
          prev === 'customer'
            ? isAdminAuthenticated
              ? 'admin_dashboard'
              : 'admin_login'
            : 'customer'
        );
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdminAuthenticated]);

  const filteredFlights = useMemo(() => {
    return flights.filter((flt) => {
      const matchOrigin = originFilter === 'ALL' || flt.originCode === originFilter;
      const matchCabin = cabinFilter === 'ALL' || flt.cabin === cabinFilter;
      return matchOrigin && matchCabin;
    });
  }, [flights, originFilter, cabinFilter]);

  const activeIban = ibanPool[selectedIbanIndex] || ibanPool[0];

  const reminderCalculation = useMemo(
    () => calculateFiveDayReminderDate(travelDate || '2026-11-20'),
    [travelDate]
  );

  const computedTotalTHB = useMemo(() => {
    const pkgCost = activePackage.priceTHB;
    const fltCost =
      includeSelectedFlight && selectedFlight ? selectedFlight.priceTHB * passengers : 0;
    return pkgCost + fltCost;
  }, [activePackage, includeSelectedFlight, selectedFlight, passengers]);

  const activeVisitorConversation = useMemo(() => {
    return (
      supportConversations.find((c) => c.id === activeSupportConvId) ||
      supportConversations[0]
    );
  }, [supportConversations, activeSupportConvId]);

  const totalUnreadChats = useMemo(() => {
    return supportConversations.reduce((acc, c) => acc + c.unreadByAdmin, 0);
  }, [supportConversations]);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (loginUsername.trim() === ADMIN_USER && loginPassword === ADMIN_PASS) {
      setIsAdminAuthenticated(true);
      setViewMode('admin_dashboard');
      setLoginPassword('');
    } else {
      setLoginError('Kullanıcı adı veya şifre hatalı. Yetkisiz erişim reddedildi.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setViewMode('customer');
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const openReservationModal = (pkg: PhuketPackage, withFlight = false) => {
    setActivePackage(pkg);
    setIncludeSelectedFlight(withFlight);
    setReferenceCode(generatePhuketReferenceCode());
    setTravelDate(flightTravelDate);
    setPassengers(flightPassengers);
    setFormError('');
    setLastSubmittedReservation(null);
    const nextIdx = (selectedIbanIndex + 1) % ibanPool.length;
    setSelectedIbanIndex(nextIdx);
    setIsBookingModalOpen(true);
  };

  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (cleanName.length < 3) {
      setFormError('Lütfen geçerli bir Ad Soyad giriniz.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setFormError('5 gün öncesi hatırlatma maili için geçerli bir e-posta adresi giriniz.');
      return;
    }
    if (cleanPhone.length < 7) {
      setFormError('VIP karşılama ve iletişim için telefon numaranızı giriniz.');
      return;
    }
    if (!travelDate) {
      setFormError('Lütfen Phuket seyahat tarihinizi seçiniz.');
      return;
    }

    setIsSubmitting(true);

    const reminderMeta = calculateFiveDayReminderDate(travelDate);
    const packageLabel = `${activePackage.name} (${activePackage.priceFormatted})`;
    const flightSummaryText =
      includeSelectedFlight && selectedFlight
        ? `${selectedFlight.flightNo} · ${selectedFlight.originCode} → HKT (${passengers} Yolcu)`
        : undefined;

    const telegramMessage = formatTelegramNotification(
      cleanName,
      activePackage.name,
      travelDate,
      referenceCode
    );

    const reminderBody = buildFiveDayReminderEmailTemplate(
      cleanName,
      referenceCode,
      activePackage.name,
      travelDate
    );

    await triggerAIBotCall({
      referenceCode,
      fullName: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      selectedPackageName: activePackage.name,
      travelDate,
      totalAmountTHB: computedTotalTHB
    });

    const newRecord: ReservationRecord = {
      id: `res-${Date.now()}`,
      referenceCode,
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      travelDate,
      reminderDate: reminderMeta.reminderIso,
      daysUntilTravel: reminderMeta.daysUntilTravel,
      selectedPackageId: activePackage.id,
      selectedPackageName: packageLabel,
      selectedFlightSummary: flightSummaryText,
      passengers,
      totalAmountTHB: computedTotalTHB,
      assignedIban: activeIban,
      specialNotes: specialNotes.trim() || undefined,
      status: 'Beklemede (Pending)',
      createdAt: new Date().toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      telegramLog: telegramMessage,
      reminderEmailStatus: 'Planlandı (-5 Gün Cron)',
      reminderEmailBody: reminderBody,
      aiCallStatus: 'Hazır (Beklemede)'
    };

    setReservations((prev) => [newRecord, ...prev]);
    setLastSubmittedReservation(newRecord);
    setIsSubmitting(false);
  };

  const handleToggleReservationStatus = (id: string) => {
    setReservations((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextStatus =
          item.status === 'Beklemede (Pending)'
            ? 'Onaylandı (Approved)'
            : 'Beklemede (Pending)';
        return { ...item, status: nextStatus };
      })
    );
  };

  const handleTriggerFiveDayEmailNow = (record: ReservationRecord) => {
    setReservations((prev) =>
      prev.map((item) =>
        item.id === record.id
          ? { ...item, reminderEmailStatus: 'Gönderildi (Tetiklendi)' }
          : item
      )
    );
    setAdminToast({
      title: `5 Gün Önce Hatırlatma Maili Gönderildi → ${record.email}`,
      detail: record.reminderEmailBody
    });
  };

  const handleManualAIBotCall = async (record: ReservationRecord) => {
    const res = await triggerAIBotCall({
      referenceCode: record.referenceCode,
      fullName: record.fullName,
      phone: record.phone,
      email: record.email,
      selectedPackageName: record.selectedPackageName,
      travelDate: record.travelDate,
      totalAmountTHB: record.totalAmountTHB
    });

    setReservations((prev) =>
      prev.map((item) =>
        item.id === record.id ? { ...item, aiCallStatus: 'AI Arama Başlatıldı' } : item
      )
    );

    setAdminToast({
      title: `Voice AI Sesli Asistan Çağrısı (${res.callSessionId}) — ${record.phone}`,
      detail: res.scriptPreview
    });
  };

  const handleAddIbanToPool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim() || !newIbanNumber.trim()) return;
    const added: IbanAccount = {
      id: `iban-${Date.now()}`,
      bankName: newBankName.trim(),
      accountHolder: 'PHUKET ROYALE TURİZM VE SEYAHAT A.Ş.',
      iban: newIbanNumber.trim(),
      currency: 'TRY',
      swiftCode: 'TR-FAST-POOL',
      branchInfo: 'Excel / Supabase Canlı Havuz Hesabı',
      source: 'Supabase iban_pool Tablosu',
      isActive: true
    };
    setIbanPool((prev) => [added, ...prev]);
    setNewBankName('');
    setNewIbanNumber('');
  };

  const handleAddCustomFlight = (e: React.FormEvent) => {
    e.preventDefault();
    const originMap: Record<string, string> = {
      IST: 'İstanbul Havalimanı',
      SAW: 'İstanbul Sabiha Gökçen',
      ESB: 'Ankara Esenboğa',
      ADB: 'İzmir Adnan Menderes'
    };
    const newFlt: FlightOption = {
      id: `flt-custom-${Date.now()}`,
      airline: newFlightAirline,
      airlineCode: newFlightNo.slice(0, 2).toUpperCase(),
      flightNo: newFlightNo,
      originCode: newFlightOrigin,
      originCity: originMap[newFlightOrigin] || 'İstanbul Havalimanı',
      destinationCode: 'HKT',
      destinationCity: 'Phuket Uluslararası Havalimanı',
      departureTime: newFlightDepTime,
      arrivalTime: newFlightArrTime,
      duration: '9s 35dk',
      stopInfo: 'Direkt / Özel Kontenjan',
      cabin: 'Economy',
      baggage: '30 kg Bagaj + 8 kg Kabin',
      priceTHB: Number(newFlightPrice) || 28500,
      dataSource: 'Admin Panelinden Eklendi'
    };
    setFlights((prev) => [newFlt, ...prev]);
    setAdminToast({
      title: 'Yeni Phuket Uçuşu Eklendi',
      detail: `${newFlt.airline} (${newFlt.flightNo}) — ${newFlt.priceTHB.toLocaleString('tr-TR')} THB`
    });
  };

  const handleUpdateFlightPrice = (flightId: string, newPrice: number) => {
    setFlights((prev) =>
      prev.map((f) => (f.id === flightId ? { ...f, priceTHB: newPrice } : f))
    );
  };

  // Customer sends message in Bottom-Right Widget -> Goes to Admin Panel + Telegram Bridge
  const handleSendCustomerChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const nowStr = new Date().toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const customerMsg: SupportChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'customer',
      senderLabel: visitorNameInput.trim() || 'Misafir',
      text: trimmed,
      time: nowStr
    };

    const autoSystemMsg: SupportChatMessage = {
      id: `msg-sys-${Date.now() + 1}`,
      sender: 'system',
      senderLabel: 'Sistem',
      text: 'Müşteri temsilcimiz (Türkçe Destek) birazdan sizinle ilgilenecektir.',
      time: nowStr
    };

    setSupportConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== activeSupportConvId) return conv;
        const hasSystemAlready = conv.messages.some((m) => m.sender === 'system');
        return {
          ...conv,
          customerName: visitorNameInput.trim() || conv.customerName,
          customerPhone: visitorPhoneInput.trim() || conv.customerPhone,
          status: 'Yanıt Bekliyor',
          lastUpdated: nowStr,
          unreadByAdmin: conv.unreadByAdmin + 1,
          messages: hasSystemAlready
            ? [...conv.messages, customerMsg]
            : [...conv.messages, customerMsg, autoSystemMsg]
        };
      })
    );

    setChatInput('');
  };

  // Admin replies from Admin Panel -> Instantly appears in Customer's Bottom-Right Chat Widget!
  const handleSendAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = adminReplyInput.trim();
    if (!trimmed) return;

    const nowStr = new Date().toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const adminMsg: SupportChatMessage = {
      id: `msg-adm-${Date.now()}`,
      sender: 'admin',
      senderLabel: 'Phuket Royale Uzmanı (Canlı)',
      text: trimmed,
      time: nowStr
    };

    setSupportConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== activeSupportConvId) return conv;
        return {
          ...conv,
          status: 'Yanıtlandı',
          lastUpdated: nowStr,
          unreadByAdmin: 0,
          messages: [...conv.messages, adminMsg]
        };
      })
    );

    setAdminReplyInput('');
    setAdminToast({
      title: 'Canlı Destek Yanıtınız Müşteri Ekranına İletildi',
      detail: `"${trimmed}" mesajı müşterinin sohbet penceresinde anında görüntülendi.`
    });
  };

  // ============================================================================
  // VIEW 1: SECRET ADMIN LOGIN SCREEN (Only shown when triggered via lock/hash/shortcut)
  // ============================================================================
  if (viewMode === 'admin_login') {
    return (
      <div className="min-h-screen bg-[#070B12] text-[#F4F5F7] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0D1320] p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <div className="text-xs font-semibold text-[#D4AF37]">
                Phuket Royale · Gizli Yönetim Kapısı
              </div>
              <h1 className="text-xl font-bold text-white mt-0.5">
                Yönetici &amp; Otomasyon Girişi
              </h1>
            </div>
            <button
              type="button"
              onClick={() => {
                setViewMode('customer');
                if (window.location.hash) {
                  window.history.replaceState(null, '', window.location.pathname);
                }
              }}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white text-xs"
            >
              Siteye Dön
            </button>
          </div>

          <form onSubmit={handleAdminLoginSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Yönetici Kullanıcı Adı
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Kullanıcı adınızı giriniz"
                className="w-full rounded-xl border border-white/15 bg-[#070B12] px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Yönetici Şifresi
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-white/15 bg-[#070B12] px-4 py-3 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            {loginError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                <i className="fa-solid fa-circle-exclamation mr-1.5" />
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-bold text-[#070B12] hover:bg-[#e5c247] transition-colors"
            >
              <i className="fa-solid fa-lock-open mr-2" />
              Yönetici Paneline Giriş Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: DEDICATED ADMIN & AUTOMATION PAGE (Invisible to regular visitors)
  // ============================================================================
  if (viewMode === 'admin_dashboard' && isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070B12] text-[#F4F5F7] overflow-x-hidden">
        {/* Admin Top Navigation Bar */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0D1320]/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#D4AF37]">
                <i className="fa-solid fa-shield-halved" />
              </span>
              <div>
                <div className="text-base sm:text-lg font-bold text-white leading-tight">
                  Phuket Royale — Özel Yönetici &amp; Otomasyon Paneli
                </div>
                <div className="text-xs text-[#10B981]">
                  Aktif Yönetici: <span className="font-mono">{ADMIN_USER}</span> · Müşteri Sitesinde Gizli
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setViewMode('customer')}
                className="rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <i className="fa-solid fa-eye mr-1.5 text-[#D4AF37]" />
                Müşteri Sitesini Önizle
              </button>
              <button
                type="button"
                onClick={handleAdminLogout}
                className="rounded-lg bg-red-500/20 border border-red-500/40 px-3.5 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/30 transition-colors"
              >
                <i className="fa-solid fa-right-from-bracket mr-1.5" />
                Güvenli Çıkış
              </button>
            </div>
          </div>
        </header>

        {/* Admin Notification Toast */}
        {adminToast && (
          <div className="border-b border-[#10B981]/40 bg-[#0D1F1B] px-4 sm:px-6 py-3.5">
            <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-[#10B981]">{adminToast.title}</div>
                <div className="font-mono text-xs text-slate-200 mt-0.5 break-all">
                  {adminToast.detail}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminToast(null)}
                className="text-xs text-slate-400 hover:text-white shrink-0"
              >
                Kapat
              </button>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-[1320px] px-4 sm:px-6 py-8">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-white/10 bg-[#0D1320] p-4">
              <div className="text-xs text-slate-400">Toplam Rezervasyon</div>
              <div className="mt-1 font-mono text-2xl font-bold text-[#D4AF37] tabular-nums">
                {reservations.length} Kayıt
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0D1320] p-4">
              <div className="text-xs text-slate-400">Onay Bekleyen Ödeme</div>
              <div className="mt-1 font-mono text-2xl font-bold text-amber-400 tabular-nums">
                {reservations.filter((r) => r.status === 'Beklemede (Pending)').length} Beklemede
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0D1320] p-4">
              <div className="text-xs text-slate-400">Canlı Destek Mesajları</div>
              <div className="mt-1 font-mono text-2xl font-bold text-[#10B981] tabular-nums">
                {activeVisitorConversation.messages.length} Mesaj
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0D1320] p-4">
              <div className="text-xs text-slate-400">Aktif IBAN Havuzu</div>
              <div className="mt-1 font-mono text-2xl font-bold text-white tabular-nums">
                {ibanPool.length} Banka
              </div>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-[#0D1320] p-1.5 mb-8">
            <button
              type="button"
              onClick={() => setActiveAdminTab('reservations')}
              className={`rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                activeAdminTab === 'reservations'
                  ? 'bg-[#D4AF37] text-[#070B12]'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <i className="fa-solid fa-clipboard-check mr-1.5" />
              Rezervasyon &amp; Ödeme Onay ({reservations.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveAdminTab('live_support');
                setSupportConversations((prev) =>
                  prev.map((c) => ({ ...c, unreadByAdmin: 0 }))
                );
              }}
              className={`rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                activeAdminTab === 'live_support'
                  ? 'bg-[#10B981] text-[#070B12]'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <i className="fa-solid fa-comments mr-1.5" />
              Canlı Destek Yanıtla
              {totalUnreadChats > 0 && (
                <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                  {totalUnreadChats} Yeni
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminTab('flights_manager')}
              className={`rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                activeAdminTab === 'flights_manager'
                  ? 'bg-[#D4AF37] text-[#070B12]'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <i className="fa-solid fa-plane mr-1.5" />
              Uçuş Saatleri &amp; Fiyatlar ({flights.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminTab('iban_pool')}
              className={`rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                activeAdminTab === 'iban_pool'
                  ? 'bg-[#D4AF37] text-[#070B12]'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <i className="fa-solid fa-building-columns mr-1.5" />
              Dinamik IBAN Havuzu ({ibanPool.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminTab('cron_mail')}
              className={`rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                activeAdminTab === 'cron_mail'
                  ? 'bg-[#D4AF37] text-[#070B12]'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <i className="fa-solid fa-envelope-open-text mr-1.5" />5 Gün Önce Mail Kurgusu
            </button>

            <button
              type="button"
              onClick={() => setActiveAdminTab('sql_code')}
              className={`rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                activeAdminTab === 'sql_code'
                  ? 'bg-[#D4AF37] text-[#070B12]'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <i className="fa-solid fa-database mr-1.5" />
              Supabase SQL &amp; Yedek HTML
            </button>
          </div>

          {/* ADMIN TAB 1: REZERVASYONLAR */}
          {activeAdminTab === 'reservations' && (
            <div className="space-y-5">
              {reservations.map((res) => {
                const isApproved = res.status === 'Onaylandı (Approved)';
                return (
                  <div
                    key={res.id}
                    className="rounded-2xl border border-white/10 bg-[#0D1320] p-5 sm:p-6"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono text-sm font-bold text-[#D4AF37] tabular-nums">
                            {res.referenceCode}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-bold text-white text-sm">{res.fullName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-300 break-all">{res.email}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-slate-300 tabular-nums">{res.phone}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                          <span className="text-[#D4AF37] font-semibold">
                            {res.selectedPackageName}
                          </span>
                          {res.selectedFlightSummary && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#10B981] font-medium">
                                {res.selectedFlightSummary}
                              </span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            Seyahat: {res.travelDate} (5 Gün Önce Mail: {res.reminderDate})
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            isApproved ? 'text-[#10B981]' : 'text-amber-400'
                          }`}
                        >
                          <i
                            className={`fa-solid ${
                              isApproved ? 'fa-circle-check' : 'fa-clock'
                            } mr-1.5`}
                          />
                          {res.status}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleReservationStatus(res.id)}
                          className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
                            isApproved
                              ? 'border border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
                              : 'bg-[#10B981] text-[#070B12] hover:bg-[#14d494]'
                          }`}
                        >
                          {isApproved ? 'Beklemeye Al' : 'Ödemeyi Onayla'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTriggerFiveDayEmailNow(res)}
                          className="rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors"
                        >
                          5 Gün Önce Mailini Tetikle
                        </button>

                        <button
                          type="button"
                          onClick={() => handleManualAIBotCall(res)}
                          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                        >
                          Voice AI Ara
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-white/10 bg-[#070B12] p-4">
                        <div className="flex items-center justify-between text-xs text-[#10B981] font-semibold mb-1.5">
                          <span>
                            <i className="fa-brands fa-telegram mr-1.5" />
                            Telegram Bot Bildirim Çıktısı
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {res.createdAt}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-slate-200 break-words leading-relaxed">
                          {res.telegramLog}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-[#070B12] p-4">
                        <div className="flex items-center justify-between text-xs text-[#D4AF37] font-semibold mb-1.5">
                          <span>
                            <i className="fa-solid fa-envelope mr-1.5" />5 Gün Önce Hatırlatma Maili ({res.reminderEmailStatus})
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            Cron: {res.reminderDate}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {res.reminderEmailBody}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ADMIN TAB 2: CANLI DESTEK YANITLAMA MERKEZİ (7/24 PHUKET UZMANI) */}
          {activeAdminTab === 'live_support' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-white/10 bg-[#0D1320] p-5 space-y-4 h-fit">
                <h3 className="text-base font-bold text-white">
                  Müşteri Sohbet Kanalları &amp; Nasıl Yanıtlanır?
                </h3>
                <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 p-4 text-xs text-slate-200 space-y-2 leading-relaxed">
                  <div className="font-bold text-[#10B981]">
                    <i className="fa-solid fa-bolt mr-1.5" />
                    1. Doğrudan Bu Panelden Canlı Cevap Yazın:
                  </div>
                  <p>
                    Sağdaki sohbet ekranından yazdığınız her cevap, müşterinin açık olan
                    <strong> &ldquo;7/24 Phuket Uzmanına Canlı Sorun&rdquo;</strong> penceresine anında düşer.
                  </p>
                  <div className="font-bold text-[#D4AF37] pt-1">
                    <i className="fa-brands fa-telegram mr-1.5" />
                    2. Telegram &amp; WhatsApp Köprüsü:
                  </div>
                  <p>
                    Müşteri mesaj yazdığında aynı zamanda Telegram Botunuza bildirim düşer.
                    Müşteri telefon numarasını bıraktıysa tek tıkla WhatsApp üzerinden de
                    devam edebilirsiniz.
                  </p>
                </div>

                <div className="space-y-2">
                  {supportConversations.map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setActiveSupportConvId(conv.id)}
                      className={`w-full rounded-xl border p-3.5 text-left transition-colors ${
                        activeSupportConvId === conv.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/15'
                          : 'border-white/10 bg-[#070B12]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>{conv.customerName}</span>
                        <span
                          className={
                            conv.status === 'Yanıt Bekliyor'
                              ? 'text-amber-400'
                              : 'text-[#10B981]'
                          }
                        >
                          {conv.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-1">
                        Tel: {conv.customerPhone} · Son: {conv.lastUpdated}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#0D1320] flex flex-col overflow-hidden">
                <div className="border-b border-white/10 bg-[#070B12] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-white">
                      {activeVisitorConversation.customerName}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      İletişim: {activeVisitorConversation.customerPhone}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setAdminReplyInput(
                          'Merhaba! Phuket Royale VIP ekibinden yazıyorum. Size hangi villa paketimiz veya HKT uçuşumuz hakkında yardımcı olabilirim?'
                        )
                      }
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
                    >
                      Hazır Karşılama Şablonu Doldur
                    </button>
                  </div>
                </div>

                <div className="h-80 overflow-y-auto p-5 space-y-3 bg-[#070B12]/60">
                  {activeVisitorConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-xl p-3.5 text-xs max-w-xl ${
                        msg.sender === 'admin'
                          ? 'ml-auto bg-[#10B981] text-[#070B12] font-semibold'
                          : msg.sender === 'customer'
                          ? 'mr-auto border border-[#D4AF37]/50 bg-[#D4AF37]/15 text-white'
                          : 'mx-auto border border-white/10 bg-white/5 text-slate-300 text-center'
                      }`}
                    >
                      <div className="text-[10px] opacity-75 mb-1 font-bold">
                        {msg.senderLabel} · {msg.time}
                      </div>
                      <div className="leading-relaxed break-words">{msg.text}</div>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={handleSendAdminReply}
                  className="border-t border-white/10 bg-[#0D1320] p-4 flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="text"
                    value={adminReplyInput}
                    onChange={(e) => setAdminReplyInput(e.target.value)}
                    placeholder="Müşteriye canlı yanıtınızı yazın (Müşteri ekranına anında düşer)..."
                    className="flex-1 rounded-xl border border-white/15 bg-[#070B12] px-4 py-3 text-sm text-white focus:border-[#10B981] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#10B981] px-6 py-3 text-xs font-bold text-[#070B12] hover:bg-[#14d494] transition-colors shrink-0"
                  >
                    <i className="fa-solid fa-paper-plane mr-1.5" />
                    Müşteriye Canlı Gönder
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ADMIN TAB 3: UÇUŞ SAATLERİ VE FİYAT YÖNETİMİ */}
          {activeAdminTab === 'flights_manager' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4 text-xs text-slate-200 leading-relaxed">
                  <strong className="text-[#D4AF37]">Uçuş Verileri Nereden Geliyor?</strong> Sitedeki
                  uçuşlar gerçek <strong>THY (TK 172 İstanbul–Phuket Direkt)</strong>,{' '}
                  <strong>Qatar Airways (Doha Aktarmalı HKT)</strong> ve{' '}
                  <strong>Emirates (Dubai Aktarmalı HKT)</strong> tarifeli sefer saatlerinden
                  alınmaktadır. Fiyatları aşağıdan anlık güncelleyebilir veya yeni sefer ekleyebilirsiniz.
                </div>

                {flights.map((flt) => (
                  <div
                    key={flt.id}
                    className="rounded-xl border border-white/10 bg-[#0D1320] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#10B981]">
                        {flt.airline} · {flt.flightNo} ({flt.cabin})
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {flt.originCode} ({flt.departureTime}) → Phuket HKT ({flt.arrivalTime})
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {flt.stopInfo} · {flt.baggage}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        value={flt.priceTHB}
                        onChange={(e) =>
                          handleUpdateFlightPrice(flt.id, Number(e.target.value) || 0)
                        }
                        className="w-28 rounded-lg border border-white/15 bg-[#070B12] px-3 py-2 font-mono text-sm font-bold text-[#D4AF37] tabular-nums"
                      />
                      <span className="text-xs font-mono text-slate-400">THB</span>
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleAddCustomFlight}
                className="rounded-2xl border border-white/10 bg-[#0D1320] p-6 space-y-4 h-fit"
              >
                <h3 className="text-lg font-bold text-white">Yeni Phuket Uçuşu Ekle</h3>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Havayolu</label>
                  <input
                    type="text"
                    required
                    value={newFlightAirline}
                    onChange={(e) => setNewFlightAirline(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-[#070B12] px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Uçuş Kodu</label>
                  <input
                    type="text"
                    required
                    value={newFlightNo}
                    onChange={(e) => setNewFlightNo(e.target.value)}
                    className="w-full rounded-lg border border-white/15 bg-[#070B12] px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Kalkış</label>
                    <select
                      value={newFlightOrigin}
                      onChange={(e) => setNewFlightOrigin(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-[#070B12] px-2.5 py-2 text-xs text-white"
                    >
                      <option value="IST">IST</option>
                      <option value="SAW">SAW</option>
                      <option value="ESB">ESB</option>
                      <option value="ADB">ADB</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Kalkış Saati</label>
                    <input
                      type="text"
                      value={newFlightDepTime}
                      onChange={(e) => setNewFlightDepTime(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-[#070B12] px-2.5 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Varış Saati</label>
                    <input
                      type="text"
                      value={newFlightArrTime}
                      onChange={(e) => setNewFlightArrTime(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-[#070B12] px-2.5 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Kişi Başı Fiyat (THB)</label>
                  <input
                    type="number"
                    required
                    value={newFlightPrice}
                    onChange={(e) => setNewFlightPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/15 bg-[#070B12] px-3.5 py-2 font-mono text-sm text-[#D4AF37]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#D4AF37] py-3 text-xs font-bold text-[#070B12] hover:bg-[#e5c247]"
                >
                  Uçuş Listesine Ekle
                </button>
              </form>
            </div>
          )}

          {/* ADMIN TAB 4: DİNAMİK IBAN HAVUZU */}
          {activeAdminTab === 'iban_pool' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {ibanPool.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      selectedIbanIndex === idx
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                        : 'border-white/10 bg-[#0D1320]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-xs text-[#10B981] font-medium">
                        {item.source} · {item.branchInfo}
                      </div>
                      <div className="text-base font-bold text-white">{item.bankName}</div>
                      <div className="text-xs text-slate-300">{item.accountHolder}</div>
                      <div className="font-mono text-sm text-[#D4AF37] tabular-nums break-all pt-1">
                        {item.iban}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedIbanIndex(idx)}
                      className="rounded-lg bg-[#D4AF37] px-3.5 py-2 text-xs font-bold text-[#070B12] shrink-0"
                    >
                      {selectedIbanIndex === idx ? 'Aktif Gösterilen IBAN' : 'Varsayılan Yap'}
                    </button>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleAddIbanToPool}
                className="rounded-2xl border border-white/10 bg-[#0D1320] p-6 space-y-4 h-fit"
              >
                <h3 className="text-lg font-bold text-white">Havuza Yeni IBAN Ekle</h3>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Banka Adı</label>
                  <input
                    type="text"
                    required
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    placeholder="Örn: Akbank Kurumsal"
                    className="w-full rounded-lg border border-white/15 bg-[#070B12] px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">IBAN Numarası</label>
                  <input
                    type="text"
                    required
                    value={newIbanNumber}
                    onChange={(e) => setNewIbanNumber(e.target.value)}
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    className="w-full rounded-lg border border-white/15 bg-[#070B12] px-3.5 py-2.5 font-mono text-sm text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#10B981] py-3 text-xs font-bold text-[#070B12]"
                >
                  IBAN Havuzuna Kaydet
                </button>
              </form>
            </div>
          )}

          {/* ADMIN TAB 5: 5 GÜN ÖNCE HATIRLATMA MAİLİ ŞABLONU */}
          {activeAdminTab === 'cron_mail' && (
            <div className="rounded-2xl border border-white/10 bg-[#0D1320] p-6 sm:p-8 space-y-5">
              <div className="border-b border-white/10 pb-4">
                <div className="text-xs font-semibold text-[#10B981]">
                  Supabase pg_cron &amp; Edge Function Otomasyonu (travel_date - 5 days)
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  Otomatik 5 Gün Önce &ldquo;Her Şey Yolunda mı?&rdquo; Mail Şablonu
                </h3>
              </div>
              <div className="rounded-xl border border-[#D4AF37]/30 bg-[#070B12] p-5 space-y-3">
                <div className="text-xs text-slate-300">
                  <strong>Tetikleme Koşulu:</strong> Müşterinin seçtiği Phuket seyahat tarihine
                  tam 5 gün kala sabah 09:00&apos;da otomatik gönderilir.
                </div>
                <p className="text-sm text-white leading-relaxed">
                  &ldquo;Merhaba [Ad Soyad], Phuket maceranıza sadece 5 gün kaldı! Tatil
                  planlarınızda herhangi bir değişiklik var mı, her şey yolunda mı? VIP
                  transferiniz, villanız ve tüm detaylar sizin için hazır bekliyor. Sorularınız
                  için 7/24 Türkçe destek hattımızdan bize ulaşabilirsiniz.&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* ADMIN TAB 6: SUPABASE SQL & TEK DOSYA YEDEK */}
          {activeAdminTab === 'sql_code' && (
            <div className="rounded-2xl border border-white/10 bg-[#0D1320] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-[#D4AF37]">
                    Supabase Veritabanı Tabloları &amp; 5 Gün Önce Cron SQL Kodu
                  </div>
                  <div className="text-xs text-slate-400">
                    Kendi Supabase projenizin SQL Editor kısmına yapıştırarak tabloları ve
                    otomatik mail cron görevini kurabilirsiniz.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(SUPABASE_SQL_AND_CRON_BLUEPRINT, 'sql_blueprint')
                    }
                    className="rounded-lg bg-[#D4AF37] px-3.5 py-2 text-xs font-bold text-[#070B12]"
                  >
                    {copiedField === 'sql_blueprint' ? 'SQL Kopyalandı!' : 'SQL Kodunu Kopyala'}
                  </button>
                  <a
                    href="/phuket-vip-platform-single-file.html"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10"
                  >
                    Tek Dosya HTML Yedeğini Aç
                  </a>
                </div>
              </div>
              <pre className="overflow-x-auto rounded-xl bg-[#070B12] p-4 font-mono text-xs text-slate-200 leading-relaxed">
                {SUPABASE_SQL_AND_CRON_BLUEPRINT}
              </pre>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ============================================================================
  // VIEW 3: CUSTOMER VITRINE (Clean Sans-Serif, Mobile-Safe, High-Contrast Light/Dark Mode)
  // ============================================================================
  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#070B12] text-[#F4F5F7]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      {/* If Admin is logged in and previewing Customer Site, show a floating Admin Return Pill at top */}
      {isAdminAuthenticated && (
        <div className="bg-[#0D1F1B] border-b border-[#10B981]/40 px-4 py-2 text-xs text-white">
          <div className="mx-auto max-w-[1320px] flex items-center justify-between">
            <span>
              <i className="fa-solid fa-user-shield text-[#10B981] mr-1.5" />
              Yönetici Oturumu Açık ({ADMIN_USER}) — Şu an müşteri vitrinini önizliyorsunuz.
            </span>
            <button
              type="button"
              onClick={() => setViewMode('admin_dashboard')}
              className="rounded bg-[#10B981] px-3 py-1 font-bold text-[#070B12]"
            >
              Yönetici Paneline Dön
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          TOP BAR CONTRACT (3 Zones: Brand Wordmark | Clean Nav | Actions + Mobile Menu)
          ===================================================================== */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
          isDark
            ? 'border-white/10 bg-[#070B12]/90'
            : 'border-slate-200 bg-white/95 shadow-xs'
        }`}
      >
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-2 px-4 sm:px-6 py-3.5 sm:py-4">
          {/* Zone 1: Clean Sans-Serif Brand Wordmark */}
          <a
            href="#top"
            className={`text-xl sm:text-2xl font-extrabold tracking-tight whitespace-nowrap shrink-0 ${
              isDark ? 'text-[#D4AF37]' : 'text-[#0F172A]'
            }`}
          >
            Phuket <span className="text-[#D4AF37]">Royale</span>
          </a>

          {/* Zone 2: Clean Customer Navigation Links (No Admin/Supabase links visible!) */}
          <nav
            className={`hidden md:flex items-center gap-7 text-sm font-semibold ${
              isDark ? 'text-slate-200' : 'text-slate-700'
            }`}
          >
            <a
              href="#ucak-bileti"
              className="hover:text-[#D4AF37] transition-colors whitespace-nowrap"
            >
              Phuket Uçak Bileti
            </a>
            <a
              href="#paketler"
              className="hover:text-[#D4AF37] transition-colors whitespace-nowrap"
            >
              VIP Tatil Paketleri
            </a>
            <a
              href="#deneyimler"
              className="hover:text-[#D4AF37] transition-colors whitespace-nowrap"
            >
              Villa &amp; Yat Deneyimi
            </a>
          </nav>

          {/* Zone 3: Theme Switch & Primary Action + Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              aria-label="Tema Değiştir"
              className={`rounded-lg border px-2.5 sm:px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                isDark
                  ? 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                  : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              <i
                className={`fa-solid ${
                  isDark ? 'fa-sun text-[#D4AF37]' : 'fa-moon text-slate-800'
                } sm:mr-1.5`}
              />
              <span className="hidden sm:inline">{isDark ? 'Açık Mod' : 'Koyu Mod'}</span>
            </button>

            <button
              type="button"
              onClick={() => openReservationModal(PHUKET_PACKAGES[1], false)}
              className="rounded-lg bg-[#D4AF37] px-3 sm:px-4 py-2 text-xs font-bold text-[#070B12] hover:bg-[#e3be42] transition-colors whitespace-nowrap"
            >
              Rezervasyon Yap
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menü"
              className={`md:hidden rounded-lg border p-2 text-sm ${
                isDark
                  ? 'border-white/15 text-white'
                  : 'border-slate-300 text-slate-800'
              }`}
            >
              <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`} />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {isMobileMenuOpen && (
          <div
            className={`md:hidden border-t px-4 py-4 space-y-3 text-sm font-semibold ${
              isDark
                ? 'border-white/10 bg-[#0D1320] text-white'
                : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <a
              href="#ucak-bileti"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1.5 hover:text-[#D4AF37]"
            >
              Phuket (HKT) Uçak Bileti Ara
            </a>
            <a
              href="#paketler"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1.5 hover:text-[#D4AF37]"
            >
              Phuket VIP Tatil Paketleri
            </a>
            <a
              href="#deneyimler"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-1.5 hover:text-[#D4AF37]"
            >
              Özel Villa, Yat &amp; Gece Hayatı
            </a>
          </div>
        )}
      </header>

      {/* =====================================================================
          1. HERO SECTION (Clean Sans-Serif, Zero Mobile Overflow)
          ===================================================================== */}
      <section
        id="top"
        className="relative min-h-[560px] sm:min-h-[640px] flex items-center overflow-hidden border-b border-white/10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#070B12] via-[#0F1B29] to-[#071A17]">
          <img
            src={heroPhuketImg}
            alt="Phuket Andaman Denizi manzaralı lüks sonsuzluk havuzlu VIP villa"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover object-center opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070B12] via-[#070B12]/75 to-[#070B12]/40" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1320px] px-4 sm:px-6 py-14 sm:py-24">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm font-semibold text-[#10B981]">
              <span>Yalnızca Phuket Adasına Özel Butik Acente</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#D4AF37]">HKT VIP Havalimanı Karşılama</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-200">7/24 Türkçe Concierge</span>
            </div>

            <h1 className="mt-4 text-3xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-white leading-[1.12]">
              Phuket&apos;e mi Geliyorsunuz? Hayatınızın Tatilini Planlayalım
            </h1>

            <p className="mt-5 max-w-2xl text-sm sm:text-lg text-slate-200 leading-relaxed">
              Tüm uzmanlığımız, özel havuzlu villalarımız, VIP van filomuz, özel motor
              yatlarımız ve gece hayatı loca organizasyonlarımız yalnızca{' '}
              <strong className="text-[#D4AF37] font-bold">Phuket</strong> misafirlerimiz için
              tasarlandı.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <a
                href="#paketler"
                className="text-center rounded-xl bg-[#D4AF37] px-6 py-3.5 text-sm font-bold text-[#070B12] hover:bg-[#e5c247] transition-colors"
              >
                Phuket VIP Paketlerini İncele
              </a>
              <a
                href="#ucak-bileti"
                className="text-center rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/15 transition-colors"
              >
                Phuket (HKT) Uçak Bileti Ara
              </a>
            </div>

            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 border-t border-white/15 pt-7 text-white">
              <div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-[#D4AF37] tabular-nums">
                  %100 Phuket
                </div>
                <div className="mt-1 text-xs text-slate-300">
                  Tek Destinasyon Uzmanlığı
                </div>
              </div>
              <div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-white tabular-nums">
                  1.480+ Misafir
                </div>
                <div className="mt-1 text-xs text-slate-300">
                  Tamamlanan VIP Konaklama
                </div>
              </div>
              <div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-[#10B981] tabular-nums">
                  14 Dakika
                </div>
                <div className="mt-1 text-xs text-slate-300">
                  HKT Fast-Track VIP Çıkış
                </div>
              </div>
              <div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-white tabular-nums">
                  7/24 Türkçe
                </div>
                <div className="mt-1 text-xs text-slate-300">
                  Phuket Yerleşik Destek Ekibi
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. UÇAK BİLETİ ARAMA ALANI (High-Contrast Boarding Pass Cards in Both Light & Dark Mode)
          ===================================================================== */}
      <section
        id="ucak-bileti"
        className={`py-16 sm:py-20 border-b ${
          isDark ? 'border-white/10 bg-[#070B12]' : 'border-slate-200 bg-[#F1F5F9]'
        }`}
      >
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div
                className={`flex flex-wrap items-center gap-2 text-xs font-bold ${
                  isDark ? 'text-[#10B981]' : 'text-emerald-700'
                }`}
              >
                <span>01. Phuket Uçuş Planlama</span>
                <span aria-hidden="true">·</span>
                <span>Varış Noktası: Phuket Uluslararası Havalimanı (HKT)</span>
              </div>
              <h2
                className={`mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Phuket Özel Uçak Bileti Arama Motoru
              </h2>
            </div>
            <p
              className={`text-xs sm:text-sm max-w-md font-medium ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              THY Direkt Phuket (TK 172), Qatar Airways ve Emirates tarifeli seferlerini
              inceleyin; uçuşunuzu seçtiğiniz Phuket villa paketine tek tıkla ekleyin.
            </p>
          </div>

          {/* Search Controls Card */}
          <div
            className={`rounded-2xl border p-4 sm:p-6 ${
              isDark
                ? 'border-white/15 bg-[#0D1320]'
                : 'border-slate-300 bg-white shadow-md'
            }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {/* Kalkış */}
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-800'
                  }`}
                >
                  Kalkış Havalimanı
                </label>
                <select
                  value={originFilter}
                  onChange={(e) => setOriginFilter(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] ${
                    isDark
                      ? 'border-white/15 bg-[#070B12] text-white'
                      : 'border-slate-300 bg-slate-50 text-slate-900'
                  }`}
                >
                  <option value="ALL">Tüm Türkiye (IST / SAW / ESB / ADB)</option>
                  <option value="IST">İstanbul Havalimanı (IST)</option>
                  <option value="SAW">İstanbul Sabiha Gökçen (SAW)</option>
                  <option value="ESB">Ankara Esenboğa (ESB)</option>
                  <option value="ADB">İzmir Adnan Menderes (ADB)</option>
                </select>
              </div>

              {/* Varış (Phuket Sabit) */}
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-800'
                  }`}
                >
                  Varış Noktası (Phuket Özel)
                </label>
                <div
                  className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-bold ${
                    isDark
                      ? 'border-[#D4AF37]/50 bg-[#070B12] text-[#D4AF37]'
                      : 'border-amber-500 bg-amber-50 text-slate-900'
                  }`}
                >
                  <span className="truncate">Phuket Havalimanı (HKT)</span>
                  <i className="fa-solid fa-plane-arrival ml-2 text-[#D4AF37] shrink-0" />
                </div>
              </div>

              {/* Gidiş Tarihi */}
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-800'
                  }`}
                >
                  Seyahat Tarihi
                </label>
                <input
                  type="date"
                  value={flightTravelDate}
                  onChange={(e) => setFlightTravelDate(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-semibold tabular-nums focus:outline-none focus:border-[#D4AF37] ${
                    isDark
                      ? 'border-white/15 bg-[#070B12] text-white'
                      : 'border-slate-300 bg-slate-50 text-slate-900'
                  }`}
                />
              </div>

              {/* Kabin Sınıfı */}
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-800'
                  }`}
                >
                  Kabin Sınıfı
                </label>
                <select
                  value={cabinFilter}
                  onChange={(e) => setCabinFilter(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#D4AF37] ${
                    isDark
                      ? 'border-white/15 bg-[#070B12] text-white'
                      : 'border-slate-300 bg-slate-50 text-slate-900'
                  }`}
                >
                  <option value="ALL">Tüm Kabinler (Economy &amp; VIP)</option>
                  <option value="Economy">Economy Class</option>
                  <option value="Business Class">Business Class VIP</option>
                  <option value="First Class VIP">First Class Süit</option>
                </select>
              </div>

              {/* Yolcu Sayısı */}
              <div>
                <label
                  className={`block text-xs font-bold mb-1.5 ${
                    isDark ? 'text-slate-300' : 'text-slate-800'
                  }`}
                >
                  Yolcu Sayısı
                </label>
                <select
                  value={flightPassengers}
                  onChange={(e) => setFlightPassengers(Number(e.target.value))}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-semibold tabular-nums focus:outline-none focus:border-[#D4AF37] ${
                    isDark
                      ? 'border-white/15 bg-[#070B12] text-white'
                      : 'border-slate-300 bg-slate-50 text-slate-900'
                  }`}
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                    <option key={num} value={num}>
                      {num} Misafir ({num <= 4 ? 'Sedan Transfer' : 'VIP Van Transfer'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Boarding-Pass Style Flight Cards (High Contrast in Light & Dark Mode) */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredFlights.map((flt) => {
                const isSelected = selectedFlight?.id === flt.id;
                const totalForPassengers = flt.priceTHB * flightPassengers;
                return (
                  <div
                    key={flt.id}
                    onClick={() => setSelectedFlight(flt)}
                    className={`cursor-pointer rounded-2xl border-2 p-4 sm:p-5 transition-all ${
                      isSelected
                        ? isDark
                          ? 'border-[#D4AF37] bg-[#131C2E] shadow-lg'
                          : 'border-[#D4AF37] bg-amber-50/70 shadow-md'
                        : isDark
                        ? 'border-white/10 bg-[#070B12] hover:border-white/25'
                        : 'border-slate-300 bg-white hover:border-slate-400 shadow-xs'
                    }`}
                  >
                    {/* Top Row: Airline Logo Badge + Flight Number + Cabin Class */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-slate-200 dark:border-white/10">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-extrabold ${
                            isDark
                              ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                              : 'bg-slate-900 text-[#D4AF37]'
                          }`}
                        >
                          {flt.airlineCode}
                        </span>
                        <div>
                          <div
                            className={`text-sm font-extrabold ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {flt.airline}
                          </div>
                          <div
                            className={`font-mono text-xs font-semibold ${
                              isDark ? 'text-slate-300' : 'text-slate-700'
                            }`}
                          >
                            Sefer: {flt.flightNo}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                          flt.cabin === 'Economy'
                            ? isDark
                              ? 'bg-emerald-500/15 text-[#10B981]'
                              : 'bg-emerald-100 text-emerald-900'
                            : isDark
                            ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                            : 'bg-amber-200 text-amber-950'
                        }`}
                      >
                        {flt.cabin}
                      </span>
                    </div>

                    {/* Middle Row: Visual Timeline Departure -> Duration -> Arrival */}
                    <div className="my-4 grid grid-cols-3 items-center gap-2">
                      <div>
                        <div
                          className={`font-mono text-xl sm:text-2xl font-extrabold tabular-nums ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {flt.departureTime}
                        </div>
                        <div
                          className={`text-xs font-bold ${
                            isDark ? 'text-slate-300' : 'text-slate-800'
                          }`}
                        >
                          {flt.originCode} · {flt.originCity.split(' ')[0]}
                        </div>
                      </div>

                      <div className="text-center px-1">
                        <div
                          className={`text-[11px] font-bold tabular-nums ${
                            isDark ? 'text-[#D4AF37]' : 'text-slate-800'
                          }`}
                        >
                          {flt.duration}
                        </div>
                        <div className="relative my-1.5 flex items-center justify-center">
                          <div
                            className={`h-[2px] w-full ${
                              isDark ? 'bg-white/20' : 'bg-slate-300'
                            }`}
                          />
                          <i
                            className={`fa-solid fa-plane absolute px-1.5 text-xs ${
                              isDark
                                ? 'bg-[#070B12] text-[#10B981]'
                                : 'bg-white text-emerald-700'
                            }`}
                          />
                        </div>
                        <div
                          className={`text-[11px] font-semibold truncate ${
                            isDark ? 'text-[#10B981]' : 'text-emerald-800'
                          }`}
                        >
                          {flt.stopInfo}
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-mono text-xl sm:text-2xl font-extrabold tabular-nums ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {flt.arrivalTime}
                        </div>
                        <div
                          className={`text-xs font-bold ${
                            isDark ? 'text-[#10B981]' : 'text-emerald-800'
                          }`}
                        >
                          HKT · Phuket
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Baggage Info + Price + CTA */}
                    <div
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t pt-3.5 ${
                        isDark ? 'border-white/10' : 'border-slate-200'
                      }`}
                    >
                      <div
                        className={`text-xs font-semibold flex items-center gap-1.5 ${
                          isDark ? 'text-slate-300' : 'text-slate-800'
                        }`}
                      >
                        <i className="fa-solid fa-suitcase-rolling text-[#D4AF37]" />
                        <span>{flt.baggage}</span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-left sm:text-right">
                          <div
                            className={`font-mono text-lg sm:text-xl font-extrabold tabular-nums ${
                              isDark ? 'text-[#D4AF37]' : 'text-slate-900'
                            }`}
                          >
                            {totalForPassengers.toLocaleString('tr-TR')} THB
                          </div>
                          <div
                            className={`text-[11px] font-semibold tabular-nums ${
                              isDark ? 'text-slate-400' : 'text-slate-700'
                            }`}
                          >
                            {flightPassengers} Yolcu ({flt.priceTHB.toLocaleString('tr-TR')} THB/Kişi)
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFlight(flt);
                            openReservationModal(PHUKET_PACKAGES[1], true);
                          }}
                          className="rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-[#070B12] hover:bg-[#e5c247] transition-colors whitespace-nowrap shrink-0"
                        >
                          Pakete Ekle &amp; Al
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. PHUKET PAKET TURLARI BÖLÜMÜ (Standart, Gold, Premium VIP)
          ===================================================================== */}
      <section
        id="paketler"
        className={`py-16 sm:py-24 border-b ${
          isDark ? 'border-white/10 bg-[#090E17]' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="max-w-3xl mb-12">
            <div
              className={`flex flex-wrap items-center gap-2 text-xs font-bold ${
                isDark ? 'text-[#D4AF37]' : 'text-amber-700'
              }`}
            >
              <span>02. Phuket Özel Konaklama &amp; VIP Tur Paketleri</span>
              <span aria-hidden="true">·</span>
              <span className={isDark ? 'text-[#10B981]' : 'text-emerald-700'}>
                Her Şey Dahil Butik Planlama
              </span>
            </div>
            <h2
              className={`mt-2 text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Phuket Tatil Paketleri ve Fiyatlandırma
            </h2>
            <p
              className={`mt-3 text-sm sm:text-base font-medium leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Tüm paketlerimiz yalnızca Phuket adasındaki seçkin villalarımızı, özel HKT havalimanı
              transfer araçlarımızı ve yerleşik Türkçe concierge ekibimizi kapsar.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {PHUKET_PACKAGES.map((pkg) => {
              const isGold = pkg.isPopular;
              return (
                <div
                  key={pkg.id}
                  className={`relative flex flex-col justify-between rounded-2xl border-2 p-6 sm:p-8 transition-transform duration-200 hover:-translate-y-1 ${
                    isGold
                      ? isDark
                        ? 'border-[#D4AF37] bg-gradient-to-b from-[#D4AF37]/[0.10] to-[#0D1320]'
                        : 'border-[#D4AF37] bg-amber-50/50 shadow-lg'
                      : isDark
                      ? 'border-white/10 bg-[#0D1320]'
                      : 'border-slate-300 bg-[#F8FAFC] shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span
                        className={
                          isGold
                            ? isDark
                              ? 'text-[#D4AF37]'
                              : 'text-amber-800'
                            : isDark
                            ? 'text-[#10B981]'
                            : 'text-emerald-800'
                        }
                      >
                        {pkg.index}. {pkg.tierLabel}
                      </span>
                    </div>

                    <h3
                      className={`mt-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {pkg.name}
                    </h3>

                    <p
                      className={`mt-2 text-xs sm:text-sm font-medium leading-relaxed ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      {pkg.tagline}
                    </p>

                    <div
                      className={`mt-5 border-y py-4 ${
                        isDark ? 'border-white/10' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span
                          className={`font-mono text-3xl sm:text-4xl font-extrabold tabular-nums ${
                            isDark ? 'text-[#D4AF37]' : 'text-slate-900'
                          }`}
                        >
                          {pkg.priceFormatted}
                        </span>
                        <span
                          className={`font-mono text-xs font-semibold tabular-nums ${
                            isDark ? 'text-slate-400' : 'text-slate-700'
                          }`}
                        >
                          ({pkg.approxTRY})
                        </span>
                      </div>
                      <div
                        className={`mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        <span>{pkg.duration}</span>
                        <span aria-hidden="true">·</span>
                        <span>{pkg.capacity}</span>
                        <span aria-hidden="true">·</span>
                        <span>HKT Karşılama Dahil</span>
                      </div>
                    </div>

                    <ul className="mt-6 space-y-3.5">
                      {pkg.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs ${
                              isGold
                                ? isDark
                                  ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                                  : 'bg-amber-200 text-amber-950'
                                : isDark
                                ? 'bg-[#10B981]/15 text-[#10B981]'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            <i className={feat.icon} />
                          </span>
                          <div>
                            <div
                              className={`text-sm font-bold ${
                                isDark ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {feat.title}
                            </div>
                            <div
                              className={`text-xs mt-0.5 font-medium leading-relaxed ${
                                isDark ? 'text-slate-300' : 'text-slate-700'
                              }`}
                            >
                              {feat.detail}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-4 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => openReservationModal(pkg, false)}
                      className={`w-full rounded-xl py-3.5 px-4 text-xs font-extrabold transition-colors ${
                        isGold
                          ? 'bg-[#D4AF37] text-[#070B12] hover:bg-[#e5c247]'
                          : 'bg-[#10B981] text-[#070B12] hover:bg-[#15d396]'
                      }`}
                    >
                      Hemen Satın Al / Rezervasyon Yap
                    </button>

                    {selectedFlight && (
                      <button
                        type="button"
                        onClick={() => openReservationModal(pkg, true)}
                        className={`w-full rounded-xl border py-2.5 px-3 text-xs font-bold transition-colors truncate ${
                          isDark
                            ? 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                            : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        + {selectedFlight.originCode} → HKT Uçuşu İle Birlikte Al
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. ASYMMETRIC BENTO SHOWCASE & ATTRIBUTABLE PROOF (#deneyimler)
          ===================================================================== */}
      <section
        id="deneyimler"
        className={`py-16 sm:py-24 border-b ${
          isDark ? 'border-white/10 bg-[#070B12]' : 'border-slate-200 bg-[#F8FAFC]'
        }`}
      >
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <div className="max-w-3xl mb-10">
            <div
              className={`flex flex-wrap items-center gap-2 text-xs font-bold ${
                isDark ? 'text-[#10B981]' : 'text-emerald-700'
              }`}
            >
              <span>03. Phuket VIP Saha Operasyonu</span>
              <span aria-hidden="true">·</span>
              <span>Müstakil Villa · Özel Motor Yat · VVIP Gece Hayatı</span>
            </div>
            <h2
              className={`mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Yalnızca Phuket Misafirlerimize Özel Ayrıcalıklar
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0D1320] min-h-[340px] sm:min-h-[380px] flex flex-col justify-end p-6 sm:p-8">
              <img
                src={villaSanctuaryImg}
                alt="Phuket Özel Sonsuzluk Havuzlu Lüks Villa"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-65"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070B12] via-[#070B12]/65 to-transparent" />
              <div className="relative z-10 max-w-xl">
                <div className="text-xs font-bold text-[#D4AF37]">
                  Bang Tao · Kamala · Surin Tepeleri
                </div>
                <h3 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white">
                  Özel Havuzlu Phuket Malikaneleri &amp; Kişisel Concierge Host
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Otel kalabalığından uzakta, tamamen size ait sonsuzluk havuzlu villalarda
                  konaklayın. Premium VIP paketimizde yerli kadın veya erkek kişisel hostunuz
                  tüm Phuket programınızı anbean yönetir.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0D1320] min-h-[320px] sm:min-h-[380px] flex flex-col justify-end p-6 sm:p-7">
              <img
                src={yachtCharterImg}
                alt="Phuket Özel Motor Yat Adalar Turu"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-65"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070B12] via-[#070B12]/65 to-transparent" />
              <div className="relative z-10">
                <div className="text-xs font-bold text-[#10B981]">
                  Phi Phi · Maya Bay · Phang Nga
                </div>
                <h3 className="mt-1 text-xl sm:text-2xl font-extrabold text-white">
                  Phuket Özel Yat Charter
                </h3>
                <p className="mt-2 text-xs text-slate-200 leading-relaxed">
                  Grup teknelerine binmeden, yalnızca sizin grubunuza tahsis edilen lüks
                  motor yatla Andaman adalarını keşfedin.
                </p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0D1320] min-h-[300px] sm:min-h-[320px] flex flex-col justify-end p-6 sm:p-7">
              <img
                src={vipNightlifeImg}
                alt="Phuket VIP Gece Hayatı ve Beach Club Loca"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-65"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070B12] via-[#070B12]/65 to-transparent" />
              <div className="relative z-10">
                <div className="text-xs font-bold text-[#D4AF37]">
                  Illuzion · Catch Beach Club · Café del Mar
                </div>
                <h3 className="mt-1 text-xl sm:text-2xl font-extrabold text-white">
                  VIP Nightlife (Loca + Giriş + Alkol)
                </h3>
                <p className="mt-2 text-xs text-slate-200 leading-relaxed">
                  Sıra beklemeden VIP kapıdan giriş, sahne önü loca rezervasyonu ve premium
                  şişe ikramları Gold ve Premium paketlerimizde hazırdır.
                </p>
              </div>
            </div>

            <div
              className={`lg:col-span-2 rounded-2xl border p-6 sm:p-8 flex flex-col justify-between ${
                isDark
                  ? 'border-white/10 bg-[#0D1320]'
                  : 'border-slate-300 bg-white shadow-xs'
              }`}
            >
              <div>
                <div
                  className={`text-xs font-bold ${
                    isDark ? 'text-[#10B981]' : 'text-emerald-700'
                  }`}
                >
                  Doğrulanmış Phuket Misafir Deneyimleri · 2026 Sezonu
                </div>
                <h3
                  className={`mt-2 text-lg sm:text-2xl font-extrabold leading-snug ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  &ldquo;HKT Havalimanı kapısından villamıza, yat turundan Bangla Road VIP locamıza kadar tek bir detayla bile uğraşmadık.&rdquo;
                </h3>
                <p
                  className={`mt-3 text-xs sm:text-sm font-medium leading-relaxed ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Daha önce kendi başımıza gittiğimizde transfer ve kulüp girişlerinde ciddi
                  zaman kaybetmiştik. Phuket Royale Gold Paket ile 6 kişilik arkadaş grubumuz
                  10 kişilik VIP vanla karşılandı, seyahatten 5 gün önce gelen hatırlatma
                  mailiyle tüm loca saatlerimiz teyit edildi.
                </p>
              </div>

              <div
                className={`mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs font-semibold ${
                  isDark ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-700'
                }`}
              >
                <div>
                  <span className="font-bold text-[#D4AF37]">Mert &amp; Selin Karahan</span>
                  <span className="mx-2">·</span>
                  <span>Kurucu Ortak, Karahan Mimarlık (İstanbul)</span>
                </div>
                <div className="font-mono tabular-nums">
                  Paket: GOLD PAKET (64.900 THB)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          QUIET FOOTER (With Subtle Lock Trigger for Secret Admin Login)
          ===================================================================== */}
      <footer className="border-t border-white/10 bg-[#05080E] py-10 text-xs text-slate-400">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-base font-extrabold text-[#D4AF37]">
              Phuket Royale
            </span>
            <p className="mt-1 text-slate-400">
              Yalnızca Phuket Adasına Özel VIP Seyahat, Villa, Yat ve Uçak Bileti Platformu.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <a href="#ucak-bileti" className="hover:text-white transition-colors">
              HKT Uçak Bileti
            </a>
            <a href="#paketler" className="hover:text-white transition-colors">
              VIP Paketler
            </a>
            <a href="#deneyimler" className="hover:text-white transition-colors">
              Özel Deneyimler
            </a>
            {/* Subtle lock icon for the owner to open the secret Admin Login without exposing an Admin menu item */}
            <button
              type="button"
              onClick={() =>
                setViewMode(isAdminAuthenticated ? 'admin_dashboard' : 'admin_login')
              }
              title="Yönetici Girişi"
              className="text-slate-600 hover:text-slate-400 transition-colors"
              aria-label="Yönetici Girişi"
            >
              <i className="fa-solid fa-lock text-[11px]" />
            </button>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          ÖDEME VE REZERVASYON MODALI (MÜŞTERİ EKRANI — Mobile Responsive)
          ===================================================================== */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0D1320] p-5 sm:p-8 text-white shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#10B981]">
                  <span>Phuket VIP Rezervasyon &amp; Havale/FAST</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[#D4AF37] tabular-nums">{referenceCode}</span>
                </div>
                <h3 className="mt-1 text-xl sm:text-2xl font-extrabold">
                  {activePackage.name} — {computedTotalTHB.toLocaleString('tr-TR')} THB
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors shrink-0"
                aria-label="Kapat"
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            {lastSubmittedReservation ? (
              <div className="mt-6 space-y-5">
                <div className="rounded-xl border border-[#10B981]/50 bg-[#10B981]/10 p-5 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#10B981]">
                    <i className="fa-solid fa-circle-check text-base" />
                    <span>
                      Rezervasyon Talebiniz ve Ödeme Bildiriminiz Alındı!
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    Referans kodunuz:{' '}
                    <strong className="font-mono text-[#D4AF37]">
                      {lastSubmittedReservation.referenceCode}
                    </strong>
                    . Phuket VIP operasyon ekibimiz ödemenizi kontrol ettikten hemen sonra
                    onay belgenizi ve <strong>seyahatinizden 5 gün önce</strong> özel hatırlatma
                    bilgilendirmenizi e-posta adresinize iletecektir.
                  </p>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="rounded-xl bg-[#D4AF37] px-6 py-3 text-xs font-extrabold text-[#070B12] hover:bg-[#e5c247]"
                  >
                    Tamamla ve Kapat
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReservationSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PHUKET_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setActivePackage(pkg)}
                      className={`rounded-xl border p-2.5 text-left transition-colors ${
                        activePackage.id === pkg.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-white'
                          : 'border-white/10 bg-[#070B12] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{pkg.name}</div>
                      <div className="font-mono text-xs text-[#D4AF37] tabular-nums">
                        {pkg.priceFormatted}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Örn: Caner Erkin"
                      className="w-full rounded-xl border border-white/15 bg-[#070B12] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      E-posta Adresi *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ad.soyad@eposta.com"
                      className="w-full rounded-xl border border-white/15 bg-[#070B12] px-3.5 py-2.5 text-sm text-white focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Telefon Numarası (WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+90 532 000 00 00"
                      className="w-full rounded-xl border border-white/15 bg-[#070B12] px-3.5 py-2.5 text-sm text-white tabular-nums focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Phuket Seyahat Tarihi *
                    </label>
                    <input
                      type="date"
                      required
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#070B12] px-3.5 py-2.5 text-sm text-white tabular-nums focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                {selectedFlight && (
                  <label className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#070B12] px-4 py-3 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={includeSelectedFlight}
                        onChange={(e) => setIncludeSelectedFlight(e.target.checked)}
                        className="h-4 w-4 accent-[#D4AF37] shrink-0"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-white">
                          Seçili Phuket Uçuşunu Pakete Dahil Et ({selectedFlight.flightNo})
                        </span>
                        <span className="block text-slate-400">
                          {selectedFlight.originCity} → Phuket (HKT) · {passengers} Yolcu
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#10B981] tabular-nums">
                      +{(selectedFlight.priceTHB * passengers).toLocaleString('tr-TR')} THB
                    </span>
                  </label>
                )}

                {/* Benzersiz Referans Kodu */}
                <div className="rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-[#D4AF37]">
                        Rezervasyon Referans Kodunuz
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Havale / FAST yaparken <strong>Açıklama</strong> kısmına bu kodu yazınız.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-[#070B12] px-3 py-2 font-mono text-sm sm:text-base font-bold text-[#D4AF37] tabular-nums border border-[#D4AF37]/40">
                        {referenceCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(referenceCode, 'ref')}
                        className="rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-bold text-[#070B12] whitespace-nowrap"
                      >
                        {copiedField === 'ref' ? 'Kopyalandı' : 'Kopyala'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dinamik IBAN Gösterimi */}
                <div className="rounded-xl border border-white/15 bg-[#070B12] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#10B981]">
                      <i className="fa-solid fa-building-columns mr-1.5" />
                      Güncel Banka &amp; IBAN Bilgileri
                    </span>
                    <div className="flex flex-wrap items-center gap-1">
                      {ibanPool.map((acc, index) => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => setSelectedIbanIndex(index)}
                          className={`rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                            selectedIbanIndex === index
                              ? 'bg-[#D4AF37] text-[#070B12]'
                              : 'bg-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {acc.bankName.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block">Banka Adı:</span>
                      <span className="font-bold text-white">{activeIban.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Alıcı Hesap Sahibi:</span>
                      <span className="font-bold text-white">{activeIban.accountHolder}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/40 px-3.5 py-2.5">
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#D4AF37] tabular-nums break-all">
                      {activeIban.iban}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(activeIban.iban, 'iban')}
                      className="text-xs font-bold text-[#10B981] hover:underline whitespace-nowrap self-end sm:self-auto"
                    >
                      {copiedField === 'iban' ? 'IBAN Kopyalandı!' : 'IBAN Kopyala'}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-xs text-slate-300">
                  <i className="fa-solid fa-bell text-[#D4AF37] mr-1.5" />
                  Seyahat tarihinizden <strong>5 gün önce ({reminderCalculation.reminderDateFormatted})</strong> otomatik hazırlık ve teyit maili gönderilecektir.
                </div>

                {formError && (
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                    <i className="fa-solid fa-triangle-exclamation mr-1.5" />
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-[#10B981] py-3.5 px-5 text-sm font-extrabold text-[#070B12] hover:bg-[#14d494] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'İşleminiz Kaydediliyor...'
                  ) : (
                    <>
                      <i className="fa-solid fa-check-double mr-2" />
                      Ödemeyi Yaptım / Bildir ({computedTotalTHB.toLocaleString('tr-TR')} THB)
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          ANLIK CANLI DESTEK BALONU (WIDGET) — Sağ Alt Köşe (Mobile-Safe)
          ===================================================================== */}
      <div className="fixed bottom-4 right-4 z-40 max-w-[calc(100vw-2rem)]">
        {isChatOpen && (
          <div className="mb-3 w-[calc(100vw-2rem)] sm:w-96 rounded-2xl border border-white/15 bg-[#0D1320] text-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#070B12] px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                <div>
                  <div className="text-xs font-extrabold">
                    7/24 Phuket Uzmanına Canlı Sorun
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Türkçe Phuket Concierge Destek Hattı
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Sohbeti Kapat"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Optional Quick Name/Phone Bar so Admin knows who they are chatting with */}
            {!isVisitorProfileSet ? (
              <div className="border-b border-white/10 bg-[#070B12]/60 px-3.5 py-2.5 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={visitorNameInput}
                  onChange={(e) => setVisitorNameInput(e.target.value)}
                  placeholder="Adınız (İsteğe bağlı)"
                  className="flex-1 min-w-[110px] rounded-lg border border-white/10 bg-[#0D1320] px-2.5 py-1.5 text-[11px] text-white"
                />
                <input
                  type="tel"
                  value={visitorPhoneInput}
                  onChange={(e) => setVisitorPhoneInput(e.target.value)}
                  placeholder="Telefon / WhatsApp"
                  className="flex-1 min-w-[110px] rounded-lg border border-white/10 bg-[#0D1320] px-2.5 py-1.5 text-[11px] text-white"
                />
                <button
                  type="button"
                  onClick={() => setIsVisitorProfileSet(true)}
                  className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-[#D4AF37] hover:bg-white/15"
                >
                  Kaydet
                </button>
              </div>
            ) : null}

            <div className="h-60 overflow-y-auto p-4 space-y-3 text-xs">
              {activeVisitorConversation.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-xl p-3 leading-relaxed break-words ${
                    msg.sender === 'customer'
                      ? 'ml-6 bg-[#D4AF37] text-[#070B12] font-semibold'
                      : msg.sender === 'system'
                      ? 'border border-[#10B981]/40 bg-[#10B981]/15 text-[#10B981] font-semibold'
                      : 'mr-6 bg-white/10 text-slate-100'
                  }`}
                >
                  <div className="text-[10px] opacity-75 mb-0.5 font-bold">
                    {msg.senderLabel}
                  </div>
                  <div>{msg.text}</div>
                  <div className="mt-1 text-[10px] opacity-70 text-right">{msg.time}</div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSendCustomerChatMessage}
              className="flex items-center gap-2 border-t border-white/10 bg-[#070B12] p-3"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Phuket uzmanımıza mesajınızı yazın..."
                className="flex-1 min-w-0 rounded-xl border border-white/15 bg-[#0D1320] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#D4AF37] px-3.5 py-2 text-xs font-extrabold text-[#070B12] hover:bg-[#e5c247] whitespace-nowrap shrink-0"
              >
                Gönder
              </button>
            </form>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="flex items-center gap-2 rounded-full bg-[#10B981] px-4 sm:px-5 py-3 text-xs font-extrabold text-[#070B12] shadow-lg hover:bg-[#14d494] transition-transform duration-150 hover:scale-[1.02] whitespace-nowrap"
        >
          <i className="fa-solid fa-comments text-sm" />
          <span>7/24 Phuket Uzmanına Canlı Sorun</span>
        </button>
      </div>
    </div>
  );
}
