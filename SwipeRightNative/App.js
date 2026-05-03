import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, StatusBar, Animated, Dimensions,
  KeyboardAvoidingView, Platform, ActivityIndicator, Modal,
  NativeModules,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sb } from './lib/supabase';
import { COUNTRIES, getRate, findCardAnywhere } from './data/countries';

// Auto-detect country from device locale
function detectCountry() {
  try {
    const locale = Platform.OS === 'ios'
      ? (NativeModules.SettingsManager?.settings?.AppleLocale ||
         NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || 'en_CA')
      : (NativeModules.I18nManager?.localeIdentifier || 'en_CA');
    if (typeof locale === 'string' && locale.toUpperCase().includes('IN')) return 'IN';
    return 'CA';
  } catch (e) {
    return 'CA';
  }
}

const { width } = Dimensions.get('window');
const Stack = createNativeStackNavigator();

// Get rate honoring user overrides (per-card, per-category)
function getEffectiveRate(card, category, overrides = {}) {
  const cardOv = overrides[card.id];
  if (cardOv && cardOv[category] !== undefined) return cardOv[category];
  return getRate(card, category);
}

const C = {
  bg: '#07070f',
  bg2: '#0e0e1a',
  glass: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.1)',
  purple: '#7c3aed',
  purpleLight: '#a78bfa',
  purpleDim: 'rgba(124,58,237,0.15)',
  text: '#f0f0f8',
  text2: 'rgba(240,240,248,0.55)',
  text3: 'rgba(240,240,248,0.3)',
  green: '#34d399',
  amber: '#fbbf24',
  red: '#f87171',
};

// ── APP CONTEXT ───────────────────────────────────────────
const AppContext = createContext(null);
const useApp = () => useContext(AppContext);

// ── SHARED COMPONENTS ─────────────────────────────────────
const GlassCard = ({ children, style }) => <View style={[styles.glassCard, style]}>{children}</View>;

const PrimaryBtn = ({ label, onPress, disabled, loading, style }) => (
  <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}
    style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled, style]}>
    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{label}</Text>}
  </TouchableOpacity>
);

const GhostBtn = ({ label, onPress, style }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.ghostBtn, style]}>
    <Text style={styles.ghostBtnText}>{label}</Text>
  </TouchableOpacity>
);

const Badge = ({ label }) => (
  <View style={styles.badge}>
    <View style={styles.badgeDot} />
    <Text style={styles.badgeText}>{label}</Text>
  </View>
);

const CardVis = ({ colors, size = 'md' }) => {
  const w = size === 'sm' ? 44 : size === 'lg' ? 70 : 54;
  const h = size === 'sm' ? 28 : size === 'lg' ? 44 : 35;
  return (
    <View style={{ width: w, height: h, borderRadius: 7, backgroundColor: colors[0], overflow: 'hidden', justifyContent: 'flex-end', padding: 5 }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors[1], opacity: 0.5 }} />
      <View style={{ width: 14, height: 10, backgroundColor: 'rgba(255,215,0,0.8)', borderRadius: 2 }} />
    </View>
  );
};

const CardTile = ({ card, selected, onToggle }) => (
  <TouchableOpacity onPress={() => onToggle(card.id)} activeOpacity={0.7}
    style={[styles.cardTile, selected && styles.cardTileSelected]}>
    {selected && (
      <View style={styles.checkBadge}>
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text>
      </View>
    )}
    <CardVis colors={card.color} />
    <Text style={styles.cardTileName} numberOfLines={1}>{card.name}</Text>
    <Text style={styles.cardTileBank} numberOfLines={1}>{card.issuer}</Text>
    <Text style={styles.cardTilePerk} numberOfLines={1}>{card.perks[0]}</Text>
  </TouchableOpacity>
);

// Reusable back button with big tap target
const BackBtn = ({ navigation, onPress }) => (
  <TouchableOpacity
    onPress={onPress || (() => navigation.goBack())}
    activeOpacity={0.6}
    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    style={styles.backBtnNew}
  >
    <Text style={styles.backBtnNewText}>‹</Text>
  </TouchableOpacity>
);

// Tappable logo: signed-in → Dashboard, otherwise → Home
function LogoBtn({ navigation }) {
  const { session, profile } = useApp();
  function handlePress() {
    // Signed-in with profile → Dashboard. Else → Home.
    if (session && profile) {
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  }
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8 }} style={styles.logoBtnRow}>
      <View style={styles.logoMark}><Text style={styles.logoMarkText} allowFontScaling={false}>↗</Text></View>
      <Text style={styles.logoText} allowFontScaling={false}>SwipeRightt</Text>
    </TouchableOpacity>
  );
}


// ── COUNTRY PICKER ────────────────────────────────────────
function CountryPickerBtn({ light = false, navigation }) {
  const { country, countryCode, setCountryCode, ownedCards, setOwnedCards } = useApp();
  const [open, setOpen] = useState(false);
  const [pendingCode, setPendingCode] = useState(null);

  async function performSwitch(newCode) {
    const newCountryCardIds = COUNTRIES[newCode].cards.map(c => c.id);
    const filtered = ownedCards.filter(id => newCountryCardIds.includes(id));
    setOwnedCards(filtered);
    await AsyncStorage.setItem('sr_cards', JSON.stringify(filtered));
    await setCountryCode(newCode);
    setOpen(false);
    setPendingCode(null);
    // If we lost cards (changed country with cards selected), redirect to Setup
    if (filtered.length === 0 && ownedCards.length > 0 && navigation) {
      navigation.navigate('Setup');
    }
  }

  async function handleSwitch(newCode) {
    if (newCode === countryCode) { setOpen(false); return; }
    // Check if user will lose cards
    const newCountryCardIds = COUNTRIES[newCode].cards.map(c => c.id);
    const willLose = ownedCards.filter(id => !newCountryCardIds.includes(id)).length;
    if (willLose > 0) {
      setPendingCode(newCode);
      return;
    }
    await performSwitch(newCode);
  }

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.7}
        style={[styles.countryBtn, light && { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
        <Text style={styles.countryFlag}>{country.flag}</Text>
        <Text style={styles.countryArrow}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setOpen(false)} style={styles.modalOverlay}>
          <View style={styles.countryMenu}>
            <Text style={styles.countryMenuTitle}>SELECT COUNTRY</Text>
            {Object.values(COUNTRIES).map(c => (
              <TouchableOpacity key={c.code} onPress={() => handleSwitch(c.code)} activeOpacity={0.6}
                style={[styles.countryItem, c.code === countryCode && styles.countryItemActive]}>
                <Text style={{ fontSize: 24 }}>{c.flag}</Text>
                <Text style={styles.countryItemText}>{c.name}</Text>
                {c.code === countryCode && <Text style={{ color: '#a78bfa', fontWeight: '700' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={pendingCode !== null} transparent animationType="fade" onRequestClose={() => setPendingCode(null)}>
        <View style={styles.gateOverlay}>
          <View style={styles.gateCard}>
            <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 14 }}>🌍</Text>
            <Text style={styles.gateTitle}>Switch to {pendingCode && COUNTRIES[pendingCode]?.name}?</Text>
            <Text style={styles.gateSub}>Your selected cards are from {country.name}. Switching will clear them so you can pick {pendingCode && COUNTRIES[pendingCode]?.name} cards instead.</Text>
            <PrimaryBtn label={`Switch to ${pendingCode && COUNTRIES[pendingCode]?.flag} ${pendingCode && COUNTRIES[pendingCode]?.name}`} onPress={() => performSwitch(pendingCode)} style={{ marginTop: 18 }} />
            <TouchableOpacity onPress={() => setPendingCode(null)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={styles.linkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ── HOME ──────────────────────────────────────────────────
function HomeScreen({ navigation }) {
  const { setIsGuest, session } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  function handleFindNextCard() {
    if (session) {
      navigation.navigate('Recommend');
    } else {
      setShowGate(true);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.homeTopBar}>
        <CountryPickerBtn light />
        <View style={{ flex: 1 }} />
      </View>
      <ScrollView
        contentContainerStyle={styles.homeScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center', width: '100%' }}>
          <View style={[styles.logoRow, { marginBottom: 20 }]}>
            <View style={styles.logoMark}><Text style={styles.logoMarkText} allowFontScaling={false}>↗</Text></View>
            <Text style={styles.logoText} allowFontScaling={false}>SwipeRightt</Text>
          </View>
          <Badge label="SMART CARD OPTIMIZATION" />
          <Text style={styles.heroTitle} allowFontScaling={false}>Always swipe{'\n'}the <Text style={styles.heroTitleAccent}>right card.</Text></Text>
          <Text style={styles.heroSub}>Tell us which cards you own. We'll instantly tell you which one to use at any store.</Text>
          <PrimaryBtn label="Get started free →" onPress={() => navigation.navigate('Login')} style={{ width: width - 48, marginBottom: 12 }} />
          <GhostBtn label="Try without signing in" onPress={() => { setIsGuest(true); navigation.navigate('Setup'); }} style={{ width: width - 48 }} />

          <TouchableOpacity onPress={handleFindNextCard} activeOpacity={0.7} style={styles.nextCardCta}>
            <Text style={styles.nextCardCtaIcon}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextCardCtaTitle}>Find my next card</Text>
              <Text style={styles.nextCardCtaSub}>Discover the perfect card for your spending</Text>
            </View>
            <Text style={styles.nextCardCtaArrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.featureRow}>
            {['💳 All major cards', '⚡ Instant results', '🔒 No password', '✨ Free forever'].map(f => (
              <View key={f} style={styles.featPill}><Text style={styles.featPillText}>{f}</Text></View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <Modal visible={showGate} transparent animationType="fade" onRequestClose={() => setShowGate(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowGate(false)} style={styles.gateOverlay}>
          <View style={styles.gateCard}>
            <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 14 }}>🔐</Text>
            <Text style={styles.gateTitle}>Sign in to unlock</Text>
            <Text style={styles.gateSub}>This feature uses your spending profile to find the best card for you. Sign in to save your results.</Text>
            <PrimaryBtn label="Sign in free →" onPress={() => { setShowGate(false); navigation.navigate('Login'); }} style={{ marginTop: 18 }} />
            <TouchableOpacity onPress={() => setShowGate(false)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={styles.linkText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ── LOGIN ─────────────────────────────────────────────────
function LoginScreen({ navigation }) {
  const { setSession, setOwnedCards, ownedCards, setIsGuest, setProfile } = useApp();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  async function sendOTP() {
    if (!email.includes('@')) { setError('Enter a valid email.'); return; }
    setLoading(true); setError('');
    const { error: e } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    setLoading(false);
    if (e) setError(e.message); else setStep(2);
  }

  async function verifyOTP() {
    const code = otp.join('');
    if (code.length < 6) return;
    setLoading(true); setError('');
    const { data, error: e } = await sb.auth.verifyOtp({ email, token: code, type: 'email' });
    setLoading(false);
    if (e) {
      setError('Incorrect code. Try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } else {
      const s = { id: data.user.id, email: data.user.email };
      setSession(s);
      setIsGuest(false);
      // Fetch profile + cards. Use maybeSingle to avoid throws on no rows.
      // Retry profile fetch once if it returns null (race against RLS / auth propagation)
      async function fetchProfile() {
        const { data: p } = await sb.from('profiles').select('*').eq('id', s.id).maybeSingle();
        return p;
      }
      let profileData = await fetchProfile();
      if (!profileData) {
        // Brief wait then retry once — auth session may still be propagating
        await new Promise(r => setTimeout(r, 400));
        profileData = await fetchProfile();
      }
      const { data: cardData } = await sb.from('user_cards').select('cards').eq('user_id', s.id).maybeSingle();
      if (profileData) setProfile(profileData);
      let hasCards = ownedCards.length > 0;
      if (cardData?.cards) {
        setOwnedCards(cardData.cards);
        await AsyncStorage.setItem('sr_cards', JSON.stringify(cardData.cards));
        hasCards = cardData.cards.length > 0;
      }
      // Route:
      // No profile → ProfileSetup
      // Profile exists but no cards → Setup
      // Profile + cards → Dashboard
      let nextRoute = 'Dashboard';
      if (!profileData) nextRoute = 'ProfileSetup';
      else if (!hasCards) nextRoute = 'Setup';
      navigation.reset({ index: 0, routes: [{ name: nextRoute }] });
    }
  }

  function handleOtpChange(val, i) {
    const v = val.replace(/\D/g, '');
    const newOtp = [...otp]; newOtp[i] = v ? v[0] : ''; setOtp(newOtp);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
    if (!v && i > 0) inputRefs.current[i - 1]?.focus();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.loginContainer} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          {step === 1 ? (
            <>
              <Badge label="SIGN IN" />
              <Text style={styles.screenTitle}>Welcome back</Text>
              <Text style={styles.screenSub}>Enter your email — we'll send a 6-digit code.</Text>
              <GlassCard style={{ marginTop: 28 }}>
                <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                <TextInput style={styles.glassInput} value={email} onChangeText={setEmail}
                  placeholder="you@example.com" placeholderTextColor={C.text3}
                  keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                  onSubmitEditing={sendOTP} />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <PrimaryBtn label="Continue →" onPress={sendOTP} loading={loading} disabled={!email} style={{ marginTop: 14 }} />
              </GlassCard>
            </>
          ) : (
            <>
              <Badge label="ENTER CODE" />
              <Text style={styles.screenTitle}>Check your inbox</Text>
              <View style={styles.emailPill}><Text style={styles.emailPillText}>{email}</Text></View>
              <View style={styles.otpRow}>
                {otp.map((val, i) => (
                  <TextInput key={i} ref={r => inputRefs.current[i] = r}
                    style={[styles.otpBox, val && styles.otpBoxFilled]}
                    value={val} onChangeText={v => handleOtpChange(v, i)}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace') {
                        setOtp(prev => {
                          const newOtp = [...prev];
                          if (newOtp[i]) {
                            newOtp[i] = '';
                          } else if (i > 0) {
                            newOtp[i - 1] = '';
                            setTimeout(() => inputRefs.current[i - 1]?.focus(), 0);
                          }
                          return newOtp;
                        });
                      }
                    }}
                    keyboardType="number-pad" maxLength={1} textAlign="center" selectionColor={C.purpleLight} />
                ))}
              </View>
              {error ? <Text style={[styles.errorText, { textAlign: 'center', marginBottom: 12 }]}>{error}</Text> : null}
              <PrimaryBtn label="Sign in" onPress={verifyOTP} loading={loading} disabled={otp.join('').length < 6} style={{ marginTop: 8 }} />
              <TouchableOpacity onPress={() => { setStep(1); setOtp(['', '', '', '', '', '']); setError(''); }} style={{ marginTop: 20, alignItems: 'center' }}>
                <Text style={styles.linkText}>← Use a different email</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── PROFILE SETUP (first-time signup) ────────────────────
function ProfileSetupScreen({ navigation }) {
  const { session, profile, setProfile, country, setCountryCode } = useApp();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(country.code);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [usernameStatus, setUsernameStatus] = useState(null); // null, 'checking', 'available', 'taken', 'invalid'

  // On mount: check if profile already exists. If so, skip to Dashboard.
  // (Prevents loop where re-login asks for profile setup again.)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!session?.id) { setChecking(false); return; }
      // Fast path: profile already in context
      if (profile) {
        navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
        return;
      }
      // Otherwise ask Supabase directly
      const { data } = await sb.from('profiles').select('*').eq('id', session.id).maybeSingle();
      if (cancelled) return;
      if (data) {
        setProfile(data);
        navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
      } else {
        setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-suggest username when first name changes
  useEffect(() => {
    if (firstName && !username) {
      const suggested = (firstName + (lastName ? '_' + lastName.charAt(0) : '')).toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (suggested.length >= 3) setUsername(suggested);
    }
  }, [firstName, lastName]);

  // Check username availability with debounce
  useEffect(() => {
    if (!username) { setUsernameStatus(null); return; }
    if (username.length < 3) { setUsernameStatus('invalid'); return; }
    if (!/^[a-z0-9_]+$/.test(username)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    const t = setTimeout(async () => {
      const { data } = await sb.from('profiles').select('username').eq('username', username).maybeSingle();
      setUsernameStatus(data ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(t);
  }, [username]);

  async function handleContinue() {
    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (usernameStatus !== 'available') {
      setError('Please pick an available username.');
      return;
    }
    setLoading(true); setError('');
    // Defensive: if a profile somehow already exists (race / repeat), load it instead
    const { data: existing } = await sb.from('profiles').select('*').eq('id', session.id).maybeSingle();
    if (existing) {
      setProfile(existing);
      setLoading(false);
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
      return;
    }
    const { error: e } = await sb.from('profiles').insert({
      id: session.id,
      username: username.toLowerCase().trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      city: city.trim() || null,
      country_code: selectedCountry,
      email: session.email,
    });
    setLoading(false);
    if (e) {
      // 23505 = unique constraint violation. If id conflicts, profile exists. Load it.
      if (e.code === '23505' && (e.message || '').toLowerCase().includes('id')) {
        const { data: existing } = await sb.from('profiles').select('*').eq('id', session.id).maybeSingle();
        if (existing) {
          setProfile(existing);
          navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
          return;
        }
      }
      setError(e.message || 'Failed to save profile.');
      return;
    }
    // Save country choice
    await setCountryCode(selectedCountry);
    setProfile({
      id: session.id,
      username: username.toLowerCase().trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      city: city.trim() || null,
      country_code: selectedCountry,
      email: session.email,
    });
    navigation.reset({ index: 0, routes: [{ name: 'Setup' }] });
  }

  // Show a loading indicator while we check if profile already exists
  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.purpleLight} size="large" />
      </View>
    );
  }

  const usernameColor = usernameStatus === 'available' ? C.green : usernameStatus === 'taken' || usernameStatus === 'invalid' ? C.red : C.text3;
  const usernameMsg = {
    checking: 'Checking…',
    available: '✓ Available',
    taken: '✗ Already taken',
    invalid: 'Min 3 chars, letters/numbers/_ only',
  }[usernameStatus] || '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Badge label="WELCOME" />
          <Text style={[styles.screenTitle, { marginTop: 12 }]}>Tell us about you</Text>
          <Text style={[styles.screenSub, { marginBottom: 24 }]}>This helps us personalize SwipeRightt for you.</Text>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>FIRST NAME</Text>
              <TextInput style={styles.profInput} value={firstName} onChangeText={setFirstName}
                placeholder="John" placeholderTextColor={C.text3} autoCapitalize="words" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>LAST NAME</Text>
              <TextInput style={styles.profInput} value={lastName} onChangeText={setLastName}
                placeholder="Smith" placeholderTextColor={C.text3} autoCapitalize="words" />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>USERNAME</Text>
          <View style={{ position: 'relative' }}>
            <Text style={styles.usernamePrefix}>@</Text>
            <TextInput style={[styles.profInput, { paddingLeft: 32 }]} value={username}
              onChangeText={t => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="username" placeholderTextColor={C.text3} autoCapitalize="none" autoCorrect={false} maxLength={20} />
          </View>
          {usernameMsg ? <Text style={[styles.usernameStatus, { color: usernameColor }]}>{usernameMsg}</Text> : null}

          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>CITY (OPTIONAL)</Text>
          <TextInput style={styles.profInput} value={city} onChangeText={setCity}
            placeholder="Toronto" placeholderTextColor={C.text3} autoCapitalize="words" />

          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>YOUR COUNTRY</Text>
          <View style={styles.countryChoices}>
            {Object.values(COUNTRIES).map(c => (
              <TouchableOpacity key={c.code} onPress={() => setSelectedCountry(c.code)} activeOpacity={0.7}
                style={[styles.countryChoice, selectedCountry === c.code && styles.countryChoiceActive]}>
                <Text style={{ fontSize: 28 }}>{c.flag}</Text>
                <Text style={[styles.countryChoiceText, selectedCountry === c.code && { color: C.purpleLight }]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text style={[styles.errorText, { marginTop: 14 }]}>{error}</Text> : null}

          <PrimaryBtn label="Continue →" onPress={handleContinue} loading={loading}
            disabled={!firstName || !lastName || usernameStatus !== 'available'}
            style={{ marginTop: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── PROFILE (view/edit) ───────────────────────────────────
function ProfileScreen({ navigation }) {
  const { session, profile, setProfile } = useApp();
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [city, setCity] = useState(profile?.city || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('available');
  const originalUsername = profile?.username || '';

  useEffect(() => {
    if (!username || username === originalUsername) { setUsernameStatus('available'); return; }
    if (username.length < 3) { setUsernameStatus('invalid'); return; }
    if (!/^[a-z0-9_]+$/.test(username)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    const t = setTimeout(async () => {
      const { data } = await sb.from('profiles').select('username').eq('username', username).maybeSingle();
      setUsernameStatus(data ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(t);
  }, [username]);

  async function save() {
    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      setError('Please fill in all required fields.'); return;
    }
    if (usernameStatus !== 'available') {
      setError('Please pick an available username.'); return;
    }
    setLoading(true); setError(''); setSuccess('');
    const updates = {
      username: username.toLowerCase().trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      city: city.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error: e } = await sb.from('profiles').update(updates).eq('id', session.id);
    setLoading(false);
    if (e) { setError(e.message); return; }
    setProfile({ ...profile, ...updates });
    setSuccess('✓ Profile updated');
    setTimeout(() => setSuccess(''), 2000);
  }

  const usernameColor = usernameStatus === 'available' ? C.green : C.red;
  const usernameMsg = username !== originalUsername ? ({
    checking: 'Checking…',
    available: '✓ Available',
    taken: '✗ Already taken',
    invalid: 'Min 3 chars, letters/numbers/_ only',
  }[usernameStatus] || '') : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navBar}>
        <View style={styles.logoRow}>
          <BackBtn navigation={navigation} />
          <Text style={styles.logoText}>My Profile</Text>
        </View>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">

          <View style={styles.profileHero}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{(firstName || session?.email || 'U')[0].toUpperCase()}</Text>
            </View>
            <Text style={styles.profileName}>{firstName} {lastName}</Text>
            <Text style={styles.profileHandle}>@{username}</Text>
            <Text style={styles.profileEmail}>{session?.email}</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>FIRST NAME</Text>
              <TextInput style={styles.profInput} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>LAST NAME</Text>
              <TextInput style={styles.profInput} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>USERNAME</Text>
          <View style={{ position: 'relative' }}>
            <Text style={styles.usernamePrefix}>@</Text>
            <TextInput style={[styles.profInput, { paddingLeft: 32 }]} value={username}
              onChangeText={t => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              autoCapitalize="none" autoCorrect={false} maxLength={20} />
          </View>
          {usernameMsg ? <Text style={[styles.usernameStatus, { color: usernameColor }]}>{usernameMsg}</Text> : null}

          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>CITY</Text>
          <TextInput style={styles.profInput} value={city} onChangeText={setCity} autoCapitalize="words"
            placeholder="Add your city" placeholderTextColor={C.text3} />

          {error ? <Text style={[styles.errorText, { marginTop: 14 }]}>{error}</Text> : null}
          {success ? <Text style={[styles.errorText, { marginTop: 14, color: C.green }]}>{success}</Text> : null}

          <PrimaryBtn label="Save changes" onPress={save} loading={loading} style={{ marginTop: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── MY CARDS (signed-in user's wallet view) ───────────────
function MyCardsScreen({ navigation }) {
  const { ownedCards, toggleCard, country, cardOverrides } = useApp();
  const owned = country.cards.filter(c => ownedCards.includes(c.id));

  function hasOverrides(cardId) {
    return cardOverrides[cardId] && Object.keys(cardOverrides[cardId]).length > 0;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navBar}>
        <View style={styles.logoRow}>
          <BackBtn navigation={navigation} />
          <Text style={styles.logoText}>My Wallet</Text>
        </View>
        <Text style={styles.navLink}>{owned.length} card{owned.length !== 1 ? 's' : ''}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {owned.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 14 }}>👛</Text>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>Your wallet is empty</Text>
            <Text style={{ color: C.text2, fontSize: 14, textAlign: 'center', marginTop: 8 }}>Add your cards to start optimizing your rewards</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.hint, { marginBottom: 12 }]}>Tap a card to view or customize cashback rates.</Text>
            {owned.map(card => (
              <TouchableOpacity
                key={card.id}
                onPress={() => navigation.navigate('CardDetail', { cardId: card.id })}
                activeOpacity={0.7}
                style={styles.walletCard}
              >
                <CardVis colors={card.color} size="lg" />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.walletCardName}>{card.name}</Text>
                  <Text style={styles.walletCardBank}>{card.issuer}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    {hasOverrides(card.id) ? (
                      <View style={styles.customBadge}>
                        <Text style={styles.customBadgeText}>✏️ Custom rates</Text>
                      </View>
                    ) : (
                      <Text style={styles.walletCardPerk} numberOfLines={1}>{card.perks[0]}</Text>
                    )}
                  </View>
                </View>
                <Text style={{ color: C.text3, fontSize: 18, marginLeft: 8 }}>›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        <PrimaryBtn label="+ Add a card" onPress={() => navigation.navigate('AddCards')} style={{ marginTop: 18 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── CARD DETAIL (view & customize rates) ─────────────────
function CardDetailScreen({ navigation, route }) {
  const { cardId } = route.params;
  const { country, cardOverrides, saveOverrides, toggleCard } = useApp();
  const card = country.cards.find(c => c.id === cardId);
  const [editingCat, setEditingCat] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showRemove, setShowRemove] = useState(false);

  if (!card) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.navLink}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: C.text2 }}>Card not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const overrides = cardOverrides[cardId] || {};
  const hasAnyOverride = Object.keys(overrides).length > 0;

  function effectiveRate(cat) {
    return overrides[cat] !== undefined ? overrides[cat] : (card.rates[cat] || card.rates['other'] || 0);
  }

  function isOverridden(cat) {
    return overrides[cat] !== undefined;
  }

  function startEdit(cat) {
    setEditingCat(cat);
    setEditValue(String(effectiveRate(cat)));
  }

  async function saveEdit() {
    const num = parseFloat(editValue);
    if (isNaN(num) || num < 0 || num > 100) {
      setEditingCat(null);
      return;
    }
    const defaultRate = card.rates[editingCat] || card.rates['other'] || 0;
    const next = { ...cardOverrides };
    if (Math.abs(num - defaultRate) < 0.01) {
      // Same as default -> remove override
      if (next[cardId]) {
        const { [editingCat]: _, ...rest } = next[cardId];
        if (Object.keys(rest).length === 0) {
          const { [cardId]: __, ...others } = next;
          await saveOverrides(others);
        } else {
          next[cardId] = rest;
          await saveOverrides(next);
        }
      }
    } else {
      next[cardId] = { ...(next[cardId] || {}), [editingCat]: num };
      await saveOverrides(next);
    }
    setEditingCat(null);
  }

  async function resetCategory(cat) {
    const next = { ...cardOverrides };
    if (next[cardId]) {
      const { [cat]: _, ...rest } = next[cardId];
      if (Object.keys(rest).length === 0) {
        const { [cardId]: __, ...others } = next;
        await saveOverrides(others);
      } else {
        next[cardId] = rest;
        await saveOverrides(next);
      }
    }
  }

  async function resetAll() {
    const next = { ...cardOverrides };
    delete next[cardId];
    await saveOverrides(next);
  }

  // Categories to show — country-specific store categories + 'other'
  const categories = country.stores.map(s => ({ key: s.category, label: s.label, icon: s.icon }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navBar}>
        <View style={styles.logoRow}>
          <BackBtn navigation={navigation} />
          <Text style={styles.logoText}>Card Details</Text>
        </View>
        {hasAnyOverride && (
          <TouchableOpacity onPress={resetAll}>
            <Text style={[styles.navLink, { color: C.purpleLight }]}>Reset all</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={styles.cardHero}>
          <CardVis colors={card.color} size="lg" />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.cardHeroName}>{card.name}</Text>
            <Text style={styles.cardHeroBank}>{card.issuer}</Text>
            <Text style={styles.cardHeroFee}>
              {card.annual_fee > 0 ? `${country.currency}${card.annual_fee}/year fee` : 'No annual fee'}
            </Text>
          </View>
        </View>

        {/* Perks */}
        <Text style={[styles.fieldLabel, { marginTop: 8, marginBottom: 8 }]}>PERKS</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
          {card.perks.map(p => (
            <View key={p} style={styles.perk}><Text style={styles.perkText}>{p}</Text></View>
          ))}
        </View>

        {/* Rates */}
        <Text style={styles.fieldLabel}>CASHBACK RATES</Text>
        <Text style={[styles.hint, { marginTop: 4, marginBottom: 12 }]}>
          Tap any rate to customize. Useful if your actual rate differs from our defaults.
        </Text>

        {categories.map(cat => {
          const rate = effectiveRate(cat.key);
          const overridden = isOverridden(cat.key);
          const rateColor = rate >= 4 ? C.green : rate >= 2 ? C.amber : C.text2;
          return (
            <TouchableOpacity
              key={cat.key}
              onPress={() => startEdit(cat.key)}
              activeOpacity={0.6}
              style={styles.rateRow}
            >
              <Text style={{ fontSize: 22, marginRight: 12 }}>{cat.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rateRowLabel}>{cat.label}</Text>
                {overridden && (
                  <Text style={styles.rateRowDefault}>Default: {card.rates[cat.key] || card.rates['other'] || 0}%</Text>
                )}
              </View>
              {overridden && (
                <TouchableOpacity onPress={() => resetCategory(cat.key)} style={styles.rateResetBtn}>
                  <Text style={styles.rateResetText}>↺</Text>
                </TouchableOpacity>
              )}
              <View style={[styles.rateValueWrap, overridden && styles.rateValueWrapEdit]}>
                <Text style={[styles.rateValue, { color: rateColor }]}>{rate}%</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Remove card */}
        <TouchableOpacity onPress={() => setShowRemove(true)} activeOpacity={0.7} style={styles.removeCardBtn}>
          <Text style={styles.removeCardBtnText}>Remove this card from wallet</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit modal */}
      <Modal visible={editingCat !== null} transparent animationType="fade" onRequestClose={() => setEditingCat(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity activeOpacity={1} onPress={() => setEditingCat(null)} style={styles.gateOverlay}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.gateCard}>
              <Text style={styles.gateTitle}>
                {categories.find(c => c.key === editingCat)?.icon} {categories.find(c => c.key === editingCat)?.label}
              </Text>
              <Text style={[styles.gateSub, { marginBottom: 14 }]}>Enter your actual cashback rate (%)</Text>
              <View style={styles.rateEditWrap}>
                <TextInput
                  style={styles.rateEditInput}
                  value={editValue}
                  onChangeText={t => setEditValue(t.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  autoFocus
                  selectTextOnFocus
                  textAlign="center"
                  selectionColor={C.purpleLight}
                />
                <Text style={styles.rateEditPct}>%</Text>
              </View>
              <Text style={[styles.hint, { textAlign: 'center', marginTop: 8 }]}>
                Default: {editingCat ? (card.rates[editingCat] || card.rates['other'] || 0) : 0}%
              </Text>
              <PrimaryBtn label="Save" onPress={saveEdit} style={{ marginTop: 18 }} />
              <TouchableOpacity onPress={() => setEditingCat(null)} style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={styles.linkText}>Cancel</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Remove confirm */}
      <Modal visible={showRemove} transparent animationType="fade" onRequestClose={() => setShowRemove(false)}>
        <View style={styles.gateOverlay}>
          <View style={styles.gateCard}>
            <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 14 }}>⚠️</Text>
            <Text style={styles.gateTitle}>Remove {card.name}?</Text>
            <Text style={styles.gateSub}>This card will be removed from your wallet and any custom rates will be deleted.</Text>
            <TouchableOpacity
              onPress={async () => {
                await resetAll();
                toggleCard(card.id);
                setShowRemove(false);
                navigation.goBack();
              }}
              activeOpacity={0.7}
              style={[styles.removeConfirmBtn, { marginTop: 18 }]}
            >
              <Text style={styles.removeConfirmBtnText}>Remove from wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowRemove(false)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={styles.linkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── ADD CARDS (signed-in: shows only cards user doesn't have) ─
function AddCardsScreen({ navigation }) {
  const { ownedCards, toggleCard, country } = useApp();
  const [search, setSearch] = useState('');
  const [expandedGroup, setExpandedGroup] = useState(null);

  const CARDS = country.cards.filter(c => !ownedCards.includes(c.id));
  const featuredIds = country.featuredIds;
  const groups = country.groups;
  const groupKey = country.groupBy;

  function cardInGroup(card, group) {
    if (groupKey === 'network') return card.network === group.id;
    return card.issuer.toLowerCase().includes(group.id);
  }

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return CARDS.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.issuer.toLowerCase().includes(q) ||
      c.network.toLowerCase().includes(q) ||
      c.perks.some(p => p.toLowerCase().includes(q))
    );
  }, [search, CARDS]);

  const isSearching = search.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navBar}>
        <View style={styles.logoRow}>
          <BackBtn navigation={navigation} />
          <Text style={styles.logoText}>Add a card</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.navLink}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Text style={[styles.screenSub, { marginBottom: 16 }]}>Pick a card to add to your wallet.</Text>

        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
            placeholder="Search cards..." placeholderTextColor={C.text3}
            autoCorrect={false} autoCapitalize="none" />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: C.text3, fontSize: 16, paddingLeft: 8 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {CARDS.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🎉</Text>
            <Text style={{ color: C.text, fontSize: 16, textAlign: 'center' }}>You already own all our cards!</Text>
          </View>
        ) : isSearching ? (
          <>
            <Text style={[styles.fieldLabel, { marginBottom: 12, marginTop: 8 }]}>{searchResults.length} RESULT{searchResults.length !== 1 ? 'S' : ''}</Text>
            {searchResults.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 30 }}>
                <Text style={{ fontSize: 32, marginBottom: 10 }}>🔍</Text>
                <Text style={{ color: C.text2, textAlign: 'center' }}>No cards found for "{search}"</Text>
              </View>
            ) : (
              <View style={styles.cardsGrid}>
                {searchResults.map(card => (
                  <CardTile key={card.id} card={card} selected={ownedCards.includes(card.id)} onToggle={toggleCard} />
                ))}
              </View>
            )}
          </>
        ) : (
          groups.map(group => {
            const featured = (featuredIds[group.id] || []).map(id => CARDS.find(c => c.id === id)).filter(Boolean);
            const allGroupCards = CARDS.filter(c => cardInGroup(c, group));
            const remainingCards = allGroupCards.filter(c => !(featuredIds[group.id] || []).includes(c.id));
            const isExpanded = expandedGroup === group.id;

            if (allGroupCards.length === 0) return null;

            return (
              <View key={group.id} style={{ marginTop: 28 }}>
                <View style={styles.networkHeader}>
                  <View style={[styles.networkDot, { backgroundColor: group.color }]} />
                  <Text style={styles.networkLabel}>{group.label.toUpperCase()}</Text>
                </View>
                <View style={styles.cardsGrid}>
                  {featured.map(card => (
                    <CardTile key={card.id} card={card} selected={ownedCards.includes(card.id)} onToggle={toggleCard} />
                  ))}
                </View>
                {remainingCards.length > 0 && (
                  !isExpanded ? (
                    <TouchableOpacity onPress={() => setExpandedGroup(group.id)} style={styles.seeMoreBtn} activeOpacity={0.7}>
                      <Text style={styles.seeMoreText}>See all {allGroupCards.length} {group.shortLabel} cards →</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <View style={[styles.cardsGrid, { marginTop: 10 }]}>
                        {remainingCards.map(card => (
                          <CardTile key={card.id} card={card} selected={ownedCards.includes(card.id)} onToggle={toggleCard} />
                        ))}
                      </View>
                      <TouchableOpacity onPress={() => setExpandedGroup(null)} style={styles.seeMoreBtn} activeOpacity={0.7}>
                        <Text style={styles.seeMoreText}>Show less ↑</Text>
                      </TouchableOpacity>
                    </>
                  )
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── SETUP ─────────────────────────────────────────────────
function SetupScreen({ navigation }) {
  const { ownedCards, toggleCard, isGuest, session, country } = useApp();
  const [search, setSearch] = useState('');
  const [expandedGroup, setExpandedGroup] = useState(null);

  // Country-aware: cards, groups (networks for CA, banks for IN), featured
  const CARDS = country.cards;
  const featuredIds = country.featuredIds;
  const groups = country.groups;
  const groupKey = country.groupBy; // 'network' or 'bank'

  // Card belongs to group (network for Canada, issuer→bank for India)
  function cardInGroup(card, group) {
    if (groupKey === 'network') return card.network === group.id;
    // For India, match issuer to bank id (e.g. 'HDFC Bank' → 'hdfc')
    return card.issuer.toLowerCase().includes(group.id);
  }

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return CARDS.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.issuer.toLowerCase().includes(q) ||
      c.network.toLowerCase().includes(q) ||
      c.perks.some(p => p.toLowerCase().includes(q))
    );
  }, [search, CARDS]);

  const isSearching = search.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navBar}>
        <View style={styles.logoRow}>
          <CountryPickerBtn navigation={navigation} />
          <LogoBtn navigation={navigation} />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate(session ? 'Dashboard' : 'Checkout')}>
          <Text style={styles.navLink}>{ownedCards.length > 0 ? 'Done' : 'Skip'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Badge label={isGuest ? 'GUEST MODE' : 'MY CARDS'} />
        <Text style={[styles.screenTitle, { marginTop: 12 }]}>Which cards do you own?</Text>
        <Text style={[styles.screenSub, { marginBottom: 20 }]}>Select every card in your wallet.</Text>

        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
            placeholder="Search cards by name, bank, or perk..."
            placeholderTextColor={C.text3} autoCorrect={false} autoCapitalize="none" />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: C.text3, fontSize: 16, paddingLeft: 8 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {ownedCards.length > 0 && !isSearching && (
          <View style={styles.selectedBar}>
            <Text style={styles.selectedBarCount}>{ownedCards.length} card{ownedCards.length !== 1 ? 's' : ''} selected</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {ownedCards.map(id => {
                const card = CARDS.find(c => c.id === id);
                return card ? (
                  <TouchableOpacity key={id} onPress={() => toggleCard(id)} style={styles.chip}>
                    <Text style={styles.chipText}>{card.name} ✕</Text>
                  </TouchableOpacity>
                ) : null;
              })}
            </ScrollView>
          </View>
        )}

        {isSearching ? (
          <>
            <Text style={[styles.fieldLabel, { marginBottom: 12, marginTop: 8 }]}>{searchResults.length} RESULT{searchResults.length !== 1 ? 'S' : ''}</Text>
            {searchResults.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 30 }}>
                <Text style={{ fontSize: 32, marginBottom: 10 }}>🔍</Text>
                <Text style={{ color: C.text2, textAlign: 'center' }}>No cards found for "{search}"</Text>
              </View>
            ) : (
              <View style={styles.cardsGrid}>
                {searchResults.map(card => (
                  <CardTile key={card.id} card={card} selected={ownedCards.includes(card.id)} onToggle={toggleCard} />
                ))}
              </View>
            )}
          </>
        ) : (
          groups.map(group => {
            const featured = (featuredIds[group.id] || []).map(id => CARDS.find(c => c.id === id)).filter(Boolean);
            const allGroupCards = CARDS.filter(c => cardInGroup(c, group));
            const remainingCards = allGroupCards.filter(c => !(featuredIds[group.id] || []).includes(c.id));
            const isExpanded = expandedGroup === group.id;
            const ownedInGroup = allGroupCards.filter(c => ownedCards.includes(c.id)).length;

            if (allGroupCards.length === 0) return null;

            return (
              <View key={group.id} style={{ marginTop: 28 }}>
                <View style={styles.networkHeader}>
                  <View style={[styles.networkDot, { backgroundColor: group.color }]} />
                  <Text style={styles.networkLabel}>{group.label.toUpperCase()}</Text>
                  {ownedInGroup > 0 && (
                    <View style={styles.networkCount}>
                      <Text style={styles.networkCountText}>{ownedInGroup} selected</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardsGrid}>
                  {featured.map(card => (
                    <CardTile key={card.id} card={card} selected={ownedCards.includes(card.id)} onToggle={toggleCard} />
                  ))}
                </View>
                {remainingCards.length > 0 && (
                  !isExpanded ? (
                    <TouchableOpacity onPress={() => setExpandedGroup(group.id)} style={styles.seeMoreBtn} activeOpacity={0.7}>
                      <Text style={styles.seeMoreText}>See all {allGroupCards.length} {group.shortLabel} cards →</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <View style={[styles.cardsGrid, { marginTop: 10 }]}>
                        {remainingCards.map(card => (
                          <CardTile key={card.id} card={card} selected={ownedCards.includes(card.id)} onToggle={toggleCard} />
                        ))}
                      </View>
                      <TouchableOpacity onPress={() => setExpandedGroup(null)} style={styles.seeMoreBtn} activeOpacity={0.7}>
                        <Text style={styles.seeMoreText}>Show less ↑</Text>
                      </TouchableOpacity>
                    </>
                  )
                )}
              </View>
            );
          })
        )}

        <PrimaryBtn label="Continue →" onPress={() => navigation.navigate(session ? 'Dashboard' : 'Checkout')} disabled={ownedCards.length === 0} style={{ marginTop: 28 }} />
        {isGuest && (
          <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.6} style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={[styles.hint, { textAlign: 'center' }]}>
              <Text style={{ color: C.purpleLight, fontWeight: '700' }}>Sign in</Text> to save your cards permanently
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── CHECKOUT ──────────────────────────────────────────────
function CheckoutScreen({ navigation }) {
  const { ownedCards, session, signOut, country, cardOverrides } = useApp();
  const [selectedStore, setSelectedStore] = useState(null);
  const [amount, setAmount] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  // Currency-aware quick amounts (CAD vs INR)
  const quickAmounts = country.code === 'IN' ? [500, 1000, 2500, 5000, 10000] : [25, 50, 100, 200, 500];
  const owned = country.cards.filter(c => ownedCards.includes(c.id));
  const ranked = selectedStore
    ? owned.map(card => ({ card, rate: getEffectiveRate(card, selectedStore.category, cardOverrides) })).sort((a, b) => b.rate - a.rate)
    : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navBar}>
        <View style={styles.logoRow}>
          {session ? (
            <BackBtn navigation={navigation} onPress={() => navigation.navigate('Dashboard')} />
          ) : null}
          <CountryPickerBtn navigation={navigation} />
          <LogoBtn navigation={navigation} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Setup')}>
            <Text style={styles.navLink}>My Cards</Text>
          </TouchableOpacity>
          {session && (
            <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarSmallText}>{(session.email || 'U')[0].toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showMenu && session && (
        <View style={styles.dropdown}>
          <Text style={styles.dropdownEmail} numberOfLines={1}>{session.email}</Text>
          <View style={{ height: 1, backgroundColor: C.glassBorder, marginVertical: 6 }} />
          <TouchableOpacity onPress={async () => { setShowMenu(false); await signOut(); navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); }}>
            <Text style={styles.dropdownItem}>Sign out</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" onScrollBeginDrag={() => setShowMenu(false)}>
        <Text style={styles.screenTitle}>Where are you{'\n'}shopping?</Text>
        <Text style={[styles.screenSub, { marginBottom: 20 }]}>Pick a store and enter the amount.</Text>

        <GlassCard style={{ marginBottom: 14 }}>
          <Text style={styles.fieldLabel}>SELECT A STORE</Text>
          <View style={styles.storeGrid}>
            {country.stores.map(s => (
              <TouchableOpacity key={s.id} onPress={() => setSelectedStore(s)} activeOpacity={0.8}
                style={[styles.storeBtn, selectedStore?.id === s.id && styles.storeBtnActive]}>
                <Text style={styles.storeIcon}>{s.icon}</Text>
                <Text style={[styles.storeLabel, selectedStore?.id === s.id && styles.storeLabelActive]} numberOfLines={1}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={{ marginBottom: 14 }}>
          <Text style={styles.fieldLabel}>PURCHASE AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountPrefix}>{country.currency}</Text>
            <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount}
              keyboardType="decimal-pad" placeholder="0" placeholderTextColor={C.text3} selectionColor={C.purpleLight} />
          </View>
          <View style={styles.quickAmounts}>
            {quickAmounts.map(q => (
              <TouchableOpacity key={q} onPress={() => setAmount(String(q))} style={styles.quickBtn}>
                <Text style={styles.quickBtnText}>{country.currency}{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {selectedStore && owned.length > 0 && (
          <GlassCard style={{ marginBottom: 14 }}>
            <Text style={styles.fieldLabel}>YOUR WALLET PREVIEW</Text>
            {ranked.map(({ card, rate }, i) => {
              const rateColor = rate >= 4 ? C.green : rate >= 2 ? C.amber : C.text3;
              return (
                <View key={card.id} style={[styles.walletRow, i < ranked.length - 1 && { marginBottom: 10 }]}>
                  <CardVis colors={card.color} size="sm" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.walletRowName}>{card.name}</Text>
                    <Text style={styles.walletRowBank}>{card.issuer}</Text>
                  </View>
                  <View style={[styles.ratePill, { borderColor: rateColor + '44', backgroundColor: rateColor + '18' }]}>
                    <Text style={[styles.ratePillText, { color: rateColor }]}>{rate}% back</Text>
                  </View>
                </View>
              );
            })}
          </GlassCard>
        )}

        <PrimaryBtn label="Find my best card →"
          onPress={() => navigation.navigate('Result', { store: selectedStore, amount: parseFloat(amount) })}
          disabled={!selectedStore || !amount || parseFloat(amount) <= 0} />

        {session && (
          <TouchableOpacity onPress={() => navigation.navigate('Recommend')} activeOpacity={0.7} style={[styles.nextCardCta, { marginTop: 16 }]}>
            <Text style={styles.nextCardCtaIcon}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextCardCtaTitle}>Find my next card</Text>
              <Text style={styles.nextCardCtaSub}>Get personalized card recommendations</Text>
            </View>
            <Text style={styles.nextCardCtaArrow}>→</Text>
          </TouchableOpacity>
        )}

        {!session && (
          <View style={styles.guestBanner}>
            <Text style={styles.guestBannerText}><Text style={{ color: C.purpleLight, fontWeight: '700' }}>Sign in</Text> to save your cards permanently</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.linkText, { marginTop: 4 }]}>Sign in free →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── RESULT ────────────────────────────────────────────────
function ResultScreen({ navigation, route }) {
  const { ownedCards, session, country, cardOverrides } = useApp();
  const { store, amount } = route.params;
  const owned = country.cards.filter(c => ownedCards.includes(c.id));
  const ranked = owned.map(card => {
    const rate = getEffectiveRate(card, store.category, cardOverrides);
    return { card, rate, earned: +(amount * rate / 100).toFixed(2) };
  }).sort((a, b) => b.earned - a.earned);
  const best = ranked[0];

  // Save to history for signed-in users (only once per result view)
  useEffect(() => {
    if (!session || !best) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('sr_history');
        const history = raw ? JSON.parse(raw) : [];
        const entry = {
          date: new Date().toISOString(),
          storeId: store.id,
          storeLabel: store.label,
          storeIcon: store.icon,
          amount,
          cardId: best.card.id,
          cardName: best.card.name,
          cardIssuer: best.card.issuer,
          rate: best.rate,
          earned: best.earned,
          currency: country.currency,
        };
        const updated = [entry, ...history].slice(0, 50);
        await AsyncStorage.setItem('sr_history', JSON.stringify(updated));
      } catch (e) {}
    })();
  }, []);

  if (!best) return null;

  const cur = country.currency;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navBar}>
        <View style={styles.logoRow}>
          <LogoBtn navigation={navigation} />
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.navLink}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.fieldLabel}>BEST PICK FOR {store.label.toUpperCase()}</Text>
        <View style={styles.resultBest}>
          <Text style={styles.bestLabel}>★ Best card to use</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <CardVis colors={best.card.color} size="lg" />
            <View>
              <Text style={styles.bestCardName}>{best.card.name}</Text>
              <Text style={styles.bestCardBank}>{best.card.issuer}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text style={styles.rewardAmount}>{cur}{best.earned.toFixed(2)}</Text>
            <Text style={styles.rewardSub}>earned on {cur}{amount.toFixed(2)}</Text>
          </View>
          <View style={styles.rewardRate}>
            <Text style={styles.rewardRateText}>{best.rate}% cash back at {store.label}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 14 }}>
            {best.card.perks.map(p => (
              <View key={p} style={styles.perk}><Text style={styles.perkText}>{p}</Text></View>
            ))}
          </View>
        </View>

        {ranked.length > 1 && (
          <>
            <Text style={[styles.fieldLabel, { marginTop: 20, marginBottom: 10 }]}>ALL YOUR CARDS</Text>
            {ranked.map((item, i) => {
              const rateColor = item.rate >= 4 ? C.green : item.rate >= 2 ? C.amber : C.text3;
              return (
                <View key={item.card.id} style={styles.resultRow}>
                  <Text style={[styles.resultRank, { color: i === 0 ? C.purpleLight : C.text3 }]}>{i === 0 ? '★' : `#${i + 1}`}</Text>
                  <CardVis colors={item.card.color} size="sm" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.walletRowName}>{item.card.name}</Text>
                    <Text style={styles.walletRowBank}>{item.card.issuer}</Text>
                  </View>
                  <View style={[styles.ratePill, { borderColor: rateColor + '44', backgroundColor: rateColor + '18' }]}>
                    <Text style={[styles.ratePillText, { color: rateColor }]}>{item.rate}% · {cur}{item.earned.toFixed(2)}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {!session && (
          <View style={styles.guestBanner}>
            <Text style={styles.guestBannerText}><Text style={{ color: C.purpleLight, fontWeight: '700' }}>Sign in</Text> to save your cards</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.linkText, { marginTop: 4 }]}>Sign in free →</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <GhostBtn label="← Change store" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
          <PrimaryBtn label="New purchase →" onPress={() => navigation.navigate('Checkout')} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── RECOMMEND (Find my next card) ─────────────────────────
// Spending categories. presetsCA / presetsIN are arrays of preset amounts shown as tap chips.
const SPENDING_CATEGORIES = [
  { key: 'grocery', label: 'Groceries', icon: '🛒',
    defaultCA: 400, defaultIN: 8000,
    presetsCA: [0, 100, 200, 400, 600, 800, 1000],
    presetsIN: [0, 2000, 5000, 8000, 12000, 18000, 25000] },
  { key: 'dining', label: 'Restaurants', icon: '🍽️',
    defaultCA: 200, defaultIN: 4000,
    presetsCA: [0, 50, 100, 200, 350, 500, 800],
    presetsIN: [0, 1000, 2500, 4000, 6000, 10000, 15000] },
  { key: 'gas', label: 'Fuel', icon: '⛽',
    defaultCA: 200, defaultIN: 5000,
    presetsCA: [0, 50, 100, 200, 300, 500, 800],
    presetsIN: [0, 1500, 3000, 5000, 8000, 12000, 18000] },
  { key: 'travel', label: 'Travel & Hotels', icon: '✈️',
    defaultCA: 100, defaultIN: 2000,
    presetsCA: [0, 50, 100, 250, 500, 1000, 2000],
    presetsIN: [0, 1000, 2000, 5000, 10000, 20000, 40000] },
  { key: 'online', label: 'Online Shopping', icon: '🛍️',
    defaultCA: 200, defaultIN: 5000,
    presetsCA: [0, 50, 100, 200, 400, 700, 1200],
    presetsIN: [0, 1000, 2500, 5000, 10000, 18000, 30000] },
  { key: 'amazon', label: 'Amazon', icon: '📦',
    defaultCA: 100, defaultIN: 3000,
    presetsCA: [0, 25, 50, 100, 200, 400, 800],
    presetsIN: [0, 500, 1500, 3000, 6000, 10000, 18000] },
  { key: 'streaming', label: 'Streaming', icon: '🎬',
    defaultCA: 30, defaultIN: 500,
    presetsCA: [0, 10, 20, 30, 50, 80, 120],
    presetsIN: [0, 200, 500, 800, 1200, 2000, 3000] },
  { key: 'other', label: 'Everything else', icon: '💳',
    defaultCA: 300, defaultIN: 5000,
    presetsCA: [0, 100, 200, 300, 500, 1000, 2000],
    presetsIN: [0, 1500, 3000, 5000, 10000, 20000, 40000] },
];

function StepperRow({ label, icon, value, onChange, presets, currency, expanded, onToggle }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  function pickPreset(amt) {
    onChange(amt);
    setShowCustom(false);
  }

  function applyCustom() {
    const num = parseFloat(customValue);
    if (!isNaN(num) && num >= 0) {
      onChange(Math.round(num));
    }
    setShowCustom(false);
    setCustomValue('');
  }

  // Is the current value matching any preset?
  const isPreset = presets.includes(value);

  return (
    <View>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.6} style={styles.stepperRow}>
        <Text style={{ fontSize: 22, marginRight: 12 }} allowFontScaling={false}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepperLabel}>{label}</Text>
          <Text style={styles.stepperValue}>{currency}{value.toLocaleString()}/mo</Text>
        </View>
        <Text style={{ color: C.text3, fontSize: 18, marginLeft: 8 }} allowFontScaling={false}>{expanded ? '▴' : '▾'}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.chipsWrap}>
          <View style={styles.chipsRow}>
            {presets.map(amt => {
              const active = value === amt;
              return (
                <TouchableOpacity
                  key={amt}
                  onPress={() => pickPreset(amt)}
                  activeOpacity={0.7}
                  style={[styles.chip2, active && styles.chip2Active]}
                >
                  <Text style={[styles.chip2Text, active && styles.chip2TextActive]}>
                    {amt === 0 ? '0' : `${currency}${amt.toLocaleString()}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              onPress={() => { setShowCustom(true); setCustomValue(String(value)); }}
              activeOpacity={0.7}
              style={[styles.chip2, !isPreset && styles.chip2Active]}
            >
              <Text style={[styles.chip2Text, !isPreset && styles.chip2TextActive]}>
                {!isPreset ? `${currency}${value.toLocaleString()}` : 'Custom'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={showCustom} transparent animationType="fade" onRequestClose={() => setShowCustom(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity activeOpacity={1} onPress={() => setShowCustom(false)} style={styles.gateOverlay}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.gateCard}>
              <Text style={styles.gateTitle}>{icon} {label}</Text>
              <Text style={[styles.gateSub, { marginBottom: 14 }]}>Enter your monthly spending</Text>
              <View style={styles.rateEditWrap}>
                <Text style={[styles.rateEditPct, { marginLeft: 0, marginRight: 4 }]}>{currency}</Text>
                <TextInput
                  style={styles.rateEditInput}
                  value={customValue}
                  onChangeText={t => setCustomValue(t.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  autoFocus
                  selectTextOnFocus
                  textAlign="center"
                  selectionColor={C.purpleLight}
                />
              </View>
              <PrimaryBtn label="Set amount" onPress={applyCustom} style={{ marginTop: 18 }} />
              <TouchableOpacity onPress={() => setShowCustom(false)} style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={styles.linkText}>Cancel</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function RecommendScreen({ navigation }) {
  const { ownedCards, country, session } = useApp();
  const [step, setStep] = useState(1); // 1: spending, 2: results
  const [expandedCat, setExpandedCat] = useState(null);
  const [spending, setSpending] = useState(() => {
    const init = {};
    SPENDING_CATEGORIES.forEach(c => {
      init[c.key] = country.code === 'IN' ? c.defaultIN : c.defaultCA;
    });
    return init;
  });

  const cur = country.currency;

  // Compute recommendations
  const recommendations = useMemo(() => {
    if (step !== 2) return [];
    // Cards user doesn't own
    const candidates = country.cards.filter(c => !ownedCards.includes(c.id));

    // Calculate annual cashback for each candidate
    const scored = candidates.map(card => {
      let annualCashback = 0;
      const breakdown = [];
      Object.entries(spending).forEach(([cat, monthlyAmt]) => {
        const rate = getRate(card, cat);
        const annual = monthlyAmt * 12 * rate / 100;
        annualCashback += annual;
        if (annual > 0) breakdown.push({ cat, rate, annual });
      });
      const netBenefit = annualCashback - (card.annual_fee || 0);
      // Find top 3 categories for this card
      const topCats = breakdown.sort((a, b) => b.annual - a.annual).slice(0, 3);
      return { card, annualCashback, netBenefit, topCats };
    });

    // Sort by net benefit
    return scored.sort((a, b) => b.netBenefit - a.netBenefit).slice(0, 5);
  }, [step, spending, ownedCards, country]);

  const totalMonthly = Object.values(spending).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navBar}>
        <View style={styles.logoRow}>
          <LogoBtn navigation={navigation} />
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.navLink}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {step === 1 ? (
          <>
            <Badge label="FIND YOUR NEXT CARD" />
            <Text style={[styles.screenTitle, { marginTop: 12 }]}>How do you spend?</Text>
            <Text style={[styles.screenSub, { marginBottom: 20 }]}>Approximate monthly spending — we'll find the best card to add to your wallet.</Text>

            <GlassCard style={{ marginBottom: 14 }}>
              <Text style={styles.fieldLabel}>MONTHLY SPENDING (APPROX)</Text>
              {SPENDING_CATEGORIES.map(c => (
                <StepperRow
                  key={c.key}
                  label={c.label}
                  icon={c.icon}
                  value={spending[c.key]}
                  onChange={v => setSpending({ ...spending, [c.key]: v })}
                  presets={country.code === 'IN' ? c.presetsIN : c.presetsCA}
                  currency={cur}
                  expanded={expandedCat === c.key}
                  onToggle={() => setExpandedCat(expandedCat === c.key ? null : c.key)}
                />
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL MONTHLY</Text>
                <Text style={styles.totalValue}>{cur}{totalMonthly.toLocaleString()}</Text>
              </View>
            </GlassCard>

            <PrimaryBtn
              label="See recommendations →"
              onPress={() => setStep(2)}
              disabled={totalMonthly === 0}
              style={{ marginTop: 8 }}
            />
            <Text style={[styles.hint, { textAlign: 'center', marginTop: 12 }]}>
              We compare against {country.cards.filter(c => !ownedCards.includes(c.id)).length} cards you don't own
            </Text>
          </>
        ) : (
          <>
            <Badge label="TOP RECOMMENDATIONS" />
            <Text style={[styles.screenTitle, { marginTop: 12 }]}>Best cards to add</Text>
            <Text style={[styles.screenSub, { marginBottom: 20 }]}>
              Based on {cur}{totalMonthly.toLocaleString()}/month in spending
            </Text>

            {recommendations.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>🎉</Text>
                <Text style={{ color: C.text, fontSize: 16, textAlign: 'center' }}>You already own all our cards!</Text>
              </View>
            ) : (
              recommendations.map((rec, i) => (
                <View key={rec.card.id} style={[styles.recCard, i === 0 && styles.recCardBest]}>
                  {i === 0 && (
                    <View style={styles.recBadge}>
                      <Text style={styles.recBadgeText}>★ TOP PICK</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <CardVis colors={rec.card.color} size="lg" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bestCardName}>{rec.card.name}</Text>
                      <Text style={styles.bestCardBank}>{rec.card.issuer}</Text>
                    </View>
                  </View>

                  <View style={styles.recStats}>
                    <View style={styles.recStat}>
                      <Text style={styles.recStatLabel}>Annual cashback</Text>
                      <Text style={styles.recStatValueG}>+{cur}{rec.annualCashback.toFixed(0)}</Text>
                    </View>
                    <View style={styles.recStat}>
                      <Text style={styles.recStatLabel}>Annual fee</Text>
                      <Text style={[styles.recStatValue, rec.card.annual_fee > 0 && { color: C.amber }]}>
                        {rec.card.annual_fee > 0 ? `−${cur}${rec.card.annual_fee}` : 'Free'}
                      </Text>
                    </View>
                    <View style={styles.recStat}>
                      <Text style={styles.recStatLabel}>Net benefit</Text>
                      <Text style={[styles.recStatValueG, rec.netBenefit < 0 && { color: C.red }]}>
                        {rec.netBenefit >= 0 ? '+' : ''}{cur}{rec.netBenefit.toFixed(0)}
                      </Text>
                    </View>
                  </View>

                  {rec.topCats.length > 0 && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.fieldLabel}>BEST FOR</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {rec.topCats.map(tc => (
                          <View key={tc.cat} style={styles.recCatPill}>
                            <Text style={styles.recCatPillText}>
                              {tc.rate}% {SPENDING_CATEGORIES.find(c => c.key === tc.cat)?.label || tc.cat}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 12 }}>
                    {rec.card.perks.map(p => (
                      <View key={p} style={styles.perk}><Text style={styles.perkText}>{p}</Text></View>
                    ))}
                  </View>
                </View>
              ))
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <GhostBtn label="← Adjust spending" onPress={() => setStep(1)} style={{ flex: 1 }} />
              <PrimaryBtn label="Done" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── DASHBOARD (signed-in landing) ────────────────────────
function DashboardScreen({ navigation }) {
  const { session, profile, signOut, country, ownedCards } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const [history, setHistory] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  // Animate menu in/out
  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: showMenu ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showMenu]);

  // Reload history when screen focuses
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const raw = await AsyncStorage.getItem('sr_history');
      setHistory(raw ? JSON.parse(raw) : []);
    });
    return unsubscribe;
  }, [navigation]);

  // Calculate this month's savings
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const monthEntries = history.filter(h => {
    const d = new Date(h.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear && h.currency === country.currency;
  });
  const monthSavings = monthEntries.reduce((sum, h) => sum + (h.earned || 0), 0);

  const recent = history.slice(0, 5);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = profile?.first_name || (session?.email || '').split('@')[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navBar}>
        <View style={styles.logoRow}>
          <CountryPickerBtn navigation={navigation} />
          <LogoBtn navigation={navigation} />
        </View>
        <TouchableOpacity onPress={() => setShowMenu(!showMenu)} activeOpacity={0.7}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>{(displayName || 'U')[0].toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {showMenu && (
        <Animated.View
          style={[
            styles.profileMenu,
            {
              opacity: menuAnim,
              transform: [{
                translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }),
              }, {
                scale: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }),
              }],
            },
          ]}
        >
          <View style={styles.profileMenuHeader}>
            <Text style={styles.profileMenuName} numberOfLines={1}>{profile?.first_name} {profile?.last_name}</Text>
            <Text style={styles.profileMenuEmail} numberOfLines={1}>@{profile?.username || session?.email}</Text>
          </View>
          <View style={styles.profileMenuActions}>
            <TouchableOpacity
              onPress={() => { setShowMenu(false); navigation.navigate('Profile'); }}
              activeOpacity={0.6}
              style={[styles.profileMenuBtn, styles.profileMenuBtnLeft]}
            >
              <Text style={styles.profileMenuBtnIcon}>👤</Text>
              <Text style={styles.profileMenuBtnText}>My Profile</Text>
            </TouchableOpacity>
            <View style={styles.profileMenuDivider} />
            <TouchableOpacity
              onPress={async () => { setShowMenu(false); await signOut(); navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); }}
              activeOpacity={0.6}
              style={[styles.profileMenuBtn, styles.profileMenuBtnRight]}
            >
              <Text style={styles.profileMenuBtnIcon}>↗</Text>
              <Text style={[styles.profileMenuBtnText, { color: C.red }]}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} onScrollBeginDrag={() => setShowMenu(false)}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.dashGreeting}>{greeting}{displayName ? `, ${displayName}` : ''} 👋</Text>
          <Text style={styles.dashSub}>Ready to earn the most cashback today?</Text>

          {/* Savings tracker */}
          <View style={styles.savingsCard}>
            <Text style={styles.savingsLabel}>YOU'VE EARNED THIS MONTH</Text>
            <Text style={styles.savingsAmount}>{country.currency}{monthSavings.toFixed(2)}</Text>
            <Text style={styles.savingsSub}>
              {history.length === 0 ? 'Make your first purchase to start tracking' : `From ${monthEntries.length} purchase${monthEntries.length !== 1 ? 's' : ''}`}
            </Text>
          </View>

          {/* Primary action */}
          <TouchableOpacity onPress={() => navigation.navigate('Checkout')} activeOpacity={0.8} style={styles.dashPrimary}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dashPrimaryTitle}>Find best card →</Text>
              <Text style={styles.dashPrimarySub}>Pick a store, see your top card</Text>
            </View>
            <Text style={{ fontSize: 30 }}>🛒</Text>
          </TouchableOpacity>

          {/* Recent purchases */}
          {recent.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent</Text>
              </View>
              {recent.map((h, i) => (
                <View key={i} style={styles.recentRow}>
                  <View style={styles.recentIconWrap}>
                    <Text style={{ fontSize: 18 }}>{h.storeIcon || '💳'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentStore}>{h.storeLabel}</Text>
                    <Text style={styles.recentMeta}>{h.cardName} · {new Date(h.date).toLocaleDateString()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.recentEarned}>+{h.currency}{h.earned.toFixed(2)}</Text>
                    <Text style={styles.recentAmount}>on {h.currency}{h.amount.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Find my next card CTA */}
          <TouchableOpacity onPress={() => navigation.navigate('Recommend')} activeOpacity={0.7} style={[styles.nextCardCta, { width: '100%', marginTop: 18 }]}>
            <Text style={styles.nextCardCtaIcon}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.nextCardCtaTitle}>Find my next card</Text>
              <Text style={styles.nextCardCtaSub}>Personalized recommendations based on your spending</Text>
            </View>
            <Text style={styles.nextCardCtaArrow}>→</Text>
          </TouchableOpacity>

          {/* My Wallet button */}
          <TouchableOpacity onPress={() => navigation.navigate('MyCards')} activeOpacity={0.7} style={styles.walletBtn}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>👛</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.walletBtnTitle}>My Wallet</Text>
              <Text style={styles.walletBtnSub}>{ownedCards.length} card{ownedCards.length !== 1 ? 's' : ''} · Tap to view & manage</Text>
            </View>
            <Text style={styles.nextCardCtaArrow}>→</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── ONBOARDING ────────────────────────────────────────────
const ONBOARDING_SLIDES = [
  {
    icon: '💳',
    title: 'Add your cards',
    sub: 'Tell us which credit cards you have. We support 90+ cards across major banks.',
    accent: '#a78bfa',
  },
  {
    icon: '🛒',
    title: 'Pick where you\'re shopping',
    sub: 'Grocery, gas, dining, travel — wherever you are, we\'ll find your best card instantly.',
    accent: '#34d399',
  },
  {
    icon: '✨',
    title: 'Always swipe the right card',
    sub: 'See exactly how much cashback you\'ll earn. Never leave money on the table again.',
    accent: '#f59e0b',
  },
];

function OnboardingScreen({ navigation }) {
  const { setHasOnboarded } = useApp();
  const [idx, setIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  function transitionTo(newIdx) {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setIdx(newIdx);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
      ]).start();
    });
  }

  async function finish() {
    await AsyncStorage.setItem('sr_onboarded', '1');
    setHasOnboarded(true);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }

  function handleNext() {
    if (idx < ONBOARDING_SLIDES.length - 1) {
      transitionTo(idx + 1);
    } else {
      finish();
    }
  }

  const slide = ONBOARDING_SLIDES[idx];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.onbTop}>
        <TouchableOpacity onPress={finish}>
          <Text style={styles.navLink}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.onbBody}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }], alignItems: 'center', width: '100%' }}>
          <View style={[styles.onbIconWrap, { backgroundColor: slide.accent + '22', borderColor: slide.accent + '55' }]}>
            <Text style={styles.onbIcon}>{slide.icon}</Text>
          </View>
          <Text style={styles.onbTitle}>{slide.title}</Text>
          <Text style={styles.onbSub}>{slide.sub}</Text>
        </Animated.View>
      </View>

      <View style={styles.onbFooter}>
        <View style={styles.onbDots}>
          {ONBOARDING_SLIDES.map((_, i) => (
            <View key={i} style={[styles.onbDot, i === idx && styles.onbDotActive]} />
          ))}
        </View>
        <PrimaryBtn
          label={idx === ONBOARDING_SLIDES.length - 1 ? 'Get started →' : 'Next →'}
          onPress={handleNext}
          style={{ width: width - 48 }}
        />
      </View>
    </SafeAreaView>
  );
}

// ── MAIN APP ──────────────────────────────────────────────
const navTheme = {
  dark: true,
  colors: { background: C.bg, primary: C.purple, card: C.bg, text: C.text, border: C.glassBorder, notification: C.purple },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '800' },
  },
};

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ownedCards, setOwnedCards] = useState([]);
  const [cardOverrides, setCardOverrides] = useState({});
  const [isGuest, setIsGuest] = useState(false);
  const [booting, setBooting] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Home');
  const [countryCode, setCountryCodeState] = useState('CA');
  const [hasOnboarded, setHasOnboarded] = useState(true);

  async function saveOverrides(next) {
    setCardOverrides(next);
    await AsyncStorage.setItem('sr_card_overrides', JSON.stringify(next));
  }

  async function setCountryCode(code) {
    setCountryCodeState(code);
    await AsyncStorage.setItem('sr_country', code);
  }

  const country = COUNTRIES[countryCode] || COUNTRIES.CA;

  async function saveCards(cards) {
    setOwnedCards(cards);
    await AsyncStorage.setItem('sr_cards', JSON.stringify(cards));
    if (session) {
      await sb.from('user_cards').upsert({ user_id: session.id, cards, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    }
  }

  function toggleCard(id) {
    const newCards = ownedCards.includes(id) ? ownedCards.filter(c => c !== id) : [...ownedCards, id];
    saveCards(newCards);
  }

  async function signOut() {
    await sb.auth.signOut();
    await AsyncStorage.removeItem('sr_cards');
    await AsyncStorage.removeItem('sr_history');
    await AsyncStorage.removeItem('sr_card_overrides');
    setSession(null);
    setProfile(null);
    setOwnedCards([]);
    setCardOverrides({});
    setIsGuest(false);
  }

  useEffect(() => {
    async function boot() {
      // Check if user has seen onboarding
      const onboarded = await AsyncStorage.getItem('sr_onboarded');
      if (!onboarded) {
        setHasOnboarded(false);
        setInitialRoute('Onboarding');
      }

      // Load saved country first, otherwise auto-detect
      const savedCountry = await AsyncStorage.getItem('sr_country');
      if (savedCountry && COUNTRIES[savedCountry]) {
        setCountryCodeState(savedCountry);
      } else {
        const detected = detectCountry();
        setCountryCodeState(detected);
        await AsyncStorage.setItem('sr_country', detected);
      }

      const { data: { session: s } } = await sb.auth.getSession();
      const saved = await AsyncStorage.getItem('sr_cards');
      if (saved) setOwnedCards(JSON.parse(saved));
      const savedOverrides = await AsyncStorage.getItem('sr_card_overrides');
      if (savedOverrides) setCardOverrides(JSON.parse(savedOverrides));
      if (s) {
        setSession({ id: s.user.id, email: s.user.email });
        // Load profile (with retry for race conditions)
        async function fetchProfileBoot() {
          const { data: p } = await sb.from('profiles').select('*').eq('id', s.user.id).maybeSingle();
          return p;
        }
        let profileData = await fetchProfileBoot();
        if (!profileData) {
          await new Promise(r => setTimeout(r, 400));
          profileData = await fetchProfileBoot();
        }
        if (profileData) setProfile(profileData);
        const { data } = await sb.from('user_cards').select('cards').eq('user_id', s.user.id).maybeSingle();
        if (data?.cards) { setOwnedCards(data.cards); await AsyncStorage.setItem('sr_cards', JSON.stringify(data.cards)); }
        // Routing logic
        if (onboarded) {
          if (!profileData) {
            setInitialRoute('ProfileSetup');
          } else if (!data?.cards || data.cards.length === 0) {
            setInitialRoute('Setup');
          } else {
            setInitialRoute('Dashboard');
          }
        }
      }
      setBooting(false);
    }
    boot();
  }, []);

  if (booting) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.purpleLight} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppContext.Provider value={{ session, setSession, profile, setProfile, ownedCards, setOwnedCards, toggleCard, saveCards, isGuest, setIsGuest, signOut, countryCode, setCountryCode, country, hasOnboarded, setHasOnboarded, cardOverrides, saveOverrides }}>
        <NavigationContainer theme={navTheme}>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: C.bg },
              animationDuration: 280,
            }}
          >
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="MyCards" component={MyCardsScreen} />
            <Stack.Screen name="CardDetail" component={CardDetailScreen} />
            <Stack.Screen name="AddCards" component={AddCardsScreen} />
            <Stack.Screen name="Setup" component={SetupScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
            <Stack.Screen name="Recommend" component={RecommendScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppContext.Provider>
    </SafeAreaProvider>
  );
}

// ── STYLES ────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  homeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  homeScrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  homeTopBar: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8, zIndex: 10, position: 'relative' },
  countryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6 },
  countryFlag: { fontSize: 18 },
  countryArrow: { color: C.text3, fontSize: 11, marginLeft: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-start', alignItems: 'flex-start', paddingTop: 100, paddingLeft: 20 },
  countryMenu: { backgroundColor: C.bg2, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 14, padding: 12, minWidth: 200, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14 },
  countryMenuTitle: { fontSize: 10, fontWeight: '700', color: C.text3, letterSpacing: 1, marginBottom: 8, paddingHorizontal: 6 },
  countryItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10 },
  countryItemActive: { backgroundColor: C.purpleDim },
  countryItemText: { flex: 1, color: C.text, fontSize: 15, fontWeight: '600' },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.glassBorder },
  navLink: { color: C.text2, fontSize: 14, fontWeight: '500' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoMark: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.purple, justifyContent: 'center', alignItems: 'center' },
  logoMarkText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  logoText: { fontSize: 18, fontWeight: '800', color: C.purpleLight, letterSpacing: -0.5 },
  avatarSmall: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.purple, justifyContent: 'center', alignItems: 'center' },
  avatarSmallText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  dropdown: { position: 'absolute', top: 60, right: 14, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 12, padding: 12, minWidth: 180, zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12 },
  dropdownEmail: { color: C.text2, fontSize: 12, marginBottom: 2 },
  dropdownItem: { color: C.red, fontSize: 14, fontWeight: '600', paddingVertical: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.purpleDim, borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 28 },
  badgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.purpleLight },
  badgeText: { fontSize: 10, fontWeight: '700', color: C.purpleLight, letterSpacing: 0.8 },
  heroTitle: { fontSize: 52, fontWeight: '800', color: C.text, textAlign: 'center', letterSpacing: -2, lineHeight: 56, marginBottom: 18 },
  heroTitleAccent: { color: C.purpleLight },
  heroSub: { fontSize: 16, color: C.text2, textAlign: 'center', lineHeight: 24, marginBottom: 36, maxWidth: 320 },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 32 },
  featPill: { backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7 },
  featPillText: { fontSize: 12, color: C.text2, fontWeight: '500' },
  loginContainer: { padding: 24, paddingTop: 16, paddingBottom: 60 },
  backBtn: { marginBottom: 28 },
  backBtnText: { color: C.text2, fontSize: 14 },
  // New big-tap-target back button
  backBtnNew: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 2, marginLeft: -6 },
  backBtnNewText: { color: C.text, fontSize: 26, fontWeight: '400', lineHeight: 26, marginTop: -2 },
  // Tappable logo row
  logoBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  screenTitle: { fontSize: 32, fontWeight: '800', color: C.text, letterSpacing: -1, marginBottom: 8, marginTop: 12 },
  screenSub: { fontSize: 15, color: C.text2, lineHeight: 22, marginBottom: 4 },
  glassCard: { backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 18, padding: 20 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: C.text3, letterSpacing: 1, marginBottom: 12 },
  glassInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.glassBorder, borderRadius: 12, padding: 14, fontSize: 15, color: C.text, marginBottom: 4 },
  errorText: { color: C.red, fontSize: 13, marginBottom: 8 },
  primaryBtn: { backgroundColor: C.purple, borderRadius: 14, padding: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnDisabled: { opacity: 0.35 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ghostBtn: { backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 14, padding: 15, alignItems: 'center' },
  ghostBtnText: { color: C.text2, fontSize: 15, fontWeight: '600' },
  emailPill: { backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 10, padding: 10, marginBottom: 20, marginTop: 8 },
  emailPillText: { color: C.text, fontWeight: '600', fontSize: 14 },
  otpRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 16 },
  otpBox: { width: (width - 48 - 40) / 6, height: 58, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.glassBorder, borderRadius: 12, fontSize: 22, fontWeight: '700', color: C.text, textAlign: 'center' },
  otpBoxFilled: { borderColor: 'rgba(124,58,237,0.6)', backgroundColor: 'rgba(124,58,237,0.1)' },
  linkText: { color: C.purpleLight, fontSize: 14, fontWeight: '600' },
  hint: { color: C.text3, fontSize: 13 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 14, color: C.text, padding: 0 },
  selectedBar: { backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 14, padding: 12, marginBottom: 8 },
  selectedBarCount: { fontSize: 12, fontWeight: '700', color: C.purpleLight },
  chip: { backgroundColor: C.purpleDim, borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6 },
  chipText: { color: C.purpleLight, fontSize: 11, fontWeight: '600' },
  networkHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  networkDot: { width: 8, height: 8, borderRadius: 4 },
  networkLabel: { fontSize: 11, fontWeight: '700', color: C.text3, letterSpacing: 1, flex: 1 },
  networkCount: { backgroundColor: C.purpleDim, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  networkCountText: { color: C.purpleLight, fontSize: 10, fontWeight: '700' },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cardTile: { width: (width - 50) / 2, backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 16, padding: 14, position: 'relative' },
  cardTileSelected: { borderColor: 'rgba(124,58,237,0.7)', backgroundColor: 'rgba(124,58,237,0.1)' },
  checkBadge: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, backgroundColor: C.purple, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  cardTileName: { fontSize: 13, fontWeight: '700', color: C.text, marginTop: 10, marginBottom: 2 },
  cardTileBank: { fontSize: 11, color: C.text3, marginBottom: 6 },
  cardTilePerk: { fontSize: 10, color: C.text3 },
  seeMoreBtn: { backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 10 },
  seeMoreText: { color: C.purpleLight, fontSize: 13, fontWeight: '600' },
  storeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  storeBtn: { width: (width - 110) / 3, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.glassBorder, borderRadius: 14, padding: 12, alignItems: 'center', gap: 5 },
  storeBtnActive: { backgroundColor: C.purpleDim, borderColor: 'rgba(124,58,237,0.6)' },
  storeIcon: { fontSize: 22 },
  storeLabel: { fontSize: 10, fontWeight: '600', color: C.text2, textAlign: 'center' },
  storeLabelActive: { color: C.purpleLight },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountPrefix: { fontSize: 28, fontWeight: '300', color: C.text3, paddingRight: 4 },
  amountInput: { flex: 1, fontSize: 34, fontWeight: '800', color: C.text, letterSpacing: -1 },
  quickAmounts: { flexDirection: 'row', gap: 7, marginTop: 12, flexWrap: 'wrap' },
  quickBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.glassBorder, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6 },
  quickBtnText: { color: C.text2, fontSize: 13, fontWeight: '500' },
  walletRow: { flexDirection: 'row', alignItems: 'center' },
  walletRowName: { fontSize: 13, fontWeight: '700', color: C.text },
  walletRowBank: { fontSize: 11, color: C.text3, marginTop: 2 },
  ratePill: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  ratePillText: { fontSize: 12, fontWeight: '700' },
  guestBanner: { backgroundColor: 'rgba(124,58,237,0.08)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)', borderRadius: 14, padding: 16, marginTop: 16, alignItems: 'center' },
  guestBannerText: { color: C.text2, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  resultBest: { backgroundColor: 'rgba(124,58,237,0.15)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.35)', borderRadius: 22, padding: 22, marginTop: 12 },
  bestLabel: { fontSize: 11, fontWeight: '700', color: C.purpleLight, letterSpacing: 0.5, marginBottom: 14 },
  bestCardName: { fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  bestCardBank: { fontSize: 13, color: C.text2, marginTop: 2 },
  rewardAmount: { fontSize: 44, fontWeight: '800', color: C.green, letterSpacing: -2 },
  rewardSub: { fontSize: 14, color: C.text2 },
  rewardRate: { backgroundColor: 'rgba(52,211,153,0.12)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 5, alignSelf: 'flex-start', marginTop: 10 },
  rewardRateText: { color: C.green, fontSize: 13, fontWeight: '700' },
  perk: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: C.glassBorder, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  perkText: { color: C.text3, fontSize: 10, fontWeight: '600' },
  resultRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 14, padding: 14, marginBottom: 8 },
  resultRank: { fontSize: 13, fontWeight: '800', width: 24, textAlign: 'center', marginRight: 8 },
  // Find my next card CTA
  nextCardCta: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.35)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, marginTop: 18, width: width - 48 },
  nextCardCtaIcon: { fontSize: 24 },
  nextCardCtaTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  nextCardCtaSub: { fontSize: 12, color: C.text2, marginTop: 2 },
  nextCardCtaArrow: { color: C.purpleLight, fontSize: 20, fontWeight: '700' },
  // Sign-in gate modal
  gateOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  gateCard: { backgroundColor: C.bg2, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 22, padding: 26, width: '100%', maxWidth: 360 },
  gateTitle: { fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  gateSub: { fontSize: 14, color: C.text2, textAlign: 'center', lineHeight: 20 },
  // Stepper
  stepperRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  stepperLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  stepperValue: { fontSize: 12, color: C.text2, marginTop: 2 },
  stepperBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.purpleDim, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
  stepperBtnText: { color: C.purpleLight, fontSize: 18, fontWeight: '700' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, marginTop: 4, borderTopWidth: 1, borderTopColor: C.glassBorder },
  totalLabel: { fontSize: 11, fontWeight: '700', color: C.text3, letterSpacing: 1 },
  totalValue: { fontSize: 18, fontWeight: '800', color: C.purpleLight },
  sliderWrap: { paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  sliderTrack: { height: 36, justifyContent: 'center' },
  sliderTrackBg: { position: 'absolute', left: 0, right: 0, top: 16, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  sliderFill: { position: 'absolute', left: 0, top: 16, height: 4, backgroundColor: '#a78bfa', borderRadius: 2 },
  sliderThumb: { position: 'absolute', top: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', borderWidth: 2, borderColor: '#7c3aed', marginLeft: -10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 2 },
  sliderLabelText: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  // Chips selector for spending presets
  chipsWrap: { paddingTop: 12, paddingBottom: 16, paddingHorizontal: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip2: { backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 9 },
  chip2Active: { backgroundColor: 'rgba(124,58,237,0.20)', borderColor: C.purpleLight },
  chip2Text: { color: C.text2, fontSize: 13, fontWeight: '600' },
  chip2TextActive: { color: C.purpleLight, fontWeight: '700' },
  // Onboarding
  onbTop: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 12 },
  onbBody: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  onbIconWrap: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', borderWidth: 2, marginBottom: 32 },
  onbIcon: { fontSize: 56 },
  onbTitle: { fontSize: 32, fontWeight: '800', color: C.text, textAlign: 'center', letterSpacing: -1, marginBottom: 14 },
  onbSub: { fontSize: 16, color: C.text2, textAlign: 'center', lineHeight: 24, paddingHorizontal: 12 },
  onbFooter: { paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  onbDots: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  onbDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  onbDotActive: { width: 24, backgroundColor: C.purpleLight },
  // Dashboard
  dashGreeting: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5, marginTop: 4 },
  dashSub: { fontSize: 15, color: C.text2, marginTop: 4, marginBottom: 22 },
  savingsCard: { backgroundColor: 'rgba(52,211,153,0.10)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.30)', borderRadius: 22, padding: 22, marginBottom: 16 },
  savingsLabel: { fontSize: 11, fontWeight: '700', color: C.green, letterSpacing: 1, marginBottom: 8 },
  savingsAmount: { fontSize: 44, fontWeight: '800', color: C.green, letterSpacing: -2 },
  savingsSub: { fontSize: 13, color: C.text2, marginTop: 6 },
  dashPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.purple, borderRadius: 18, padding: 22, marginBottom: 16 },
  dashPrimaryTitle: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  dashPrimarySub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  sectionHeader: { marginTop: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  recentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 14, padding: 14, marginBottom: 8 },
  recentIconWrap: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recentStore: { color: C.text, fontSize: 15, fontWeight: '700' },
  recentMeta: { color: C.text3, fontSize: 12, marginTop: 2 },
  recentEarned: { color: C.green, fontSize: 15, fontWeight: '800' },
  recentAmount: { color: C.text3, fontSize: 11, marginTop: 2 },
  // Profile menu (animated dropdown)
  profileMenu: { position: 'absolute', top: 64, right: 16, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 16, padding: 12, minWidth: 260, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 16, zIndex: 100 },
  profileMenuHeader: { paddingHorizontal: 8, paddingVertical: 6, marginBottom: 6 },
  profileMenuName: { color: C.text, fontSize: 14, fontWeight: '700' },
  profileMenuEmail: { color: C.text3, fontSize: 12, marginTop: 2 },
  profileMenuActions: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, overflow: 'hidden' },
  profileMenuBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 },
  profileMenuBtnLeft: {},
  profileMenuBtnRight: {},
  profileMenuDivider: { width: 1, height: 36, backgroundColor: C.glassBorder },
  profileMenuBtnIcon: { fontSize: 18, marginBottom: 4 },
  profileMenuBtnText: { color: C.text, fontSize: 13, fontWeight: '700' },
  // Wallet button on dashboard
  walletBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(124,58,237,0.10)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.30)', borderRadius: 16, padding: 16, marginTop: 12 },
  walletBtnTitle: { color: C.text, fontSize: 15, fontWeight: '700' },
  walletBtnSub: { color: C.text2, fontSize: 12, marginTop: 2 },
  // Profile setup / edit
  profInput: { backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 12, padding: 14, color: C.text, fontSize: 16, marginTop: 6 },
  usernamePrefix: { position: 'absolute', left: 14, top: 20, color: C.text3, fontSize: 16, fontWeight: '600', zIndex: 1 },
  usernameStatus: { fontSize: 12, marginTop: 6, fontWeight: '600' },
  countryChoices: { flexDirection: 'row', gap: 10, marginTop: 6 },
  countryChoice: { flex: 1, alignItems: 'center', backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 14, paddingVertical: 16, gap: 6 },
  countryChoiceActive: { backgroundColor: 'rgba(124,58,237,0.15)', borderColor: C.purpleLight },
  countryChoiceText: { color: C.text, fontSize: 14, fontWeight: '700' },
  // Profile screen
  profileHero: { alignItems: 'center', marginBottom: 28, paddingTop: 8 },
  profileAvatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.purple, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  profileAvatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  profileName: { color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  profileHandle: { color: C.purpleLight, fontSize: 14, fontWeight: '700', marginTop: 4 },
  profileEmail: { color: C.text3, fontSize: 13, marginTop: 4 },
  // My Wallet screen
  walletCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 18, padding: 16, marginBottom: 12 },
  walletCardName: { color: C.text, fontSize: 16, fontWeight: '700' },
  walletCardBank: { color: C.text2, fontSize: 13, marginTop: 2 },
  walletCardPerk: { color: C.text3, fontSize: 11, marginTop: 6 },
  removeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(248,113,113,0.15)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.4)', justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { color: C.red, fontSize: 14, fontWeight: '800' },
  // Custom rates badge
  customBadge: { backgroundColor: 'rgba(167,139,250,0.15)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.4)', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  customBadgeText: { color: C.purpleLight, fontSize: 10, fontWeight: '700' },
  // Card detail hero
  cardHero: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 18, padding: 18, marginBottom: 18 },
  cardHeroName: { color: C.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  cardHeroBank: { color: C.text2, fontSize: 13, marginTop: 4 },
  cardHeroFee: { color: C.text3, fontSize: 12, marginTop: 6, fontWeight: '600' },
  // Rate row
  rateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 14, padding: 14, marginBottom: 8 },
  rateRowLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
  rateRowDefault: { color: C.text3, fontSize: 11, marginTop: 2 },
  rateValueWrap: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, minWidth: 64, alignItems: 'center' },
  rateValueWrapEdit: { backgroundColor: 'rgba(167,139,250,0.15)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.4)' },
  rateValue: { fontSize: 16, fontWeight: '800' },
  rateResetBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  rateResetText: { color: C.text2, fontSize: 14 },
  // Rate edit modal
  rateEditWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 14, paddingVertical: 14, marginTop: 8 },
  rateEditInput: { color: C.text, fontSize: 36, fontWeight: '800', minWidth: 100, padding: 0 },
  rateEditPct: { color: C.text2, fontSize: 28, fontWeight: '700', marginLeft: 4 },
  // Remove buttons
  removeCardBtn: { borderWidth: 1, borderColor: 'rgba(248,113,113,0.4)', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 22 },
  removeCardBtnText: { color: C.red, fontSize: 14, fontWeight: '700' },
  removeConfirmBtn: { backgroundColor: 'rgba(248,113,113,0.15)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.4)', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  removeConfirmBtnText: { color: C.red, fontSize: 15, fontWeight: '700' },
  // Recommend cards
  recCard: { backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderRadius: 18, padding: 18, marginBottom: 12 },
  recCardBest: { backgroundColor: 'rgba(124,58,237,0.12)', borderColor: 'rgba(124,58,237,0.4)' },
  recBadge: { backgroundColor: C.purple, alignSelf: 'flex-start', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 },
  recBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  recStats: { flexDirection: 'row', gap: 10, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12 },
  recStat: { flex: 1, alignItems: 'center' },
  recStatLabel: { fontSize: 9, fontWeight: '700', color: C.text3, letterSpacing: 0.5, marginBottom: 4 },
  recStatValue: { fontSize: 14, fontWeight: '800', color: C.text },
  recStatValueG: { fontSize: 14, fontWeight: '800', color: C.green },
  recCatPill: { backgroundColor: 'rgba(52,211,153,0.12)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  recCatPillText: { color: C.green, fontSize: 11, fontWeight: '700' },
});
