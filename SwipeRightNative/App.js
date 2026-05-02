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

// ── COUNTRY PICKER ────────────────────────────────────────
function CountryPickerBtn({ light = false }) {
  const { country, countryCode, setCountryCode, ownedCards, setOwnedCards } = useApp();
  const [open, setOpen] = useState(false);

  async function handleSwitch(newCode) {
    if (newCode === countryCode) { setOpen(false); return; }
    // Filter out cards that don't exist in the new country
    const newCountryCardIds = COUNTRIES[newCode].cards.map(c => c.id);
    const filtered = ownedCards.filter(id => newCountryCardIds.includes(id));
    setOwnedCards(filtered);
    await AsyncStorage.setItem('sr_cards', JSON.stringify(filtered));
    await setCountryCode(newCode);
    setOpen(false);
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
      <View style={styles.homeContainer}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
          <View style={[styles.logoRow, { marginBottom: 20 }]}>
            <View style={styles.logoMark}><Text style={styles.logoMarkText}>↗</Text></View>
            <Text style={styles.logoText}>SwipeRightt</Text>
          </View>
          <Badge label="SMART CARD OPTIMIZATION" />
          <Text style={styles.heroTitle}>Always swipe{'\n'}the <Text style={styles.heroTitleAccent}>right card.</Text></Text>
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
      </View>

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
  const { setSession, setOwnedCards, ownedCards } = useApp();
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
      const { data: cardData } = await sb.from('user_cards').select('cards').eq('user_id', s.id).single();
      let hasCards = ownedCards.length > 0;
      if (cardData?.cards) {
        setOwnedCards(cardData.cards);
        await AsyncStorage.setItem('sr_cards', JSON.stringify(cardData.cards));
        hasCards = cardData.cards.length > 0;
      }
      navigation.reset({ index: 0, routes: [{ name: hasCards ? 'Checkout' : 'Setup' }] });
    }
  }

  function handleOtpChange(val, i) {
    const v = val.replace(/\D/g, '');
    const newOtp = [...otp];
    if (v) {
      // typing a digit
      newOtp[i] = v[v.length - 1];
      setOtp(newOtp);
      if (i < 5) inputRefs.current[i + 1]?.focus();
    } else {
      // deleting (backspace)
      if (newOtp[i]) {
        newOtp[i] = '';
        setOtp(newOtp);
      } else if (i > 0) {
        newOtp[i - 1] = '';
        setOtp(newOtp);
        inputRefs.current[i - 1]?.focus();
      }
    }
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
                      if (nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
                        const newOtp = [...otp];
                        newOtp[i - 1] = '';
                        setOtp(newOtp);
                        inputRefs.current[i - 1]?.focus();
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
          <CountryPickerBtn />
          <View style={styles.logoMark}><Text style={styles.logoMarkText}>↗</Text></View>
          <Text style={styles.logoText}>SwipeRightt</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Checkout')}>
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

        <PrimaryBtn label="Continue →" onPress={() => navigation.navigate('Checkout')} disabled={ownedCards.length === 0} style={{ marginTop: 28 }} />
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
  const { ownedCards, session, signOut, country } = useApp();
  const [selectedStore, setSelectedStore] = useState(null);
  const [amount, setAmount] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  // Currency-aware quick amounts (CAD vs INR)
  const quickAmounts = country.code === 'IN' ? [500, 1000, 2500, 5000, 10000] : [25, 50, 100, 200, 500];
  const owned = country.cards.filter(c => ownedCards.includes(c.id));
  const ranked = selectedStore
    ? owned.map(card => ({ card, rate: getRate(card, selectedStore.category) })).sort((a, b) => b.rate - a.rate)
    : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navBar}>
        <View style={styles.logoRow}>
          <CountryPickerBtn />
          <View style={styles.logoMark}><Text style={styles.logoMarkText}>↗</Text></View>
          <Text style={styles.logoText}>SwipeRightt</Text>
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
  const { ownedCards, session, country } = useApp();
  const { store, amount } = route.params;
  const owned = country.cards.filter(c => ownedCards.includes(c.id));
  const ranked = owned.map(card => {
    const rate = getRate(card, store.category);
    return { card, rate, earned: +(amount * rate / 100).toFixed(2) };
  }).sort((a, b) => b.earned - a.earned);
  const best = ranked[0];

  if (!best) return null;

  const cur = country.currency;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navBar}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}><Text style={styles.logoMarkText}>↗</Text></View>
          <Text style={styles.logoText}>SwipeRightt</Text>
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
const SPENDING_CATEGORIES = [
  { key: 'grocery', label: 'Groceries', icon: '🛒', defaultCA: 400, defaultIN: 8000, maxCA: 2000, maxIN: 40000, stepCA: 50, stepIN: 1000 },
  { key: 'dining', label: 'Restaurants', icon: '🍽️', defaultCA: 200, defaultIN: 4000, maxCA: 1500, maxIN: 30000, stepCA: 50, stepIN: 500 },
  { key: 'gas', label: 'Fuel', icon: '⛽', defaultCA: 200, defaultIN: 5000, maxCA: 1000, maxIN: 25000, stepCA: 25, stepIN: 500 },
  { key: 'travel', label: 'Travel & Hotels', icon: '✈️', defaultCA: 100, defaultIN: 2000, maxCA: 3000, maxIN: 60000, stepCA: 100, stepIN: 1000 },
  { key: 'online', label: 'Online Shopping', icon: '🛍️', defaultCA: 200, defaultIN: 5000, maxCA: 2000, maxIN: 40000, stepCA: 50, stepIN: 1000 },
  { key: 'amazon', label: 'Amazon', icon: '📦', defaultCA: 100, defaultIN: 3000, maxCA: 1500, maxIN: 25000, stepCA: 25, stepIN: 500 },
  { key: 'streaming', label: 'Streaming', icon: '🎬', defaultCA: 30, defaultIN: 500, maxCA: 200, maxIN: 3000, stepCA: 5, stepIN: 100 },
  { key: 'other', label: 'Everything else', icon: '💳', defaultCA: 300, defaultIN: 5000, maxCA: 3000, maxIN: 60000, stepCA: 50, stepIN: 1000 },
];

function StepperRow({ label, icon, value, onChange, min, max, step, currency }) {
  return (
    <View style={styles.stepperRow}>
      <Text style={{ fontSize: 22, marginRight: 12 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.stepperLabel}>{label}</Text>
        <Text style={styles.stepperValue}>{currency}{value.toLocaleString()}/mo</Text>
      </View>
      <TouchableOpacity onPress={() => onChange(Math.max(min, value - step))} activeOpacity={0.6} style={styles.stepperBtn}>
        <Text style={styles.stepperBtnText}>−</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onChange(Math.min(max, value + step))} activeOpacity={0.6} style={styles.stepperBtn}>
        <Text style={styles.stepperBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function RecommendScreen({ navigation }) {
  const { ownedCards, country, session } = useApp();
  const [step, setStep] = useState(1); // 1: spending, 2: results
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
          <View style={styles.logoMark}><Text style={styles.logoMarkText}>↗</Text></View>
          <Text style={styles.logoText}>SwipeRightt</Text>
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
                  min={0}
                  max={country.code === 'IN' ? c.maxIN : c.maxCA}
                  step={country.code === 'IN' ? c.stepIN : c.stepCA}
                  currency={cur}
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
  const [ownedCards, setOwnedCards] = useState([]);
  const [isGuest, setIsGuest] = useState(false);
  const [booting, setBooting] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Home');
  const [countryCode, setCountryCodeState] = useState('CA');

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
    setSession(null);
    setOwnedCards([]);
    setIsGuest(false);
  }

  useEffect(() => {
    async function boot() {
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
      if (s) {
        setSession({ id: s.user.id, email: s.user.email });
        const { data } = await sb.from('user_cards').select('cards').eq('user_id', s.user.id).single();
        if (data?.cards) { setOwnedCards(data.cards); await AsyncStorage.setItem('sr_cards', JSON.stringify(data.cards)); }
        setInitialRoute('Checkout');
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
      <AppContext.Provider value={{ session, setSession, ownedCards, setOwnedCards, toggleCard, saveCards, isGuest, setIsGuest, signOut, countryCode, setCountryCode, country }}>
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
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
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
  homeTopBar: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8 },
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
