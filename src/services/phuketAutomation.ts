export interface PhuketPackage {
  id: 'standart' | 'gold' | 'premium';
  index: string;
  name: string;
  tierLabel: string;
  priceTHB: number;
  priceFormatted: string;
  approxTRY: string;
  duration: string;
  capacity: string;
  isPopular?: boolean;
  tagline: string;
  features: {
    icon: string;
    title: string;
    detail: string;
  }[];
}

export interface FlightOption {
  id: string;
  airline: string;
  airlineCode: string;
  flightNo: string;
  originCode: string;
  originCity: string;
  destinationCode: 'HKT';
  destinationCity: 'Phuket Uluslararası Havalimanı';
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stopInfo: string;
  cabin: 'Economy' | 'Business Class' | 'First Class VIP';
  baggage: string;
  priceTHB: number;
  dataSource: string;
}

export interface IbanAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  iban: string;
  currency: 'TRY' | 'THB' | 'USD';
  swiftCode: string;
  branchInfo: string;
  source: 'Supabase iban_pool Tablosu' | 'Excel Havuz Senkronu';
  isActive: boolean;
}

export interface ReservationRecord {
  id: string;
  referenceCode: string;
  fullName: string;
  email: string;
  phone: string;
  travelDate: string;
  reminderDate: string;
  daysUntilTravel: number;
  selectedPackageId: string;
  selectedPackageName: string;
  selectedFlightSummary?: string;
  passengers: number;
  totalAmountTHB: number;
  assignedIban: IbanAccount;
  specialNotes?: string;
  status: 'Beklemede (Pending)' | 'Onaylandı (Approved)';
  createdAt: string;
  telegramLog: string;
  reminderEmailStatus: 'Planlandı (-5 Gün Cron)' | 'Gönderildi (Tetiklendi)';
  reminderEmailBody: string;
  aiCallStatus: 'Hazır (Beklemede)' | 'AI Arama Başlatıldı';
}

export interface SupportChatMessage {
  id: string;
  sender: 'customer' | 'admin' | 'system';
  senderLabel: string;
  text: string;
  time: string;
}

export interface SupportConversation {
  id: string;
  customerName: string;
  customerPhone: string;
  status: 'Yanıt Bekliyor' | 'Yanıtlandı';
  lastUpdated: string;
  unreadByAdmin: number;
  messages: SupportChatMessage[];
}

export interface AIBotCallPayload {
  referenceCode: string;
  fullName: string;
  phone: string;
  email: string;
  selectedPackageName: string;
  travelDate: string;
  totalAmountTHB: number;
}

export const PHUKET_PACKAGES: PhuketPackage[] = [
  {
    id: 'standart',
    index: '01',
    name: 'STANDART PAKET',
    tierLabel: 'Phuket Başlangıç Deneyimi · Özel Villa & Transfer',
    priceTHB: 39900,
    priceFormatted: '39.900 THB',
    approxTRY: '≈ 38.500 ₺',
    duration: '5 Gece · 6 Gün',
    capacity: '1–4 Misafir',
    tagline: 'Phuket’e ilk kez gelen misafirlerimiz için konforlu villa konaklaması, havalimanı karşılaması ve ada keşif paketi.',
    features: [
      {
        icon: 'fa-solid fa-house-chimney-window',
        title: 'Standart Konforlu Phuket Villası',
        detail: 'Özel yüzme havuzlu, tropikal bahçeli müstakil Phuket villası'
      },
      {
        icon: 'fa-solid fa-car-side',
        title: 'Standart Transfer (4 Kişilik Araç)',
        detail: 'Phuket Havalimanı (HKT) – Villa arası çift yön özel sedan transfer'
      },
      {
        icon: 'fa-solid fa-compass',
        title: 'Phuket Grup Turu',
        detail: 'Big Buddha, Wat Chalong, Old Phuket Town ve panoramik koylar'
      },
      {
        icon: 'fa-solid fa-headset',
        title: '7/24 Türkçe Phuket Destek Hattı',
        detail: 'Tatiliniz boyunca Phuket yerleşik Türk ekibimizden kesintisiz destek'
      }
    ]
  },
  {
    id: 'gold',
    index: '02',
    name: 'GOLD PAKET',
    tierLabel: 'En Çok Tercih Edilen · VIP Gece Hayatı & Doğa',
    priceTHB: 64900,
    priceFormatted: '64.900 THB',
    approxTRY: '≈ 62.600 ₺',
    duration: '6 Gece · 7 Gün',
    capacity: '2–8 Misafir',
    isPopular: true,
    tagline: 'Phuket’in hem egzotik doğasını hem de dünyaca ünlü VIP gece hayatını eksiksiz yaşamak isteyenler için tasarlandı.',
    features: [
      {
        icon: 'fa-solid fa-van-shuttle',
        title: 'VIP Phuket Transfer (10 Kişilik Van Araç)',
        detail: 'Deri koltuklu VIP Toyota Commuter / Alphard ile özel şoförlü transfer'
      },
      {
        icon: 'fa-solid fa-hotel',
        title: 'Premium Phuket Villası',
        detail: 'Bang Tao veya Kamala bölgesinde sonsuzluk havuzlu lüks tasarım villa'
      },
      {
        icon: 'fa-solid fa-champagne-glasses',
        title: 'VIP (Nightlife) Gece Hayatı Organizasyonu (Loca + Giriş + Alkol)',
        detail: 'Illuzion, Catch Beach Club ve Bangla Road VIP masa, hızlı giriş ve şişe servisi'
      },
      {
        icon: 'fa-solid fa-paw',
        title: 'Phuket Aslan ve Fil Doğa Turu',
        detail: 'Etik fil koruma alanı ziyareti ve özel aslan etkileşim deneyimi'
      },
      {
        icon: 'fa-solid fa-water',
        title: 'Özel Aktiviteler & 7/24 Türkçe Concierge',
        detail: 'Jet-ski, Zipline veya ATV macera parkuru organizasyonu dahil'
      }
    ]
  },
  {
    id: 'premium',
    index: '03',
    name: 'PREMIUM PAKET VIP',
    tierLabel: 'Ultra Lüks · Özel Yat & Kişisel Concierge Host',
    priceTHB: 99900,
    priceFormatted: '99.900 THB',
    approxTRY: '≈ 96.400 ₺',
    duration: '7 Gece · 8 Gün',
    capacity: '2–10 Misafir',
    tagline: 'Phuket’te sınırları kaldıran kraliyet standardı: özel motor yatınız, kişisel yerli hostunuz ve okyanus manzaralı malikaneniz.',
    features: [
      {
        icon: 'fa-solid fa-crown',
        title: 'Lüks Phuket Villası',
        detail: 'Panoramik Andaman Denizi manzaralı, özel şef ve kahya opsiyonlu malikane'
      },
      {
        icon: 'fa-solid fa-user-tie',
        title: 'Özel Concierge Host (Yerli Kadın veya Erkek Host)',
        detail: 'Tatil süresince size eşlik eden, bölgeye hakim özel kadın veya erkek asistan'
      },
      {
        icon: 'fa-solid fa-sailboat',
        title: 'Phuket Özel Yat Turu (Adalar Gezisi)',
        detail: 'Phi Phi, Maya Bay, James Bond ve Coral Adası için tam gün özel motor yat'
      },
      {
        icon: 'fa-solid fa-martini-glass-citrus',
        title: 'VIP Nightlife (Loca + Giriş + Alkol)',
        detail: 'Phuket’in en seçkin beach club ve gece kulüplerinde sahne önü VVIP loca'
      },
      {
        icon: 'fa-solid fa-leaf',
        title: 'Phuket Aslan ve Fil Doğa Turu',
        detail: 'Özel araçla VIP transferli doğa, kaplan/aslan ve fil barınağı deneyimi'
      },
      {
        icon: 'fa-solid fa-gem',
        title: 'Full Premium Deneyim',
        detail: 'Fast-Track HKT havalimanı geçişi, özel fotoğraf/drone çekimi ve 7/24 VIP araç'
      }
    ]
  }
];

export const INITIAL_IBAN_POOL: IbanAccount[] = [
  {
    id: 'iban-1',
    bankName: 'Garanti BBVA Kurumsal',
    accountHolder: 'PHUKET ROYALE TURİZM VE SEYAHAT A.Ş.',
    iban: 'TR48 0006 2001 4920 0006 2984 10',
    currency: 'TRY',
    swiftCode: 'TGBATRISXXX',
    branchInfo: 'Levent Ticari Şube (1492) · 7/24 FAST & Havale Uygun',
    source: 'Supabase iban_pool Tablosu',
    isActive: true
  },
  {
    id: 'iban-2',
    bankName: 'Kuveyt Türk Katılım Bankası',
    accountHolder: 'PHUKET ROYALE TURİZM VE SEYAHAT A.Ş.',
    iban: 'TR91 0020 5000 0948 2104 9000 01',
    currency: 'TRY',
    swiftCode: 'KTEFTRISXXX',
    branchInfo: 'Merkez Kurumsal Şube · Anlık FAST Havuz Hesabı #2',
    source: 'Excel Havuz Senkronu',
    isActive: true
  },
  {
    id: 'iban-3',
    bankName: 'Ziraat Bankası Ticari',
    accountHolder: 'PHUKET ROYALE TURİZM VE SEYAHAT A.Ş.',
    iban: 'TR14 0001 0021 8496 3018 4050 02',
    currency: 'TRY',
    swiftCode: 'TCZBTR2AXXX',
    branchInfo: 'Beşiktaş Kurumsal Şube · Yüksek Limitli Havale Havuzu #3',
    source: 'Supabase iban_pool Tablosu',
    isActive: true
  },
  {
    id: 'iban-4',
    bankName: 'Bangkok Bank Public Co. Ltd (Phuket Office)',
    accountHolder: 'PHUKET ROYALE VIP HOSPITALITY CO., LTD.',
    iban: 'THB-842-0-914820-9 (Patong Commercial)',
    currency: 'THB',
    swiftCode: 'BKKBTHBK',
    branchInfo: 'Phuket Provincial Branch · Uluslararası SWIFT / THB Havuzu',
    source: 'Supabase iban_pool Tablosu',
    isActive: true
  }
];

export const INITIAL_PHUKET_FLIGHTS: FlightOption[] = [
  {
    id: 'flt-tk-direct',
    airline: 'Türk Hava Yolları (THY)',
    airlineCode: 'TK',
    flightNo: 'TK 172 · Direkt Phuket',
    originCode: 'IST',
    originCity: 'İstanbul Havalimanı',
    destinationCode: 'HKT',
    destinationCity: 'Phuket Uluslararası Havalimanı',
    departureTime: '01:45',
    arrivalTime: '15:25',
    duration: '9s 40dk',
    stopInfo: 'Direkt Uçuş (Aktarmasız)',
    cabin: 'Economy',
    baggage: '30 kg Bagaj + 8 kg Kabin',
    priceTHB: 28500,
    dataSource: 'IATA / THY Kış-Yaz Tarifesi (Admin Düzenlenebilir)'
  },
  {
    id: 'flt-tk-business',
    airline: 'Türk Hava Yolları (THY)',
    airlineCode: 'TK',
    flightNo: 'TK 172 · VIP Business',
    originCode: 'IST',
    originCity: 'İstanbul Havalimanı',
    destinationCode: 'HKT',
    destinationCity: 'Phuket Uluslararası Havalimanı',
    departureTime: '01:45',
    arrivalTime: '15:25',
    duration: '9s 40dk',
    stopInfo: 'Direkt Uçuş · CIP Lounge Dahil',
    cabin: 'Business Class',
    baggage: '40 kg Bagaj + 2x8 kg Kabin + Fast Track',
    priceTHB: 78900,
    dataSource: 'IATA / THY Kış-Yaz Tarifesi (Admin Düzenlenebilir)'
  },
  {
    id: 'flt-qr-doha',
    airline: 'Qatar Airways',
    airlineCode: 'QR',
    flightNo: 'QR 240 / QR 840',
    originCode: 'IST',
    originCity: 'İstanbul Havalimanı',
    destinationCode: 'HKT',
    destinationCity: 'Phuket Uluslararası Havalimanı',
    departureTime: '13:50',
    arrivalTime: '06:45 (+1)',
    duration: '12s 55dk',
    stopInfo: '1 Aktarma (Doha DOH · 2s 10dk)',
    cabin: 'Economy',
    baggage: '30 kg Bagaj + 7 kg Kabin',
    priceTHB: 24900,
    dataSource: 'Qatar Airways HKT Tarifesi (Admin Düzenlenebilir)'
  },
  {
    id: 'flt-ek-dubai',
    airline: 'Emirates',
    airlineCode: 'EK',
    flightNo: 'EK 122 / EK 378',
    originCode: 'IST',
    originCity: 'İstanbul Havalimanı',
    destinationCode: 'HKT',
    destinationCity: 'Phuket Uluslararası Havalimanı',
    departureTime: '16:25',
    arrivalTime: '08:00 (+1)',
    duration: '11s 35dk',
    stopInfo: '1 Aktarma (Dubai DXB · 1s 50dk)',
    cabin: 'Business Class',
    baggage: '40 kg Bagaj + Chauffeur Drive',
    priceTHB: 72400,
    dataSource: 'Emirates HKT Tarifesi (Admin Düzenlenebilir)'
  },
  {
    id: 'flt-saw-qr',
    airline: 'Qatar Airways',
    airlineCode: 'QR',
    flightNo: 'QR 246 / QR 842',
    originCode: 'SAW',
    originCity: 'İstanbul Sabiha Gökçen',
    destinationCode: 'HKT',
    destinationCity: 'Phuket Uluslararası Havalimanı',
    departureTime: '09:35',
    arrivalTime: '01:20 (+1)',
    duration: '11s 45dk',
    stopInfo: '1 Aktarma (Doha DOH · 1s 40dk)',
    cabin: 'Economy',
    baggage: '30 kg Bagaj + İkram',
    priceTHB: 23800,
    dataSource: 'SAW-DOH-HKT Tarifesi (Admin Düzenlenebilir)'
  },
  {
    id: 'flt-esb-tk',
    airline: 'Türk Hava Yolları (THY)',
    airlineCode: 'TK',
    flightNo: 'TK 2179 / TK 172',
    originCode: 'ESB',
    originCity: 'Ankara Esenboğa',
    destinationCode: 'HKT',
    destinationCity: 'Phuket Uluslararası Havalimanı',
    departureTime: '22:15',
    arrivalTime: '15:25 (+1)',
    duration: '13s 10dk',
    stopInfo: 'İstanbul (IST) Bağlantılı',
    cabin: 'Economy',
    baggage: '30 kg Bagaj (Phuket Bağlantılı)',
    priceTHB: 29400,
    dataSource: 'THY İç Hat Bağlantılı HKT Tarifesi'
  },
  {
    id: 'flt-adb-tk',
    airline: 'Türk Hava Yolları (THY)',
    airlineCode: 'TK',
    flightNo: 'TK 2337 / TK 172',
    originCode: 'ADB',
    originCity: 'İzmir Adnan Menderes',
    destinationCode: 'HKT',
    destinationCity: 'Phuket Uluslararası Havalimanı',
    departureTime: '22:40',
    arrivalTime: '15:25 (+1)',
    duration: '12s 45dk',
    stopInfo: 'İstanbul (IST) Bağlantılı',
    cabin: 'Economy',
    baggage: '30 kg Bagaj (Phuket Bağlantılı)',
    priceTHB: 29200,
    dataSource: 'THY İç Hat Bağlantılı HKT Tarifesi'
  },
  {
    id: 'flt-ek-first',
    airline: 'Emirates First Suites',
    airlineCode: 'EK',
    flightNo: 'EK 122 / EK 378 VIP',
    originCode: 'IST',
    originCity: 'İstanbul Havalimanı',
    destinationCode: 'HKT',
    destinationCity: 'Phuket Uluslararası Havalimanı',
    departureTime: '16:25',
    arrivalTime: '08:00 (+1)',
    duration: '11s 35dk',
    stopInfo: 'Özel Süit Kabin · HKT VIP Karşılama',
    cabin: 'First Class VIP',
    baggage: '50 kg Bagaj + Özel Havalimanı Limuzin',
    priceTHB: 138000,
    dataSource: 'Emirates VIP First Class Tarifesi'
  }
];

export function generatePhuketReferenceCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PHK-2026-${suffix}`;
}

export function calculateFiveDayReminderDate(travelDateStr: string): {
  reminderDateFormatted: string;
  reminderIso: string;
  daysUntilTravel: number;
} {
  const travelDate = new Date(travelDateStr + 'T09:00:00');
  const reminderDate = new Date(travelDate.getTime() - 5 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffDays = Math.max(
    0,
    Math.ceil((travelDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const reminderDateFormatted = reminderDate.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return {
    reminderDateFormatted,
    reminderIso: reminderDate.toISOString().split('T')[0],
    daysUntilTravel: diffDays
  };
}

export function buildFiveDayReminderEmailTemplate(
  fullName: string,
  referenceCode: string,
  packageName: string,
  travelDate: string
): string {
  return `Merhaba ${fullName}, Phuket maceranıza sadece 5 gün kaldı! Tatil planlarınızda herhangi bir değişiklik var mı, her şey yolunda mı? VIP transferiniz, villanız ve tüm detaylar sizin için hazır bekliyor. Sorularınız için 7/24 Türkçe destek hattımızdan bize ulaşabilirsiniz.

— Rezervasyon Özeti —
• Referans Kodu: ${referenceCode}
• Seçilen Paket: ${packageName}
• Phuket Varış Tarihi: ${travelDate}
• Karşılama Noktası: Phuket Uluslararası Havalimanı (HKT) VIP Çıkış Kapısı #3`;
}

export function formatTelegramNotification(
  fullName: string,
  packageName: string,
  travelDate: string,
  referenceCode: string
): string {
  return `🚀 YENİ PHUKET REZERVASYONU! Müşteri: ${fullName}, Paket: ${packageName}, Tarih: ${travelDate}, Referans: ${referenceCode}`;
}

export async function triggerAIBotCall(userData: AIBotCallPayload): Promise<{
  triggered: boolean;
  provider: string;
  callSessionId: string;
  timestamp: string;
  scriptPreview: string;
}> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const callSessionId = `VAPI-PHK-${Date.now().toString().slice(-6)}`;
  const scriptPreview = `"Merhaba ${userData.fullName}, Phuket Royale VIP Concierge sesli asistanıyım. ${userData.referenceCode} referans kodlu ${userData.selectedPackageName} rezervasyonunuz ve ${userData.travelDate} tarihli Phuket seyahatiniz için havalimanı VIP karşılama detaylarınızı teyit etmek üzere arıyorum."`;

  return {
    triggered: true,
    provider: 'Vapi / Retell Voice AI Engine (TR-Phuket Concierge)',
    callSessionId,
    timestamp: new Date().toLocaleTimeString('tr-TR'),
    scriptPreview
  };
}

const STORAGE_KEY_RESERVATIONS = 'phuket_royale_supabase_reservations_v2';
const STORAGE_KEY_FLIGHTS = 'phuket_royale_flights_v2';
const STORAGE_KEY_SUPPORT_CHATS = 'phuket_royale_support_chats_v2';

export function loadFlightsFromStore(): FlightOption[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FLIGHTS);
    if (raw) return JSON.parse(raw);
  } catch {
    // Fallback
  }
  return INITIAL_PHUKET_FLIGHTS;
}

export function saveFlightsToStore(flights: FlightOption[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_FLIGHTS, JSON.stringify(flights));
  } catch {
    // Ignore
  }
}

export function loadSupportConversationsFromStore(): SupportConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPPORT_CHATS);
    if (raw) return JSON.parse(raw);
  } catch {
    // Fallback
  }

  return [
    {
      id: 'chat-active-visitor',
      customerName: 'Web Ziyaretçisi (Canlı Sohbet)',
      customerPhone: '+90 532 000 00 00',
      status: 'Yanıtlandı',
      lastUpdated: 'Şimdi',
      unreadByAdmin: 0,
      messages: [
        {
          id: 'welcome-1',
          sender: 'admin',
          senderLabel: 'Phuket Royale Türkçe Destek',
          text: 'Merhaba! Phuket Royale VIP Concierge masasına hoş geldiniz. Phuket villaları, HKT uçak biletleri veya VIP gece hayatı / yat turlarımız hakkında size nasıl yardımcı olabiliriz?',
          time: 'Şimdi'
        }
      ]
    }
  ];
}

export function saveSupportConversationsToStore(convs: SupportConversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUPPORT_CHATS, JSON.stringify(convs));
  } catch {
    // Ignore
  }
}

export function loadReservationsFromSupabaseStore(): ReservationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RESERVATIONS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Fallback
  }

  const sampleTravelDate = '2026-11-15';
  const reminderMeta = calculateFiveDayReminderDate(sampleTravelDate);
  const sampleRef = 'PHK-2026-8K4M';

  const initialRecord: ReservationRecord = {
    id: 'res-initial-1',
    referenceCode: sampleRef,
    fullName: 'Kerem Soylu',
    email: 'kerem.soylu@ornek.com',
    phone: '+90 532 418 92 10',
    travelDate: sampleTravelDate,
    reminderDate: reminderMeta.reminderIso,
    daysUntilTravel: reminderMeta.daysUntilTravel,
    selectedPackageId: 'gold',
    selectedPackageName: 'GOLD PAKET (64.900 THB)',
    selectedFlightSummary: 'TK 172 · İstanbul (IST) → Phuket (HKT) Direkt',
    passengers: 2,
    totalAmountTHB: 64900,
    assignedIban: INITIAL_IBAN_POOL[0],
    specialNotes: 'Kamala bölgesinde deniz manzaralı villa ve havalimanı VIP van karşılama.',
    status: 'Beklemede (Pending)',
    createdAt: '28.09.2026 00:10',
    telegramLog: formatTelegramNotification('Kerem Soylu', 'GOLD PAKET', sampleTravelDate, sampleRef),
    reminderEmailStatus: 'Planlandı (-5 Gün Cron)',
    reminderEmailBody: buildFiveDayReminderEmailTemplate('Kerem Soylu', sampleRef, 'GOLD PAKET', sampleTravelDate),
    aiCallStatus: 'Hazır (Beklemede)'
  };

  return [initialRecord];
}

export function saveReservationsToSupabaseStore(records: ReservationRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RESERVATIONS, JSON.stringify(records));
  } catch {
    // Ignore storage quota errors
  }
}

export const SUPABASE_SQL_AND_CRON_BLUEPRINT = `-- ============================================================================
-- 1. SUPABASE VERİTABANI ŞEMASI (reservations, iban_pool & support_messages)
-- ============================================================================
create table public.iban_pool (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  account_holder text not null,
  iban text not null,
  currency text default 'TRY',
  is_active boolean default true,
  updated_at timestamptz default now()
);

create table public.phuket_reservations (
  id uuid primary key default gen_random_uuid(),
  reference_code text unique not null,      -- Örn: PHK-2026-XXXX
  full_name text not null,
  email text not null,
  phone text not null,
  package_name text not null,
  flight_summary text,
  travel_date date not null,                 -- Müşterinin Phuket seyahat tarihi
  reminder_send_date date generated always as (travel_date - interval '5 days') stored,
  total_amount_thb numeric not null,
  assigned_iban text not null,
  status text default 'Pending' check (status in ('Pending', 'Approved', 'Cancelled')),
  reminder_5d_sent boolean default false,
  created_at timestamptz default now()
);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  customer_name text,
  sender text check (sender in ('customer', 'admin', 'system')),
  message text not null,
  created_at timestamptz default now()
);

-- ============================================================================
-- 2. OTOMATİK 5 GÜN ÖNCE HATIRLATMA MAİLİ (Supabase pg_cron + pg_net)
-- Seyahat tarihinden tam 5 gün önce (travel_date - 5 days = current_date)
-- her sabah 09:00'da çalışır ve müşteriye hatırlatma maili gönderir.
-- ============================================================================
select cron.schedule(
  'phuket-5-days-before-reminder-job',
  '0 9 * * *',
  $$
  select
    net.http_post(
      url := 'https://PROJECT_REF.supabase.co/functions/v1/send-phuket-5d-reminder',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
      body := jsonb_build_object(
        'reservation_id', r.id,
        'reference_code', r.reference_code,
        'full_name', r.full_name,
        'email', r.email,
        'package_name', r.package_name,
        'travel_date', r.travel_date,
        'message', format(
          'Merhaba %s, Phuket maceranıza sadece 5 gün kaldı! Tatil planlarınızda herhangi bir değişiklik var mı, her şey yolunda mı? VIP transferiniz, villanız ve tüm detaylar sizin için hazır bekliyor. Sorularınız için 7/24 Türkçe destek hattımızdan bize ulaşabilirsiniz.',
          r.full_name
        )
      )
    )
  from public.phuket_reservations r
  where r.travel_date - current_date = 5
    and r.reminder_5d_sent = false
    and r.status = 'Approved';
  $$
);`;
