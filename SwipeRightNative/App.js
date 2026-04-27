import React, { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, StatusBar, Animated, Dimensions,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sb } from './lib/supabase';
import { CARDS_DB, NETWORKS, STORES, getRate } from './data/cards';

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
  <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.6}
    style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled, style]}>
    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{label}</Text>}
  </TouchableOpacity>
);

const GhostBtn = ({ label, onPress, style }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.6} style={[styles.ghostBtn, style]}>
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
  <TouchableOpacity onPress={() => onToggle(card.id)} activeOpacity={0.6}
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

// ── HOME ──────────────────────────────────────────────────
function HomeScreen({ navigation }) {
  const { setIsGuest } = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.homeContainer}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
          <View style={[styles.logoRow, { marginBottom: 20 }]}>
            <View style={styles.logoMark}><Text style={styles.logoMarkText}>↗</Text></View>
            <Text style={styles.logoText}>SwipeRight</Text>
          </View>
          <Badge label="SMART CARD OPTIMIZATION" />
          <Text style={styles.heroTitle}>Always swipe{'\n'}the <Text style={styles.heroTitleAccent}>right card.</Text></Text>
          <Text style={styles.heroSub}>Tell us which cards you own. We'll instantly tell you which one to use at any store.</Text>
          <PrimaryBtn label="Get started free →" onPress={() => navigation.navigate('Login')} style={{ width: width - 48, marginBottom: 12 }} />
          <GhostBtn label="Try without signing in" onPress={() => { setIsGuest(true); navigation.navigate('Setup'); }} style={{ width: width - 48 }} />
          <View style={styles.featureRow}>
            {['💳 All major cards', '⚡ Instant results', '🔒 No password', '✨ Free forever'].map(f => (
              <View key={f} style={styles.featPill}><Text style={styles.featPillText}>{f}</Text></View>
            ))}
          </View>
        </Animated.View>
      </View>
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
  const { ownedCards, toggleCard, isGuest, session } = useApp();
  const [search, setSearch] = useState('');
  const [expandedNetwork, setExpandedNetwork] = useState(null);

  const featuredIds = {
    amex: ['amex-platinum', 'amex-gold', 'amex-bce', 'amex-bcp'],
    visa: ['chase-sapphire-reserve', 'chase-sapphire-preferred', 'chase-freedom-unlimited', 'cap1-venture-x'],
    mastercard: ['citi-double-cash', 'citi-custom-cash', 'citi-premier', 'cap1-quicksilver'],
  };

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return CARDS_DB.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.issuer.toLowerCase().includes(q) ||
      c.network.toLowerCase().includes(q) ||
      c.perks.some(p => p.toLowerCase().includes(q))
    );
  }, [search]);

  const isSearching = search.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navBar}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}><Text style={styles.logoMarkText}>↗</Text></View>
          <Text style={styles.logoText}>SwipeRight</Text>
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
                const card = CARDS_DB.find(c => c.id === id);
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
          NETWORKS.map(network => {
            const featured = featuredIds[network.id].map(id => CARDS_DB.find(c => c.id === id)).filter(Boolean);
            const allNetworkCards = CARDS_DB.filter(c => c.network === network.id);
            const remainingCards = allNetworkCards.filter(c => !featuredIds[network.id].includes(c.id));
            const isExpanded = expandedNetwork === network.id;
            const ownedInNetwork = allNetworkCards.filter(c => ownedCards.includes(c.id)).length;

            return (
              <View key={network.id} style={{ marginTop: 28 }}>
                <View style={styles.networkHeader}>
                  <View style={[styles.networkDot, { backgroundColor: network.color }]} />
                  <Text style={styles.networkLabel}>{network.label.toUpperCase()}</Text>
                  {ownedInNetwork > 0 && (
                    <View style={styles.networkCount}>
                      <Text style={styles.networkCountText}>{ownedInNetwork} selected</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardsGrid}>
                  {featured.map(card => (
                    <CardTile key={card.id} card={card} selected={ownedCards.includes(card.id)} onToggle={toggleCard} />
                  ))}
                </View>
                {!isExpanded ? (
                  <TouchableOpacity onPress={() => setExpandedNetwork(network.id)} style={styles.seeMoreBtn} activeOpacity={0.6}>
                    <Text style={styles.seeMoreText}>See all {allNetworkCards.length} {network.shortLabel} cards →</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <View style={[styles.cardsGrid, { marginTop: 10 }]}>
                      {remainingCards.map(card => (
                        <CardTile key={card.id} card={card} selected={ownedCards.includes(card.id)} onToggle={toggleCard} />
                      ))}
                    </View>
                    <TouchableOpacity onPress={() => setExpandedNetwork(null)} style={styles.seeMoreBtn} activeOpacity={0.6}>
                      <Text style={styles.seeMoreText}>Show less ↑</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            );
          })
        )}

        <PrimaryBtn label="Continue →" onPress={() => navigation.navigate('Checkout')} disabled={ownedCards.length === 0} style={{ marginTop: 28 }} />
        {isGuest && <Text style={[styles.hint, { textAlign: 'center', marginTop: 12 }]}>Sign in to save your cards permanently</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── CHECKOUT ──────────────────────────────────────────────
function CheckoutScreen({ navigation }) {
  const { ownedCards, session, signOut } = useApp();
  const [selectedStore, setSelectedStore] = useState(null);
  const [amount, setAmount] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(menuFade, {
      toValue: showMenu ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [showMenu]);
  const quickAmounts = [25, 50, 100, 200, 500];
  const owned = CARDS_DB.filter(c => ownedCards.includes(c.id));
  const ranked = selectedStore
    ? owned.map(card => ({ card, rate: getRate(card, selectedStore.category) })).sort((a, b) => b.rate - a.rate)
    : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navBar}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}><Text style={styles.logoMarkText}>↗</Text></View>
          <Text style={styles.logoText}>SwipeRight</Text>
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
        <Animated.View style={[styles.dropdown, { opacity: menuFade, transform: [{ scale: menuFade }] }]}>
          <Text style={styles.dropdownEmail} numberOfLines={1}>{session.email}</Text>
          <View style={{ height: 1, backgroundColor: C.glassBorder, marginVertical: 6 }} />
          <TouchableOpacity onPress={async () => { setShowMenu(false); await signOut(); navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); }}>
            <Text style={styles.dropdownItem}>Sign out</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" onScrollBeginDrag={() => setShowMenu(false)}>
        <Text style={styles.screenTitle}>Where are you{'\n'}shopping?</Text>
        <Text style={[styles.screenSub, { marginBottom: 20 }]}>Pick a store and enter the amount.</Text>

        <GlassCard style={{ marginBottom: 14 }}>
          <Text style={styles.fieldLabel}>SELECT A STORE</Text>
          <View style={styles.storeGrid}>
            {STORES.map(s => (
              <TouchableOpacity key={s.id} onPress={() => setSelectedStore(s)} activeOpacity={0.6}
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
            <Text style={styles.amountPrefix}>$</Text>
            <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount}
              keyboardType="decimal-pad" placeholder="0" placeholderTextColor={C.text3} selectionColor={C.purpleLight} />
          </View>
          <View style={styles.quickAmounts}>
            {quickAmounts.map(q => (
              <TouchableOpacity key={q} onPress={() => setAmount(String(q))} style={styles.quickBtn}>
                <Text style={styles.quickBtnText}>${q}</Text>
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
  const { ownedCards, session } = useApp();
  const { store, amount } = route.params;
  const owned = CARDS_DB.filter(c => ownedCards.includes(c.id));
  const ranked = owned.map(card => {
    const rate = getRate(card, store.category);
    return { card, rate, earned: +(amount * rate / 100).toFixed(2) };
  }).sort((a, b) => b.earned - a.earned);
  const best = ranked[0];

  if (!best) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.navBar}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}><Text style={styles.logoMarkText}>↗</Text></View>
          <Text style={styles.logoText}>SwipeRight</Text>
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
            <Text style={styles.rewardAmount}>${best.earned.toFixed(2)}</Text>
            <Text style={styles.rewardSub}>earned on ${amount.toFixed(2)}</Text>
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
                    <Text style={[styles.ratePillText, { color: rateColor }]}>{item.rate}% · ${item.earned.toFixed(2)}</Text>
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
      <AppContext.Provider value={{ session, setSession, ownedCards, setOwnedCards, toggleCard, saveCards, isGuest, setIsGuest, signOut }}>
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
});
